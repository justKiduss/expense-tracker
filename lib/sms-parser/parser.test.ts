import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSms, toMinor, type ParsedTransaction } from './parser';

// Fixtures keep the exact wording, spacing, typos and number formats of real messages.
// Names, phone numbers, account digits and transaction ids are replaced with fake ones
// (same shape). Do the same before putting real messages in a Git repository.

const TB_FOOT = `\nThank you for using telebirr\nEthio telecom`;
const CBE_FB = `https://forms.gle/FAKEFORMID`;

type Expect = Partial<ParsedTransaction>;
interface Fixture { name: string; body: string; ignored?: string; expect?: Expect }

const fixtures: Fixture[] = [
  // ----- telebirr -----
  {
    name: 'overdue notice (4th)',
    ignored: 'loan_overdue_notice',
    body: `Dear Test,   \nYour outstanding credit balance of ETB 1055.80 is 10 days overdue. This is the 4th notice, please pay promptly to avoid BLOCK listing. Be aware that if you do not pay your debts in full, you will not be able to borrow in the future and will be subject to legal action\n\nThank you for using telebirr\nEthio telecom in partnership with CBE`,
  },
  {
    name: 'received from bank',
    body: `Dear Test,\nYou have received  ETB 1,000.00 by transaction number DI00AAAA01 on 2026-09-05 13:57:50 from Commercial Bank of Ethiopia to your telebirr Account 251900000000 - Test User. Your current balance is ETB 1,000.00.${TB_FOOT}`,
    expect: { institution: 'TELEBIRR', kind: 'transfer_in', direction: 'in', amount: 100000, fee: 0, balanceAfter: 100000, reference: 'DI00AAAA01', counterparty: 'Commercial Bank of Ethiopia', occurredAt: '2026-09-05T13:57:50+03:00', dateSource: 'sms_body' },
  },
  {
    name: 'loan repayment 1,000',
    body: `Dear Test\nYou have repaid 1,000.00 ETB, for your 25-Days Enderas contract. Your current unpaid credit amount is 64.80 ETB. ${TB_FOOT}`,
    expect: { kind: 'loan_repayment', direction: 'out', amount: 100000, balanceAfter: null, reference: null, dateSource: 'received_at', description: '25-Days Enderas' },
  },
  {
    name: 'overdue notice (5th)',
    ignored: 'loan_overdue_notice',
    body: `Dear Test,   \nYour outstanding credit balance of ETB 65.20 is 20 days overdue. This is the 5th notice, pay promptly to avoid BLOCK listing.Be aware that if you do not pay your debt in full, you will not be able to borrow from telebirr, and you will be subject to legal action.\n\nThank you for using telebirr\nEthio telecom in partnership with CBE`,
  },
  {
    name: 'received from person',
    body: `Dear Test \nYou have received ETB 200.00 from Person A(2519****0001)  on 23/09/2026 14:54:08. Your transaction number is DIN00AAA02. Your current E-Money Account balance is ETB 200.00.${TB_FOOT}`,
    expect: { kind: 'transfer_in', amount: 20000, balanceAfter: 20000, reference: 'DIN00AAA02', counterparty: 'Person A', occurredAt: '2026-09-23T14:54:08+03:00' },
  },
  {
    name: 'loan repayment 66.60',
    body: `Dear Test\nYou have repaid 66.60 ETB, for your 25-Days Enderas contract. Your current unpaid credit amount is 0.00 ETB. ${TB_FOOT}`,
    expect: { kind: 'loan_repayment', amount: 6660 },
  },
  {
    name: 'credit paid successfully (second repayment wording)',
    body: `Dear Test,\nyour outstanding Credit amount has been paid successfully. The paid amount is ETB 762.86, your monthly outstanding amount is ETB 0.00 and your total outstanding amount is ETB 0.00.\nThank you for using telebirr\nEthio telecom in partnership with CBE`,
    expect: { kind: 'loan_repayment', direction: 'out', amount: 76286, fee: 0, balanceAfter: null, reference: null, dateSource: 'received_at' },
  },
  {
    name: 'Amharic fraud-awareness message is not financial',
    ignored: 'not_financial',
    body: `ውድ ደንበኞችን፡\n\nውድ ደንበኞችን ራስዎን ከአጭበርባሪዎች ለመከላከል ይህን በጥንቃቄ ይተግብሩ፡\n\n* ከባንክ ነው በሚል የሚደርስዎትን የስልክ ጥሪ ትክክለኛነት ወደ ባንካችን ቅርንጫፍ በመሄድ ወይም ወደ 951 በመደወል ሳያረጋግጡ ምንም ዓይነት እርምጃ አይውሰዱ፤`,
  },
  {
    name: 'holiday greeting is not financial',
    ignored: 'not_financial',
    body: `ውድ ደንበኞችን እንኳን ለኢሬቻ በዓል በሰላም አደረሰዎ! የኢትዮጵያ ንግድ ባንክ፣ ሁሌም የሚተማመኑበት ባንክ። https://combanketh.et/holidays`,
  },
  {
    name: 'transfer out 130 with fee',
    body: `Dear Test \nYou have transferred ETB 130.00 to Person B (0922****01) on 29/09/2026 16:50:06. Your transaction number is DIT00AAA03. The service fee is  ETB 1.74 and  15% VAT on the service fee is ETB 0.26. Your current E-Money Account  balance is ETB 1.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/DIT00AAA03.\n${TB_FOOT}`,
    expect: { kind: 'transfer_out', direction: 'out', amount: 13000, fee: 200, balanceAfter: 140, reference: 'DIT00AAA03', counterparty: 'Person B', occurredAt: '2026-09-29T16:50:06+03:00' },
  },
  {
    name: 'package payment 1.00',
    body: `Dear Test\nYou have paid ETB 1.00 for package Voice One hour Package for 5 Min purchase made for 900000000 on 01/10/2026 16:20:53. Your transaction number is  DJ00AAA04. Your current balance is ETB 0.40.To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/DJ00AAA04${TB_FOOT}`,
    expect: { kind: 'payment', amount: 100, balanceAfter: 40, reference: 'DJ00AAA04', description: 'package Voice One hour Package for 5 Min' },
  },
  {
    name: 'received from bank 100',
    body: `Dear Test,\nYou have received  ETB 100.00 by transaction number DJ00AAA05 on 2026-10-01 17:25:51 from Commercial Bank of Ethiopia to your telebirr Account 251900000000 - Test User. Your current balance is ETB 100.40.${TB_FOOT}`,
    expect: { amount: 10000, balanceAfter: 10040, reference: 'DJ00AAA05' },
  },
  {
    name: 'package payment 25',
    body: `Dear Test\nYou have paid ETB 25.00 for package Weekly Birr 25 for 84Min+42 Min Night bonus purchase made for 251900000000 on 01/10/2026 17:28:15. Your transaction number is  DJ00AAA06. Your current balance is ETB 75.40.To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/DJ00AAA06${TB_FOOT}`,
    expect: { amount: 2500, balanceAfter: 7540, description: 'package Weekly Birr 25 for 84Min+42 Min Night bonus' },
  },
  {
    name: 'transfer out 30',
    body: `Dear Test \nYou have transferred ETB 30.00 to Person C (0913****02) on 01/10/2026 17:50:01. Your transaction number is DJ00AAA07. The service fee is  ETB 0.87 and  15% VAT on the service fee is ETB 0.13. Your current E-Money Account  balance is ETB 44.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/DJ00AAA07.\n${TB_FOOT}`,
    expect: { amount: 3000, fee: 100, balanceAfter: 4440 },
  },
  ...[
    ['DJ00AAA08', '01/10/2026 20:11:25', '39.40', 3940],
    ['DJ00AAA09', '01/10/2026 20:41:31', '34.40', 3440],
    ['DJ00AAA10', '02/10/2026 11:35:46', '29.40', 2940],
  ].map(([ref, when, bal, balMinor]): Fixture => ({
    name: `daily package 5 (${ref})`,
    body: `Dear Test\nYou have paid ETB 5.00 for package Daily Birr 5 for 120 MB purchase made for 251900000000 on ${when}. Your transaction number is  ${ref}. Your current balance is ETB ${bal}.To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/${ref}${TB_FOOT}`,
    expect: { amount: 500, balanceAfter: balMinor as number, reference: ref as string },
  })),
  {
    name: 'loan received 700',
    body: `Dear Test,   \nYour credit request with DJ00AAA11 contract number is successful. The credit amount is ETB 700.00 and facilitation fee ETB 17.50 with due date 27/10/2026 and the daily fee will be from 0.50% to 0,80% depending on your credit limit. Your current available credit limit ETB300.00.\nThank you for using telebirr\nEthio telecom in partnership with CBE Bank`,
    expect: { kind: 'loan_received', direction: 'in', amount: 70000, fee: 1750, reference: 'DJ00AAA11', balanceAfter: null },
  },
  {
    name: 'transfer out 440',
    body: `Dear Test \nYou have transferred ETB 440.00 to Person D (2519****0003) on 02/10/2026 15:03:59. Your transaction number is DJ00AAA12. The service fee is  ETB 1.74 and  15% VAT on the service fee is ETB 0.26. Your current E-Money Account  balance is ETB 280.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/DJ00AAA12.\n${TB_FOOT}`,
    expect: { amount: 44000, fee: 200, balanceAfter: 28040 },
  },
  {
    name: 'wrong PIN',
    ignored: 'wrong_pin',
    body: `Sorry, your PIN or password is incorrect. please check and try again.\nFor any support and information related to telebirr service \nSend SMS to 126 or Contact us via\nTelegram: https://t.me/telebirr \n${TB_FOOT}`,
  },

  // ----- CBE -----
  {
    name: 'CBE received from account',
    body: `Dear Test User You have received ETB 150.00 from account 1**0001 (Person E) to your account 1**0002. Your current balance is ETB221.46. Thanks for Banking with CBE. https://mbreciept.cbe.com.et/v2-FakeToken0001  for feedback: ${CBE_FB}`,
    expect: { institution: 'CBE', kind: 'transfer_in', amount: 15000, fee: 0, balanceAfter: 22146, reference: 'v2-FakeToken0001', counterparty: 'Person E', dateSource: 'received_at' },
  },
  {
    name: 'CBE debited incl. charges (first)',
    body: `Dear Mr Test your Account 1****0002 has been debited with ETB 100.42 including Service charge ETB0.35ETB0.02 and VAT(15%) ETB0.05. Your Current Balance is ETB 121.04. Thank you for Banking with CBE!. For feedback https://shorturl.at/FAKE1`,
    expect: { kind: 'debit', direction: 'out', amount: 10000, fee: 42, balanceAfter: 12104, reference: null },
  },
  {
    name: 'CBE transferred 100',
    body: `Dear  Test User You have successfully transferred ETB100.00 from account 1**0002 to account 1**0003 (Person F). Service charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Recovery(5%) of 0.03 with total of ETB100.61 .Your current balance is ETB20.43. Thanks for Banking with CBE. https://mbreciept.cbe.com.et/v2-FakeToken0002  for feedback: ${CBE_FB}`,
    expect: { kind: 'transfer_out', amount: 10000, fee: 61, balanceAfter: 2043, reference: 'v2-FakeToken0002', counterparty: 'Person F' },
  },
  {
    name: 'CBE credited by name',
    body: `Dear Mr Test your Account 1****0002 has been credited by PERSON G with ETB 1500.00. Your Current Balance is ETB 1520.43. Thank you for Banking with CBE! for Reciept https://apps.cbe.com.et:100/BranchReceipt/FT00000AAAA1&00000002`,
    expect: { kind: 'credit', direction: 'in', amount: 150000, balanceAfter: 152043, reference: 'FT00000AAAA1', counterparty: 'PERSON G' },
  },
  {
    name: 'CBE debited incl. charges (second, same text as first)',
    body: `Dear Mr Test your Account 1****0002 has been debited with ETB 100.42 including Service charge ETB0.35ETB0.02 and VAT(15%) ETB0.05. Your Current Balance is ETB 1420.01. Thank you for Banking with CBE!. For feedback https://shorturl.at/FAKE1`,
    expect: { amount: 10000, fee: 42, balanceAfter: 142001 },
  },
  {
    name: 'CBE debit transaction "100.0."',
    body: `Dear Test User A debit transaction of ETB 100.0. has occurred on your account 1****0002. Service charge of ETB 10.00 and VAT(15%) of ETB1.50 and Disaster Recovery(5%) of 0.50 with total of ETB112.00 .Your current balance is ETB1,308.01. Thanks for Banking with CBE. https://mbreciept.cbe.com.et/v2-FakeToken0003  for feedback: ${CBE_FB}`,
    expect: { kind: 'debit', amount: 10000, fee: 1200, balanceAfter: 130801, reference: 'v2-FakeToken0003' },
  },
  {
    name: 'CBE debit transaction 998.99',
    body: `Dear Test User A debit transaction of ETB 998.99. has occurred on your account 1****0002. Service charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Recovery(5%) of 0.03 with total of ETB999.60 .Your current balance is ETB308.41. Thanks for Banking with CBE. https://mbreciept.cbe.com.et/v2-FakeToken0004  for feedback: ${CBE_FB}`,
    expect: { amount: 99899, fee: 61, balanceAfter: 30841 },
  },
  {
    name: 'CBE transferred 170',
    body: `Dear  Test User You have successfully transferred ETB170.00 from account 1**0002 to account 1**0004 (Person H). Service charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Recovery(5%) of 0.03 with total of ETB170.61 .Your current balance is ETB137.80. Thanks for Banking with CBE. https://mbreciept.cbe.com.et/v2-FakeToken0005  for feedback: ${CBE_FB}`,
    expect: { amount: 17000, fee: 61, balanceAfter: 13780 },
  },

  // ----- formats found on a real phone (digits and names are fake) -----
  {
    name: 'CBE old-wording debit with charges',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB100.00 .Service charge of  ETB0.4 , VAT(15%) of ETB0.06 and (5%) disaster Fund of ETB0.02 with a total of ETB100.48. Your Current Balance is ETB 20.00. Thank you for Banking with CBE! https://apps.cbe.com.et:100/BranchReceipt/FT00000AAAA2&00001234`,
    expect: { institution: 'CBE', kind: 'debit', direction: 'out', amount: 10000, fee: 48, balanceAfter: 2000, reference: 'FT00000AAAA2', needsReview: false },
  },
  {
    name: 'CBE old-wording debit with no charges and a total without decimals',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB100.00 .Service charge of  ETB0 , VAT(15%) of ETB0.00 and (5%) disaster Fund of ETB0.00 with a total of ETB100. Your Current Balance is ETB 20.00. Thank you for Banking with CBE! https://shorturl.at/ABC`,
    expect: { kind: 'debit', amount: 10000, fee: 0, balanceAfter: 2000, reference: null, needsReview: false },
  },
  {
    name: 'CBE old-wording debit where the "amount" is the gross including charges',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB100.48 .Service charge of  ETB0.4 , VAT(15%) of ETB0.06 and (5%) disaster Fund of ETB0.02 with a total of ETB100.48. Your Current Balance is ETB 20.00. Thank you for Banking with CBE!`,
    expect: { amount: 10000, fee: 48, needsReview: false },
  },
  {
    name: 'CBE credited with (no sender name, no decimals)',
    body: `Dear Customer your Account 1********1234 has been credited with ETB 500. Your Current Balance is ETB 1500.00. Thank you for Banking with CBE!`,
    expect: { institution: 'CBE', kind: 'credit', direction: 'in', amount: 50000, fee: 0, balanceAfter: 150000, reference: null, counterparty: null },
  },
  {
    name: 'CBE credited with (one decimal, with receipt link)',
    body: `Dear Mr Kidus your Account 1********1234 has been credited with ETB 250.5. Your Current Balance is ETB 1750.5. Thank you for Banking with CBE!. For feedback https://shorturl.at/XX for Reciept https://apps.cbe.com.et:100/BranchReceipt/FT00000BBBB3&00001234`,
    expect: { kind: 'credit', amount: 25050, balanceAfter: 175050, reference: 'FT00000BBBB3' },
  },
  {
    name: 'CBE dated transfer to a person ("transfered", "at hh:mm:ss")',
    body: `Dear Kidus, You have transfered ETB 1,200.00 to Person X on 29/09/2026 at 16:50:06 from your account 1**********1234. Your account has been debited with a S.charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Fund (5%) of ETB0.03, with a total of ETB 1,200.61. Your Current Balance is ETB 800.00. Thank you for Banking with CBE! https://mbreciept.cbe.com.et/v2-FakeToken0009 For feedback click the link https://forms.gle/FAKE`,
    expect: { institution: 'CBE', kind: 'transfer_out', direction: 'out', amount: 120000, fee: 61, balanceAfter: 80000, counterparty: 'Person X', reference: 'v2-FakeToken0009', occurredAt: '2026-09-29T16:50:06+03:00', dateSource: 'sms_body', needsReview: false },
  },
  {
    name: 'telebirr airtime received (sender number is stored masked)',
    body: `Dear Customer\nYou have received ETB 10.00 airtime from 251911223344 on 05/10/2026 09:15:30. Your transaction number is CLB1U23SRF.\nThank you for using telebirr\nethio telecom`,
    expect: { institution: 'TELEBIRR', kind: 'transfer_in', direction: 'in', amount: 1000, description: 'airtime', counterparty: '2519****3344', reference: 'CLB1U23SRF', occurredAt: '2026-10-05T09:15:30+03:00' },
  },
  {
    name: 'telebirr airtime recharge',
    body: `Dear kaleab\nYou have recharged ETB 20.00 airtime for 941201020 on 06/10/2026 10:00:00. Your transaction number is CLB2U34SRF. Your current  balance is  ETB 55.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CLB2U34SRF\nFor any support and information related to telebirr service\nSend SMS to 126 or Contact us via\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'payment', direction: 'out', amount: 2000, balanceAfter: 5540, description: 'airtime', reference: 'CLB2U34SRF' },
  },
  {
    name: 'telebirr package subscription',
    body: `Dear kaleab\n You have paid ETB 99.00 for package subscription to 941201020 on 07/10/2026 11:30:00. Your transaction number is BGR1UOXU23. Your current balance is ETB 120.40.\nFor any support and information related to telebirr service\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'payment', amount: 9900, balanceAfter: 12040, description: 'package subscription', reference: 'BGR1UOXU23' },
  },
  {
    name: 'telebirr to CBE (own money back to the bank)',
    body: `Dear Kidus,\nYou have transferred ETB 500.00 successfully from your telebirr account 251911223344 to Commercial Bank of Ethiopia account number 1000123456789 on 08/10/2026 12:00:00. Your telebirr transaction number is CDN1VNVLCG and your bank transaction number is FT26281TC12K. The service fee is ETB 1.74 and  15% VAT on the service fee is ETB 0.26. Your current balance is ETB 300.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CDN1VNVLCG\nThank you for using telebirr\nEthio telecom`,
    expect: { institution: 'TELEBIRR', kind: 'transfer_out', direction: 'out', amount: 50000, fee: 200, balanceAfter: 30040, counterparty: 'Commercial Bank of Ethiopia', reference: 'CDN1VNVLCG', occurredAt: '2026-10-08T12:00:00+03:00' },
  },

  // ----- second batch of formats from the same phone -----
  {
    name: 'CBE simple debit (amount and balance only)',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB 100.00. Your Current Balance is ETB 20.00 Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { institution: 'CBE', kind: 'debit', direction: 'out', amount: 10000, fee: 0, balanceAfter: 2000, reference: null, needsReview: false },
  },
  {
    name: 'CBE simple debit with no decimals and "Mr"',
    body: `Dear Mr Kidus your Account 1********1234 has been debited with ETB 450. Your Current Balance is ETB 1000.00. Thank you for Banking with CBE!. For feedback https://shorturl.at/AB`,
    expect: { kind: 'debit', amount: 45000, fee: 0, balanceAfter: 100000 },
  },
  {
    name: 'CBE monthly mobile banking fee',
    body: `Dear Customer your Account 1********1234 has been debited with ETB 5.75. Info: Mobile Banking Monthly Service Fee including VAT(15%) ETB0.75. Your Current Balance is ETB 120. Thank you for Banking with CBE!. Please give us your feedback by clicking the link below (ስላገኙት አገልግሎት የሚከተለውን ማስፈንጠሪያ በመጫን አስተያየቶን ይስጡን።)https://shorturl.at/XY`,
    expect: { kind: 'debit', direction: 'out', amount: 575, fee: 0, balanceAfter: 12000, description: 'Mobile Banking Monthly Service Fee' },
  },
  {
    name: 'telebirr transfer with the fee quoted as one amount including VAT',
    body: `Dear kaleab\nYou have transferred ETB 130.00 to Person Y(251911223344) on 09/10/2026 16:18:00. Your transaction number is CAS1I2Q3W4. The service fee (including 15% VAT) is  ETB 2.00. Your current E-Money Account  balance is ETB 31.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CAS1I2Q3W4\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'transfer_out', direction: 'out', amount: 13000, fee: 200, balanceAfter: 3140, counterparty: 'Person Y', reference: 'CAS1I2Q3W4', occurredAt: '2026-10-09T16:18:00+03:00' },
  },
  {
    name: 'telebirr mela overdue notice',
    ignored: 'loan_overdue_notice',
    body: `Dear Kidus,\nYour outstanding telebirr mela for 30 day credit balance of ETB 120.00 is 2 days overdue. Please pay promptly to keep your credit limit & save yourself from unnecessary legal charge, hassles, and additional fees\n\nThank you for using telebirr\nEthio telecom in partnership with Dashen Bank`,
  },
  {
    name: 'telebirr credit reminder',
    ignored: 'loan_reminder',
    body: `Dear Kidus,\nYour outstanding credit balance is ETB 120.00 on 10/10/2026. Please deposit to your wallet account and pay your credit within the remaining 3 day to avoid the 0.50% daily penalty fee.\n\nThank you for using telebirr\nEthio telecom in partnership with Dashen Bank`,
  },
  {
    name: 'Amharic greeting whose word merely contains the letters of "birr" is not financial',
    ignored: 'not_financial',
    body: `እንኳን ለብርሃነ ትንሣኤው በሰላም አደረሰዎ። በዓሉ የሰላም እና የደስታ ይሁንልዎ ! https://example.et/card`,
  },

  // ----- third batch: punctuation variants and two new telebirr types -----
  {
    name: 'telebirr transfer with "fee(including" and no space',
    body: `Dear kaleab\nYou have transferred ETB 130.00 to yonas addisu(251911223344) on 09/10/2026 16:18:00. Your transaction number is CA0000K0SH. The service fee(including 15% VAT) is ETB 2.00. Your current E-Money Account  balance is ETB 31.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CA0000K0SH\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'transfer_out', amount: 13000, fee: 200, balanceAfter: 3140, counterparty: 'yonas addisu', reference: 'CA0000K0SH' },
  },
  {
    name: 'CBE monthly fee without a VAT part',
    body: `Dear Customer your Account 1********1234 has been debited with ETB 5. Info: Mobile Banking Monthly Service Fee. Your Current Balance is ETB 1234.00. Thank you for Banking with CBE!. Please give us your feedback by clicking the link below (ስላገኙት አገልግሎት የሚከተለውን ማስፈንጠሪያ በመጫን አስተያየቶን ይስጡን።)https://shorturl.at/XY`,
    expect: { kind: 'debit', amount: 500, fee: 0, balanceAfter: 123400, description: 'Mobile Banking Monthly Service Fee' },
  },
  {
    name: 'telebirr cash withdrawal at an agent',
    body: `Dear kaleab\nYour telebirr account 251911223344 has been debited with ETB 500.00 on 10/10/2026 12:00:00 at telebirr Agent 123456. Your transaction number is CGP1Q2H3HC. The service fee is  ETB 5.00 and  15% VAT on the service fee is ETB 0.75. Your current Account balance is ETB 20.00. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CGP1Q2H3HC\nThank you for using telebirr\nEthio telecom`,
    expect: { institution: 'TELEBIRR', kind: 'payment', direction: 'out', amount: 50000, fee: 575, balanceAfter: 2000, reference: 'CGP1Q2H3HC', description: 'Cash withdrawal at telebirr agent', occurredAt: '2026-10-10T12:00:00+03:00' },
  },
  {
    name: 'telebirr deposit to a merchant',
    body: `Dear kaleab teshome\nYou have deposited ETB 200.00  to 123456 - FenanPay Solutions S C on 11/10/2026 13:00:00. Your transaction number is CIJ1X2JDT3. Your current balance is ETB 90.00. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CIJ1X2JDT3\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'payment', direction: 'out', amount: 20000, balanceAfter: 9000, counterparty: 'FenanPay Solutions S C', reference: 'CIJ1X2JDT3', description: 'Deposit to merchant' },
  },
  {
    name: 'CBE simple debit with no full stop after the amount',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB 1,200.00 Your Current Balance is ETB 800.00. Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { kind: 'debit', amount: 120000, fee: 0, balanceAfter: 80000 },
  },
  {
    name: 'CBE "Credited" with a capital C and no full stop before Thank you',
    body: `Dear Kidus your Account 1*********1234 has been Credited with ETB 500.00. Your Current Balance is ETB 1,500.00 Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { kind: 'credit', direction: 'in', amount: 50000, balanceAfter: 150000 },
  },

  // ----- fourth batch: the last odd ones -----
  {
    name: 'telebirr payment to an organisation (school fees), no space after the date',
    body: `Dear kaleab\nYou have paid ETB 5,000.00 for education payment to 123456 - Unity Univesity on 12/10/2026 10:00:00.Your transaction number is BCS1IKEV2M. The service fee is ETB 0.00. Your current balance is ETB 90.00.\nTo download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/BCS1IKEV2M\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'payment', direction: 'out', amount: 500000, fee: 0, balanceAfter: 9000, counterparty: 'Unity Univesity', description: 'education payment', reference: 'BCS1IKEV2M', occurredAt: '2026-10-12T10:00:00+03:00' },
  },
  {
    name: 'ATM withdrawal code is ignored and never parsed',
    ignored: 'atm_withdraw_code',
    body: `Dear Customer,\nYour ATM withdraw secret code is 123456 with amount of ETB 500.00. Please use this code to withdraw money before 2026-10-13 12:00:00 at  Bank of Abyssinia ATM.\n\nFor additional information, please call 127 or visit www.ethiotelecom.et\nThank you for using telebirr\nEthio telecom`,
  },
  {
    name: 'CBE debit where the charges are not itemised, only the total',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB100.00 .Including Service charge and VAT(15%) with a total of ETB100.48. Your Current Balance is ETB 20.00. Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { kind: 'debit', amount: 10000, fee: 48, balanceAfter: 2000, needsReview: false },
  },
  {
    name: 'CBE debit, charges not itemised, a total equal to the amount',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB1,500.00 .Including Service charge and VAT(15%) with a total of ETB 1,500.00. Your Current Balance is ETB 2,000.00. Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { amount: 150000, fee: 0, balanceAfter: 200000, needsReview: false },
  },
  {
    name: 'telebirr YeGena Chewata promotion',
    ignored: 'promotion',
    body: `Dear kaleab\nYou have got a letter as a gift from your friend/family. Login to telebirr SuperApp and visit YeGena Chewata page to get the letter. Make telebirr transactions to get more chances of winning up to 100,000 ETB in YeGena Chewata.\nThank you for using telebirr\nEthio telecom`,
  },
  {
    name: 'telebirr prize message is kept but flagged for review',
    body: `Dear kaleab,\nCongratulations, you have won ETB 100.00  as the Christmas gift!\nThank you for using telebirr.\nEthio telecom`,
    expect: { kind: 'transfer_in', direction: 'in', amount: 10000, description: 'Christmas gift', needsReview: true, dateSource: 'received_at' },
  },
  {
    name: 'telebirr bill payment',
    body: `Dear kaleab\nYou have paid ETB 350.00 to pay bill for 123456789 on 12/10/2026 09:00:00. Your transaction number is CE123ULJ4X. Your telebirr account balance is  ETB 49.40. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CE123ULJ4X\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'payment', direction: 'out', amount: 35000, balanceAfter: 4940, description: 'Bill payment', reference: 'CE123ULJ4X', counterparty: null },
  },
  {
    name: 'CBE ATM withdrawal',
    body: `Dear Kidus your Account 1********1234 has been debited for  ATM NO. 7 with ETB 1,000.00. Your Current Balance is ETB 2,500.00. Thank you for Banking with CBE! https://shorturl.at/AB Please give us your feedback by clicking the link below (ስላገኙት አገልግሎት የሚከተለውን ማስፈንጠሪያ በመጫን አስተያየቶን ይስጡን።)https://shorturl.at/XY`,
    expect: { kind: 'debit', direction: 'out', amount: 100000, fee: 0, balanceAfter: 250000, description: 'ATM withdrawal', needsReview: false },
  },
  {
    name: 'CBE debit with blank charge amounts is flagged for review',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB500.00 .Service charge of   and VAT(15%) of . Your Current Balance is ETB 12,000.00. Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { kind: 'debit', amount: 50000, fee: 0, balanceAfter: 1200000, needsReview: true },
  },
  {
    name: 'telebirr transfer to another bank (Awash), fee quoted including VAT',
    body: `Dear kaleab\nYou have transferred ETB 800.00 successfully from your telebirr account 251911223344 to Awash International Bank S C account number 013201234567800 on 12/10/2026 14:00:00. Your telebirr transaction number is CAP1GQSMJR and your bank transaction number is 123456d78d9f0ciq. The service fee (Including 15% VAT) is ETB 2.00. Your current balance is ETB 60.00. To download your payment information please click this link: https://transactioninfo.ethiotelecom.et/receipt/CAP1GQSMJR\nThank you for using telebirr\nEthio telecom`,
    expect: { kind: 'transfer_out', direction: 'out', amount: 80000, fee: 200, balanceAfter: 6000, counterparty: 'Awash International Bank S C', reference: 'CAP1GQSMJR', needsReview: false },
  },
  {
    name: 'telebirr insufficient balance notice',
    ignored: 'failed_transaction',
    body: `Sorry, You have insufficient balance for the requested transaction. Your account balance is ETB 20.00. Please deposit additional amount and try again.\nThank you for using telebirr\nEthio telecom`,
  },
  {
    name: 'CBE transfer message cut off after the recipient name is flagged for review',
    body: `Dear Kidus, You have transfered ETB 150.00 to Esubalew`,
    expect: { kind: 'transfer_out', direction: 'out', amount: 15000, fee: 0, counterparty: 'Esubalew', needsReview: true, dateSource: 'received_at', balanceAfter: null },
  },

  // ----- fifth batch: the very last ones -----
  {
    name: 'CBE debited FOR a named person, charges included in the total',
    body: `Dear Mr Kidus your Account 1********1234 has been debited for MISS YANIT MESIFIN REGASSA with ETB 1500.0 including Service charge ETB0.50 and VAT(15%) ETB0.08. Your Current Balance is ETB 20000.00. Thank you for Banking with CBE!. For feedback https://shorturl.at/AB for Reciept https://apps.cbe.com.et:100/BranchReceipt/FT00000CCCC4&00001234`,
    expect: { institution: 'CBE', kind: 'transfer_out', direction: 'out', amount: 149942, fee: 58, balanceAfter: 2000000, counterparty: 'MISS YANIT MESIFIN REGASSA', reference: 'FT00000CCCC4', needsReview: false },
  },
  {
    name: 'telebirr loan levy (Disaster Risk Management fund)',
    body: `Dear Kidus\nYou have paid ETB 5.00 for Ethiopian Disaster Risk Management fund (5% of your loan amount) .Your current telebirr balance is ETB 120.00.\nThank you for using telebirr\nEthio telecom`,
    expect: { institution: 'TELEBIRR', kind: 'payment', direction: 'out', amount: 500, fee: 0, balanceAfter: 12000, description: 'Ethiopian Disaster Risk Management fund', dateSource: 'received_at' },
  },
  {
    name: 'a loan levy of zero moves no money and is ignored',
    ignored: 'zero_amount',
    body: `Dear Kidus\nYou have paid ETB 0.00 for Ethiopian Disaster Risk Management fund (0% of your loan amount) .Your current telebirr balance is ETB 120.00.\nThank you for using telebirr\nEthio telecom`,
  },
  {
    name: 'CBE old wording with charges listed but no total clause',
    body: `Dear Kidus your Account 1*********1234 has been debited with ETB100.00 .Service charge of  ETB0.40 , VAT(15%) of ETB0.06 and (5%)Disaster fund of ETB0.02. Your Current Balance is ETB 20.00. Thank you for Banking with CBE! https://shorturl.at/AB`,
    expect: { kind: 'debit', amount: 10000, fee: 48, balanceAfter: 2000, needsReview: false },
  },
  {
    name: 'telebirr mela "due TODAY" reminder',
    ignored: 'loan_reminder',
    body: `Dear Kidus,\nYour outstanding telebirr mela for 30 day credit balance of ETB 120.00 is due TODAY. Your available limit is ETB 50.00.  Please deposit to your wallet account and Pay your credit to avoid the 0.5% daily penalty fee.\n\nThank you for using telebirr\nEthio telecom in partnership with Dashen Bank`,
  },
];

