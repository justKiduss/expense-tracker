import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthRange } from './months';

const NOW = new Date('2026-10-14T09:00:00Z');

test('no parameter means the current month, in Addis time', () => {
  const m = monthRange(undefined, NOW);
  assert.equal(m.key, '2026-10');
  assert.equal(m.label, 'October 2026');
  assert.equal(m.isCurrent, true);
  assert.equal(m.from.toISOString(), '2026-09-30T21:00:00.000Z'); // 1 Oct 00:00 Addis
  assert.equal(m.to.toISOString(), '2026-10-31T21:00:00.000Z');
  assert.equal(m.prev, '2026-09');
  assert.equal(m.next, null);
  assert.equal(m.daysLeft, 18);
});

test('a past month has next/prev and no days-left', () => {
  const m = monthRange('2026-09', NOW);
  assert.equal(m.label, 'September 2026');
  assert.equal(m.isCurrent, false);
  assert.equal(m.from.toISOString(), '2026-08-31T21:00:00.000Z');
  assert.equal(m.to.toISOString(), '2026-09-30T21:00:00.000Z');
  assert.equal(m.prev, '2026-08');
  assert.equal(m.next, '2026-10');
  assert.equal(m.daysLeft, null);
});

test('year boundaries roll over correctly', () => {
  assert.equal(monthRange('2026-01', NOW).prev, '2025-12');
  assert.equal(monthRange('2025-12', NOW).next, '2026-01');
  assert.equal(monthRange('2025-12', NOW).label, 'December 2025');
});

test('future months and garbage fall back to the current month', () => {
  for (const bad of ['2027-01', '2026-11', 'abc', '2026-13', '2026-00', '', '2026-1', "2026-10'; drop table"]) {
    assert.equal(monthRange(bad, NOW).key, '2026-10', bad);
  }
});

test('just after midnight in Addis the new month has already started', () => {
  // 31 Oct 21:30 UTC is 1 Nov 00:30 in Addis Ababa
  const m = monthRange(undefined, new Date('2026-10-31T21:30:00Z'));
  assert.equal(m.key, '2026-11');
  assert.equal(m.from.toISOString(), '2026-10-31T21:00:00.000Z');
});

test('a transaction at 00:30 Addis time on the 1st lands in the new month, not the old one', () => {
  const tx = new Date('2026-09-30T21:30:00Z'); // 1 Oct 00:30 Addis
  const sep = monthRange('2026-09', NOW);
  const oct = monthRange('2026-10', NOW);
  assert.equal(tx >= sep.from && tx < sep.to, false);
  assert.equal(tx >= oct.from && tx < oct.to, true);
});

test('the last day of the month still has one day left', () => {
  const m = monthRange(undefined, new Date('2026-10-31T10:00:00Z'));
  assert.equal(m.daysLeft, 1);
});

test('the real transaction from the screenshots (8 Oct 15:16 Addis) belongs to October', () => {
  const tx = new Date('2026-10-08T12:16:00Z');
  const oct = monthRange('2026-10', NOW);
  assert.equal(tx >= oct.from && tx < oct.to, true);
});