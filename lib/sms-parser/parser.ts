// Pure function: SMS text in -> structured transaction (or "ignored" / "unknown") out.
// No network, no database, no Android APIs. That keeps it testable and portable to Kotlin.

export type Institution = 'CBE' | 'TELEBIRR';
export type Direction = 'in' | 'out';
export type Kind =
  | 'transfer_in'
  | 'transfer_out'
  | 'payment'
  | 'debit'
  | 'credit'
  | 'loan_received'
  | 'loan_repayment';

export interface SmsInput {
  body: string;
  receivedAt: Date; // the phone's timestamp for the SMS (some messages have no date inside)
}

export interface ParsedTransaction {
  institution: Institution;
  kind: Kind;
  direction: Direction;
  amount: number; // minor units (1 birr = 100), WITHOUT fees
  fee: number; // minor units: service charge + VAT + disaster recovery
  currency: 'ETB';
  balanceAfter: number | null; // minor units
  counterparty: string | null;
  description: string | null;
  reference: string | null;
  occurredAt: string; // ISO 8601
  dateSource: 'sms_body' | 'received_at';
  dedupeKey: string;
  needsReview: boolean; // true when the arithmetic does not add up
}

export type ParseResult =
  | { status: 'parsed'; tx: ParsedTransaction }
  | { status: 'ignored'; reason: string }
  | { status: 'unknown' };

// ---------- small building blocks ----------

// "1,000.00", "100.0", "5", "65.20"
const NUM = String.raw`[\d,]+(?:\.\d+)?`;
// "ETB 130.00" and "ETB130.00" (both appear in real messages)
const etb = (name: string) => String.raw`ETB\s*(?<${name}>${NUM})`;
// "2026-09-05 13:57:50" (telebirr, bank-credit message) or "29/09/2026 16:50:06" (DD/MM/YYYY)
const DATE = String.raw`\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}|\d{2}/\d{2}/\d{4} (?:at )?\d{2}:\d{2}:\d{2}`;
const ACCT = String.raw`[\d*]+`; // masked account like 1**2922

/** "1,000.00" -> 100000. String math only, never floats. */
export function toMinor(s: string): number {
  const [int, frac = ''] = s.replace(/,/g, '').split('.');
  return Number(int) * 100 + Number((frac + '00').slice(0, 2));
}

/** Add up every money amount in a fee description like
 *  "Service charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Recovery(5%) of 0.03" */
function sumMoney(segment: string): number {
  const re = new RegExp(String.raw`(?:ETB|\bof)\s*(${NUM})`, 'g');
  let total = 0;
  for (const m of segment.matchAll(re)) total += toMinor(m[1]);
  return total;
}

/** Ethiopia is UTC+3 all year. Returns null if the format is unexpected. */
function parseDate(raw: string): string | null {
  const s = raw.replace(' at ', ' '); // "29/09/2026 at 16:50:06" -> "29/09/2026 16:50:06"
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2}:\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}+03:00`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}T${m[4]}+03:00`;
  return null;
}

/** Third-party phone numbers are stored masked: 251911223344 -> 2519****3344 */
function maskPhone(s: string): string {
  return /^\d{8,}$/.test(s) ? s.slice(0, 4) + '****' + s.slice(-4) : s;
}

function findBalance(text: string): number | null {
  const m = text.match(new RegExp(String.raw`current (?:E-Money Account )?balance is ETB\s*(${NUM})`, 'i'));
  return m ? toMinor(m[1]) : null;
}

/** CBE has no "reference" field, but the receipt link ends with an id.
 *  .../BranchReceipt/FT26273XLQK1&32452922 -> FT26273XLQK1 */
function findCbeReceiptId(text: string): string | null {
  const m = text.match(/cbe\.com\.et(?::\d+)?\/(?:BranchReceipt\/)?([\w-]+)/);
  return m ? m[1] : null;
}

// ---------- one rule per message template ----------
// Named groups the builder understands:
//   amount  principal amount            total  amount INCLUDING fees
//   fee     a single fee                fees   text containing several fees
//   party   other person/institution    what   description   ref   transaction id   date

interface Rule {
  name: string;
  institution: Institution;
  kind: Kind;
  direction: Direction;
  pattern: RegExp;
  maskParty?: boolean; // the "party" is a phone number: store it masked
}

