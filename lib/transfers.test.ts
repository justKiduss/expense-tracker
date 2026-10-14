import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pairTransfers, type Candidate } from './transfers';

const MIN = 60 * 1000;
const T0 = Date.UTC(2026, 9, 11, 20, 37, 0);
const c = (id: string, amount: number, minutes: number): Candidate => ({ id, amount, at: new Date(T0 + minutes * MIN) });
const GAP = 10 * MIN;

test('same amount, same minute: paired', () => {
  assert.deepEqual(pairTransfers([c('cbe1', 80000, 0)], [c('tb1', 80000, 0)], GAP), [['cbe1', 'tb1']]);
});

test('different amount: not paired', () => {
  assert.deepEqual(pairTransfers([c('cbe1', 80000, 0)], [c('tb1', 80100, 0)], GAP), []);
});

test('same amount but too far apart: not paired', () => {
  assert.deepEqual(pairTransfers([c('cbe1', 80000, 0)], [c('tb1', 80000, 30)], GAP), []);
});

test('the credit may arrive before the debit message', () => {
  assert.deepEqual(pairTransfers([c('cbe1', 30000, 3)], [c('tb1', 30000, 0)], GAP), [['cbe1', 'tb1']]);
});

test('two moves of the same amount pair one-to-one, not both to the same credit', () => {
  const debits = [c('cbe1', 30000, 0), c('cbe2', 30000, 120)];
  const credits = [c('tb1', 30000, 1), c('tb2', 30000, 121)];
  assert.deepEqual(pairTransfers(debits, credits, GAP), [['cbe1', 'tb1'], ['cbe2', 'tb2']]);
});

test('the closest match wins even when a farther one comes first in the list', () => {
  const debits = [c('cbe1', 10000, 0), c('cbe2', 10000, 4)];
  const credits = [c('tb1', 10000, 3)];
  // tb1 is 1 minute from cbe2 and 3 minutes from cbe1: cbe2 gets it
  assert.deepEqual(pairTransfers(debits, credits, GAP), [['cbe2', 'tb1']]);
});

test('a debit with no matching credit stays unpaired', () => {
  const debits = [c('cbe1', 10000, 0), c('cbe2', 20000, 0)];
  const credits = [c('tb1', 10000, 1)];
  assert.deepEqual(pairTransfers(debits, credits, GAP), [['cbe1', 'tb1']]);
});

test('empty inputs', () => {
  assert.deepEqual(pairTransfers([], [], GAP), []);
});

test('the real pairs seen in the phone screenshots (CBE debit time is UTC, telebirr time is +03:00)', () => {
  const at = (iso: string) => new Date(iso);
  const debits: Candidate[] = [
    { id: 'cbe-800', amount: 80000, at: at('2026-10-11T20:37:00Z') },
    { id: 'cbe-300a', amount: 30000, at: at('2026-10-10T13:07:00Z') },
    { id: 'cbe-300b', amount: 30000, at: at('2026-10-06T10:11:00Z') },
    { id: 'cbe-100', amount: 10000, at: at('2026-10-01T14:25:00Z') },
    { id: 'cbe-37512', amount: 3751200, at: at('2026-10-08T12:16:00Z') }, // no matching credit
  ];
  const credits: Candidate[] = [
    { id: 'tb-800', amount: 80000, at: at('2026-10-11T23:37:00+03:00') },
    { id: 'tb-300a', amount: 30000, at: at('2026-10-10T16:07:00+03:00') },
    { id: 'tb-300b', amount: 30000, at: at('2026-10-06T13:11:00+03:00') },
    { id: 'tb-100', amount: 10000, at: at('2026-10-01T17:25:00+03:00') },
  ];
  const pairs = pairTransfers(debits, credits, GAP).map(([d, t]) => `${d}=${t}`).sort();
  assert.deepEqual(pairs, ['cbe-100=tb-100', 'cbe-300a=tb-300a', 'cbe-300b=tb-300b', 'cbe-800=tb-800']);
});