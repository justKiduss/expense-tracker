import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBalanceChain, type BalanceRow } from './balance.check';

let n = 0;
const row = (institution: string, direction: 'in' | 'out', amount: number, fee: number, balanceAfter: number | null, iso: string): BalanceRow =>
  ({ id: `r${++n}`, institution, direction, amount, fee, balanceAfter, at: new Date(iso) });

test('a consistent chain has no breaks (real telebirr numbers from the phone)', () => {
  // 75.40 -> transfer 30.00 + fee 1.00 -> 44.40 -> payment 5.00 -> 39.40 -> payment 5.00 -> 34.40
  const rows = [
    row('TELEBIRR', 'out', 2500, 0, 7540, '2026-10-01T14:28:15Z'),
    row('TELEBIRR', 'out', 3000, 100, 4440, '2026-10-01T14:50:01Z'),
    row('TELEBIRR', 'out', 500, 0, 3940, '2026-10-01T17:11:25Z'),
    row('TELEBIRR', 'out', 500, 0, 3440, '2026-10-01T17:41:31Z'),
  ];
  const r = checkBalanceChain(rows);
  assert.equal(r.checked, 3);
  assert.equal(r.consistent, 3);
  assert.deepEqual(r.breaks, []);
});

test('rows are checked in time order even if given out of order', () => {
  const rows = [
    row('CBE', 'out', 10000, 0, 2000, '2026-10-02T10:00:00Z'),
    row('CBE', 'in', 50000, 0, 12000, '2026-10-01T10:00:00Z'), // 120.00 after +500.00... earlier row
  ];
  // earlier: balance 120.00 ; later: 120.00 - 100.00 = 20.00 -> consistent
  const r = checkBalanceChain(rows);
  assert.equal(r.checked, 1);
  assert.equal(r.consistent, 1);
});

test('a missing incoming message shows up as a positive gap', () => {
  const rows = [
    row('CBE', 'out', 10000, 0, 5000, '2026-10-01T10:00:00Z'),
    // a 300.00 credit message is missing here
    row('CBE', 'out', 2000, 0, 28000, '2026-10-02T10:00:00Z'), // 50.00 + 300.00 - 20.00 = 330.00 expected?? -> see below
  ];
  // previous balance 50.00; this row is an out of 20.00, so expected 30.00; the actual 280.00 => gap +250.00
  const r = checkBalanceChain(rows);
  assert.equal(r.checked, 1);
  assert.equal(r.consistent, 0);
  assert.equal(r.breaks.length, 1);
  assert.equal(r.breaks[0].expected, 3000);
  assert.equal(r.breaks[0].gap, 25000);
});

test('a missing outgoing message shows up as a negative gap', () => {
  const rows = [
    row('CBE', 'in', 10000, 0, 20000, '2026-10-01T10:00:00Z'),
    row('CBE', 'in', 5000, 0, 15000, '2026-10-02T10:00:00Z'), // expected 250.00, actual 150.00
  ];
  const r = checkBalanceChain(rows);
  assert.equal(r.breaks[0].gap, -10000);
});

test('the fee is part of what leaves the account', () => {
  const rows = [
    row('CBE', 'in', 100000, 0, 150000, '2026-10-01T10:00:00Z'),
    row('CBE', 'out', 12000, 61, 137939, '2026-10-02T10:00:00Z'), // 1500.00 - 120.00 - 0.61 = 1379.39
  ];
  assert.equal(checkBalanceChain(rows).consistent, 1);
});

test('institutions are checked separately', () => {
  const rows = [
    row('CBE', 'in', 100, 0, 1000, '2026-10-01T10:00:00Z'),
    row('TELEBIRR', 'in', 100, 0, 5000, '2026-10-01T10:01:00Z'),
    row('CBE', 'in', 100, 0, 1100, '2026-10-01T10:02:00Z'),
  ];
  const r = checkBalanceChain(rows);
  assert.equal(r.checked, 1);
  assert.equal(r.consistent, 1);
});

test('a row with no balance restarts the chain instead of causing a false break', () => {
  const rows = [
    row('TELEBIRR', 'out', 500, 0, 4000, '2026-10-01T10:00:00Z'),
    row('TELEBIRR', 'in', 70000, 1750, null, '2026-10-02T10:00:00Z'), // a loan: balance unknown
    row('TELEBIRR', 'out', 500, 0, 73250, '2026-10-03T10:00:00Z'),
    row('TELEBIRR', 'out', 500, 0, 72750, '2026-10-04T10:00:00Z'),
  ];
  const r = checkBalanceChain(rows);
  assert.equal(r.breaks.length, 0);
  assert.equal(r.checked, 1); // only the last pair is comparable
  assert.equal(r.skipped, 1);
});

test('two messages in the same second cannot be ordered, so that pair is skipped', () => {
  const rows = [
    row('CBE', 'in', 100, 0, 1000, '2026-10-01T10:00:00Z'),
    row('CBE', 'in', 100, 0, 1100, '2026-10-01T10:00:00Z'),
  ];
  const r = checkBalanceChain(rows);
  assert.equal(r.checked, 0);
  assert.equal(r.skipped, 1);
});

test('empty input', () => {
  assert.deepEqual(checkBalanceChain([]), { checked: 0, consistent: 0, skipped: 0, breaks: [] });
});