const rules: Rule[] = [
  // ---- telebirr ----
  {
    name: 'telebirr_received_from_bank',
    institution: 'TELEBIRR', kind: 'transfer_in', direction: 'in',
    pattern: new RegExp(
      String.raw`You have received ${etb('amount')} by transaction number (?<ref>[A-Z0-9]+) on (?<date>${DATE}) from (?<party>.+?) to your telebirr Account`,
    ),
  },
  {
    name: 'telebirr_received_from_person',
    institution: 'TELEBIRR', kind: 'transfer_in', direction: 'in',
    pattern: new RegExp(
      String.raw`You have received ${etb('amount')} from (?<party>.+?)\s*\([^)]*\) on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)`,
    ),
  },
  {
    name: 'telebirr_transfer_out',
    institution: 'TELEBIRR', kind: 'transfer_out', direction: 'out',
    pattern: new RegExp(
      String.raw`You have transferred ${etb('amount')} to (?<party>.+?)\s*\([^)]*\) on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)\. The service fee is (?<fees>ETB.+?)\. Your current`,
    ),
  },
  {
    name: 'telebirr_package_payment',
    institution: 'TELEBIRR', kind: 'payment', direction: 'out',
    pattern: new RegExp(
      String.raw`You have paid ${etb('amount')} for (?<what>.+?) purchase made for \d+ on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)\.`,
    ),
  },
  {
    name: 'telebirr_airtime_received',
    institution: 'TELEBIRR', kind: 'transfer_in', direction: 'in', maskParty: true,
    pattern: new RegExp(
      String.raw`You have received ${etb('amount')} (?<what>airtime) from (?<party>\d+) on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)`,
    ),
  },
  {
    name: 'telebirr_airtime_recharge',
    institution: 'TELEBIRR', kind: 'payment', direction: 'out',
    pattern: new RegExp(
      String.raw`You have recharged ${etb('amount')} (?<what>airtime) for \d+ on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)\.`,
    ),
  },
  {
    name: 'telebirr_package_subscription',
    institution: 'TELEBIRR', kind: 'payment', direction: 'out',
    pattern: new RegExp(
      String.raw`You have paid ${etb('amount')} for (?<what>.+?) to \d+ on (?<date>${DATE})\. Your transaction number is (?<ref>[A-Z0-9]+)\.`,
    ),
  },
  {
    // telebirr -> CBE: moving your own money back to the bank
    name: 'telebirr_to_cbe',
    institution: 'TELEBIRR', kind: 'transfer_out', direction: 'out',
    pattern: new RegExp(
      String.raw`You have transferred ${etb('amount')} successfully from your telebirr account \d+ to (?<party>Commercial Bank of Ethiopia) account number \d+ on (?<date>${DATE})\. Your telebirr transaction number is (?<ref>[A-Z0-9]+) and your bank transaction number is [A-Z0-9]+\. The service fee is (?<fees>ETB.+?)\. Your current balance`,
    ),
  },
  {
    name: 'telebirr_loan_repayment',
    institution: 'TELEBIRR', kind: 'loan_repayment', direction: 'out',
    pattern: new RegExp(String.raw`You have repaid (?<amount>${NUM}) ETB, for your (?<what>.+?) contract\.`),
  },
  {
    // second wording of a repayment: "your outstanding Credit amount has been paid successfully"
    name: 'telebirr_credit_paid',
    institution: 'TELEBIRR', kind: 'loan_repayment', direction: 'out',
    pattern: new RegExp(
      String.raw`your outstanding Credit amount has been paid successfully\. The paid amount is ${etb('amount')}`,
    ),
  },
  {
    name: 'telebirr_loan_received',
    institution: 'TELEBIRR', kind: 'loan_received', direction: 'in',
    pattern: new RegExp(
      String.raw`Your credit request with (?<ref>[A-Z0-9]+) contract number is successful\. The credit amount is ${etb('amount')} and facilitation fee ${etb('fee')} with due date`,
    ),
  },

  // ---- CBE ----
  {
    name: 'cbe_received_from_account',
    institution: 'CBE', kind: 'transfer_in', direction: 'in',
    pattern: new RegExp(
      String.raw`You have received ${etb('amount')} from account ${ACCT} \((?<party>[^)]+)\) to your account ${ACCT}\.`,
    ),
  },
  {
    name: 'cbe_credited_by',
    institution: 'CBE', kind: 'credit', direction: 'in',
    pattern: new RegExp(String.raw`has been credited by (?<party>.+?) with ${etb('amount')}\.`),
  },
  {
    name: 'cbe_transfer_out',
    institution: 'CBE', kind: 'transfer_out', direction: 'out',
    pattern: new RegExp(
      String.raw`You have successfully transferred ${etb('amount')} from account ${ACCT} to account ${ACCT} \((?<party>[^)]+)\)\. (?<fees>Service charge.+?) with total of ${etb('total')}`,
    ),
  },
  {
    name: 'cbe_debit_occurred',
    institution: 'CBE', kind: 'debit', direction: 'out',
    // the real text has a stray dot: "ETB 100.0. has occurred"
    pattern: new RegExp(
      String.raw`A debit transaction of ${etb('amount')}\.? has occurred on your account ${ACCT}\. (?<fees>Service charge.+?) with total of ${etb('total')}`,
    ),
  },
  {
    name: 'cbe_debited_including_charges',
    institution: 'CBE', kind: 'debit', direction: 'out',
    // only the TOTAL is given; the principal is total minus fees
    pattern: new RegExp(
      String.raw`has been debited with ${etb('total')} including (?<fees>.+?)\. Your Current Balance`,
    ),
  },
  {
    // older wording: the amount, then the charges, then the total
    name: 'cbe_debited_old_wording',
    institution: 'CBE', kind: 'debit', direction: 'out',
    pattern: new RegExp(
      String.raw`has been debited with ${etb('amount')}\s*\.?\s*Service charge of (?<fees>.+?) with a total of ${etb('total')}`,
    ),
  },
  {
    // "credited with" names no sender (as opposed to "credited by NAME")
    name: 'cbe_credited_with',
    institution: 'CBE', kind: 'credit', direction: 'in',
    pattern: new RegExp(String.raw`has been credited with ${etb('amount')}\s*\.`),
  },
  {
    // a transfer to a person, with the date and time inside the message
    name: 'cbe_transfer_out_dated',
    institution: 'CBE', kind: 'transfer_out', direction: 'out',
    pattern: new RegExp(
      String.raw`You have transferr?ed ${etb('amount')} to (?<party>.+?) on (?<date>${DATE}) from your account ${ACCT}\. Your account has been debited with a (?<fees>S\.charge.+?), with a total of ${etb('total')}`,
    ),
  },
];

