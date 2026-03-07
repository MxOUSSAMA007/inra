/**
 * Feed Ration Solver
 *
 * Given a target UFL and PDI requirement, this module calculates a practical
 * daily ration (kg of each feed) that meets those requirements.
 *
 * Strategy:
 *  1. The farmer selects which feeds are available on their farm.
 *  2. We build a simple two-pass ration:
 *     - First fill roughage needs (forage base)
 *     - Then top up with concentrates to meet energy/protein deficit
 *  3. We iterate to balance both UFL and PDI simultaneously.
 */

import { type Feed, FEEDS } from "./feed-database";

export interface FeedAmount {
  feed: Feed;
  /** kg of fresh weight per day */
  kgPerDay: number;
  /** UFL contributed */
  uflContrib: number;
  /** PDI contributed (g) */
  pdiContrib: number;
}

export interface RationResult {
  feeds: FeedAmount[];
  totalUfl: number;
  totalPdi: number;
  targetUfl: number;
  targetPdi: number;
  /** true if ration meets both UFL and PDI within tolerance */
  balanced: boolean;
}

/**
 * Default feed selection: hay + barley + soybean meal (widely available)
 */
export const DEFAULT_FEED_IDS = ["hay", "barley", "soybean_meal"];

/**
 * Calculate a balanced ration for the given UFL and PDI targets.
 *
 * @param targetUfl  - Total UFL needed per day
 * @param targetPdi  - Total PDI needed per day (g)
 * @param feedIds    - IDs of feeds available on the farm
 * @returns          - RationResult with kg amounts per feed
 */
export function calculateFeedRation(
  targetUfl: number,
  targetPdi: number,
  feedIds: string[] = DEFAULT_FEED_IDS
): RationResult {
  // Get selected feeds, split into roughages and concentrates
  const selectedFeeds = feedIds
    .map((id) => FEEDS.find((f) => f.id === id))
    .filter((f): f is Feed => f !== undefined);

  const roughages = selectedFeeds.filter((f) => f.category === "roughage");
  const concentrates = selectedFeeds.filter((f) => f.category !== "roughage");

  // Estimate total dry matter intake capacity (kg DM/day)
  // Rule of thumb: ~2.5% of body weight, but we work backwards from UFL target
  // Typical roughage provides ~0.5–0.8 UFL/kg DM; we aim for 60% of UFL from roughage
  const roughageUflTarget = targetUfl * 0.6;
  const concentrateUflTarget = targetUfl * 0.4;

  const amounts: FeedAmount[] = [];

  // ── Step 1: Allocate roughage ─────────────────────────────────────────────
  let roughageUflRemaining = roughageUflTarget;
  let roughagePdiRemaining = targetPdi * 0.5; // roughage covers ~50% of PDI

  if (roughages.length > 0) {
    // Distribute evenly among roughages (weighted by UFL density)
    const totalRoughageUfl = roughages.reduce((s, f) => s + f.uflPerKg, 0);

    for (const feed of roughages) {
      const share = feed.uflPerKg / totalRoughageUfl;
      const uflNeeded = roughageUflRemaining * share;
      const kgNeeded = uflNeeded / feed.uflPerKg;

      amounts.push({
        feed,
        kgPerDay: round1(kgNeeded),
        uflContrib: round2(kgNeeded * feed.uflPerKg),
        pdiContrib: round0(kgNeeded * feed.pdiPerKg),
      });

      roughagePdiRemaining -= kgNeeded * feed.pdiPerKg;
    }
  }

  // ── Step 2: Calculate remaining UFL and PDI after roughage ───────────────
  const roughageUflActual = amounts.reduce((s, a) => s + a.uflContrib, 0);
  const roughagePdiActual = amounts.reduce((s, a) => s + a.pdiContrib, 0);

  let remainingUfl = targetUfl - roughageUflActual;
  let remainingPdi = targetPdi - roughagePdiActual;

  // ── Step 3: Allocate concentrates to cover remaining UFL and PDI ─────────
  if (concentrates.length > 0 && (remainingUfl > 0 || remainingPdi > 0)) {
    // Sort concentrates: high PDI first if PDI is the limiting factor
    const pdiLimited = remainingPdi / targetPdi > remainingUfl / targetUfl;
    const sorted = [...concentrates].sort((a, b) =>
      pdiLimited
        ? b.pdiPerKg / b.uflPerKg - a.pdiPerKg / a.uflPerKg
        : b.uflPerKg - a.uflPerKg
    );

    for (const feed of sorted) {
      if (remainingUfl <= 0.05 && remainingPdi <= 5) break;

      // How much of this feed do we need to cover remaining UFL?
      const kgForUfl = Math.max(0, remainingUfl / feed.uflPerKg);
      // How much to cover remaining PDI?
      const kgForPdi = Math.max(0, remainingPdi / feed.pdiPerKg);
      // Take the larger of the two needs
      const kgNeeded = Math.max(kgForUfl, kgForPdi);

      if (kgNeeded < 0.05) continue;

      amounts.push({
        feed,
        kgPerDay: round1(kgNeeded),
        uflContrib: round2(kgNeeded * feed.uflPerKg),
        pdiContrib: round0(kgNeeded * feed.pdiPerKg),
      });

      remainingUfl -= kgNeeded * feed.uflPerKg;
      remainingPdi -= kgNeeded * feed.pdiPerKg;
    }
  }

  // ── Step 4: Compute totals ────────────────────────────────────────────────
  const totalUfl = round2(amounts.reduce((s, a) => s + a.uflContrib, 0));
  const totalPdi = round0(amounts.reduce((s, a) => s + a.pdiContrib, 0));

  const uflOk = totalUfl >= targetUfl * 0.95;
  const pdiOk = totalPdi >= targetPdi * 0.95;

  return {
    feeds: amounts.filter((a) => a.kgPerDay > 0),
    totalUfl,
    totalPdi,
    targetUfl: round2(targetUfl),
    targetPdi: round0(targetPdi),
    balanced: uflOk && pdiOk,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round0(n: number): number {
  return Math.round(n);
}
