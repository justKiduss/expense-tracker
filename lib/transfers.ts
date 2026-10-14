// Pure matching logic for "moving my own money" (CBE -> telebirr). No database, no framework.

export interface Candidate {
  id: string;
  amount: number; // cents
  at: Date;
}

/**
 * Pairs each CBE debit with the telebirr credit of the same amount that arrived closest in time.
 * One debit pairs with at most one credit and the other way round. Returns [debitId, creditId] pairs.
 */
export function pairTransfers(debits: Candidate[], credits: Candidate[], maxGapMs: number): [string, string][] {
  const options: { d: string; c: string; gap: number }[] = [];
  for (const d of debits) {
    for (const c of credits) {
      if (d.amount !== c.amount) continue;
      const gap = Math.abs(d.at.getTime() - c.at.getTime());
      if (gap <= maxGapMs) options.push({ d: d.id, c: c.id, gap });
    }
  }

  // Closest pairs first, so a near match is never stolen by a farther one.
  options.sort((a, b) => a.gap - b.gap);

  const usedDebits = new Set<string>();
  const usedCredits = new Set<string>();
  const pairs: [string, string][] = [];
  for (const o of options) {
    if (usedDebits.has(o.d) || usedCredits.has(o.c)) continue;
    usedDebits.add(o.d);
    usedCredits.add(o.c);
    pairs.push([o.d, o.c]);
  }
  return pairs;
}