// Messages we recognise on purpose and deliberately do not turn into transactions.
const ignoreRules: { reason: string; pattern: RegExp }[] = [
  { reason: 'loan_overdue_notice', pattern: /outstanding credit balance of ETB .+ overdue/ },
  { reason: 'wrong_pin', pattern: /your PIN or password is incorrect/i },
];

// ---------- the public function ----------

export function parseSms({ body, receivedAt }: SmsInput): ParseResult {
  const text = body.replace(/\s+/g, ' ').trim(); // real SMS have double spaces and newlines

  for (const rule of rules) {
    const m = rule.pattern.exec(text);
    if (m?.groups) return { status: 'parsed', tx: build(rule, m.groups, text, receivedAt) };
  }
  for (const ig of ignoreRules) {
    if (ig.pattern.test(text)) return { status: 'ignored', reason: ig.reason };
  }
  // Awareness messages, greetings and OTPs mention no money at all. "Unknown" is kept for
  // messages that DO mention money but match no rule, because those are the ones worth a look.
  if (!/ETB|ብር/.test(text)) return { status: 'ignored', reason: 'not_financial' };
  return { status: 'unknown' }; // never guess
}

function build(rule: Rule, g: Record<string, string | undefined>, text: string, receivedAt: Date): ParsedTransaction {
  const fee = g.fee ? toMinor(g.fee) : g.fees ? sumMoney(g.fees) : 0;

  let amount: number;
  let needsReview = false;
  if (g.amount) {
    amount = toMinor(g.amount);
    // self-check: principal + fees must equal the total the bank printed
    if (g.total) {
      const total = toMinor(g.total);
      if (amount + fee !== total) {
        // some wordings print the gross (amount + fees) as "the amount"
        if (amount === total && fee > 0) amount = total - fee;
        else needsReview = true;
      }
    }
  } else {
    amount = toMinor(g.total!) - fee;
    if (amount <= 0) needsReview = true;
  }

  const balanceAfter = findBalance(text);
  const reference = g.ref ?? (rule.institution === 'CBE' ? findCbeReceiptId(text) : null);
  const bodyDate = g.date ? parseDate(g.date) : null;
  const occurredAt = bodyDate ?? receivedAt.toISOString();

  // Some messages have no reference at all, and two different transactions can have
  // identical text (two "debited with ETB 100.42" messages). The balance and the SMS
  // timestamp tell them apart.
  const dedupeKey = reference
    ? `${rule.institution}:${reference}`
    : `${rule.institution}:${rule.kind}:${Math.floor(receivedAt.getTime() / 1000)}:${amount}:${balanceAfter ?? ''}`;

  return {
    institution: rule.institution,
    kind: rule.kind,
    direction: rule.direction,
    amount,
    fee,
    currency: 'ETB',
    balanceAfter,
    counterparty: g.party ? (rule.maskParty ? maskPhone(g.party.trim()) : g.party.trim()) : null,
    description: g.what?.trim() ?? null,
    reference,
    occurredAt,
    dateSource: bodyDate ? 'sms_body' : 'received_at',
    dedupeKey,
    needsReview,
  };
}