const at = (i: number) => new Date(Date.UTC(2026, 9, 2, 12, 0, i)); // distinct SMS time per message

for (const [i, f] of fixtures.entries()) {
  test(f.name, () => {
    const r = parseSms({ body: f.body, receivedAt: at(i) });
    if (f.ignored) {
      assert.deepEqual(r, { status: 'ignored', reason: f.ignored });
      return;
    }
    assert.equal(r.status, 'parsed', `expected parsed, got ${r.status}`);
    if (r.status !== 'parsed') return;
    // every message must pass the arithmetic self-check, unless the fixture says it is meant to be flagged
    if (!('needsReview' in (f.expect ?? {}))) assert.equal(r.tx.needsReview, false, 'arithmetic self-check failed');
    for (const [k, v] of Object.entries(f.expect ?? {})) {
      assert.equal((r.tx as unknown as Record<string, unknown>)[k], v, `field ${k}`);
    }
  });
}

test('every real-shaped message is either parsed or deliberately ignored', () => {
  const results = fixtures.map((f, i) => parseSms({ body: f.body, receivedAt: at(i) }));
  assert.equal(results.filter((r) => r.status === 'unknown').length, 0);
  assert.equal(results.filter((r) => r.status === 'parsed').length, fixtures.length - 13);
});

