// A precision audit. Every message carries the balance AFTER the transaction, so each balance must equal
// the previous one plus or minus the transaction in between. Where it does not, a message is missing
// (the gap is the net amount that is unaccounted for) or something was misread.
// Pure function: no database, no framework.

export interface BalanceRow {
  id: string;
  institution: string;
  direction: 'in' | 'out';
  amount: number; // cents
  fee: number; // cents
  balanceAfter: number | null; // cents
  at: Date;
}

export interface ChainBreak {
  institution: string;
  id: string;
  at: Date;
  expected: number;
  actual: number;
  gap: number; // actual - expected: positive = money arrived that no message explains, negative = money left
}

export interface ChainReport {
  checked: number; // consecutive pairs we could compare
  consistent: number;
  skipped: number; // pairs we could not compare (no balance, or the same second)
  breaks: ChainBreak[];
}

export function checkBalanceChain(rows: BalanceRow[]): ChainReport {
  const report: ChainReport = { checked: 0, consistent: 0, skipped: 0, breaks: [] };

  const byInstitution = new Map<string, BalanceRow[]>();
  for (const r of rows) {
    const list = byInstitution.get(r.institution) ?? [];
    list.push(r);
    byInstitution.set(r.institution, list);
  }

  for (const [institution, list] of byInstitution) {
    const sorted = [...list].sort((a, b) => a.at.getTime() - b.at.getTime());
    let prev: BalanceRow | null = null;

    for (const row of sorted) {
      // A row with no balance (a loan, say) changes the balance by an amount we cannot see:
      // start a fresh chain after it rather than report a false break.
      if (row.balanceAfter === null) {
        if (prev) report.skipped++;
        prev = null;
        continue;
      }
      if (prev && prev.balanceAfter !== null) {
        if (prev.at.getTime() === row.at.getTime()) {
          // Two messages in the same second: their order is unknown, so this pair cannot be judged.
          report.skipped++;
        } else {
          const delta = row.direction === 'in' ? row.amount : -(row.amount + row.fee);
          const expected = prev.balanceAfter + delta;
          report.checked++;
          if (expected === row.balanceAfter) report.consistent++;
          else report.breaks.push({ institution, id: row.id, at: row.at, expected, actual: row.balanceAfter, gap: row.balanceAfter - expected });
        }
      }
      prev = row;
    }
  }

  report.breaks.sort((a, b) => a.at.getTime() - b.at.getTime());
  return report;
}