test('dedupe keys are unique, including the two identical "debited 100.42" texts', () => {
  const keys = fixtures
    .map((f, i) => parseSms({ body: f.body, receivedAt: at(i) }))
    .flatMap((r) => (r.status === 'parsed' ? [r.tx.dedupeKey] : []));
  assert.equal(new Set(keys).size, keys.length);
});

test('same SMS parsed twice gives the same dedupe key', () => {
  const f = fixtures.find((x) => x.name === 'CBE debited incl. charges (first)')!;
  const a = parseSms({ body: f.body, receivedAt: at(1) });
  const b = parseSms({ body: f.body, receivedAt: at(1) });
  assert.deepEqual(a, b);
});

test('messages with no money in them are ignored as not financial', () => {
  assert.deepEqual(parseSms({ body: 'Your OTP is 123456. Do not share it.', receivedAt: at(0) }), { status: 'ignored', reason: 'not_financial' });
  assert.deepEqual(parseSms({ body: 'Hi, are we still on for tomorrow?', receivedAt: at(0) }), { status: 'ignored', reason: 'not_financial' });
});

test('an Amharic promotion is not financial: every real transaction message carries an ETB amount', () => {
  assert.deepEqual(
    parseSms({ body: 'መኪና ይሸለሙ! ከ5000 ብር በላይ ግብይት ለሚፈፅሙ እድለኞች', receivedAt: at(0) }),
    { status: 'ignored', reason: 'not_financial' },
  );
});

test('a message that mentions money but matches no rule is unknown, never guessed', () => {
  assert.deepEqual(
    parseSms({ body: 'Dear Test, you have bought a gift card worth ETB 50.00 on 01/10/2026 10:00:00.', receivedAt: at(0) }),
    { status: 'unknown' },
  );
});

test('wrong arithmetic is flagged for review', () => {
  const body = `Dear  Test User You have successfully transferred ETB100.00 from account 1**0002 to account 1**0003 (Person F). Service charge of ETB 0.50 and VAT(15%) of ETB0.08 and Disaster Recovery(5%) of 0.03 with total of ETB105.00 .Your current balance is ETB20.43. Thanks for Banking with CBE.`;
  const r = parseSms({ body, receivedAt: at(0) });
  assert.equal(r.status === 'parsed' && r.tx.needsReview, true);
});

test('toMinor handles the number formats seen in real messages', () => {
  assert.equal(toMinor('1,308.01'), 130801);
  assert.equal(toMinor('100.0'), 10000);
  assert.equal(toMinor('5'), 500);
  assert.equal(toMinor('0.40'), 40);
  assert.equal(toMinor('1055.80'), 105580);
});