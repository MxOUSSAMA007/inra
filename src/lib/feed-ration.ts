/**
 * Feed Ration Solver
 *
 * Given a target UFL and PDI requirement, this module calculates a practical
 * daily ration (kg of each feed) that meets those requirements.
 *
 * Strategy:
 *  1. The farmer selects which feeds are available on their farm.
 *  2. We build a simple two-pass ration:
 *     - First fill roughage needs (forage base) — ~60% of UFL target
 *     - Then top up with a CONCENTRATE BLEND to meet remaining energy/protein
 *  3. The concentrate blend uses weighted average of all selected concentrates.
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

  const amounts: FeedAmount[] = [];

  // ── Step 1: Allocate roughages (~60% of UFL target) ─────────────────────────
  const roughageUflTarget = targetUfl * 0.6;
  const roughagePdiTarget = targetPdi * 0.5; // roughage covers ~50% of PDI

  if (roughages.length > 0) {
    // Distribute proportionally based on each roughage's UFL contribution
    const totalRoughageUfl = roughages.reduce((s, f) => s + f.uflPerKg, 0);

    for (const feed of roughages) {
      const share = feed.uflPerKg / totalRoughageUfl;
      const uflNeeded = roughageUflTarget * share;
      const kgNeeded = uflNeeded / feed.uflPerKg;

      if (kgNeeded >= 0.1) {
        amounts.push({
          feed,
          kgPerDay: round1(kgNeeded),
          uflContrib: round2(kgNeeded * feed.uflPerKg),
          pdiContrib: round0(kgNeeded * feed.pdiPerKg),
        });
      }
    }
  }

  // ── Step 2: Calculate remaining UFL and PDI after roughage ────────────────────
  const roughageUflActual = amounts.reduce((s, a) => s + a.uflContrib, 0);
  const roughagePdiActual = amounts.reduce((s, a) => s + a.pdiContrib, 0);

  let remainingUfl = targetUfl - roughageUflActual;
  let remainingPdi = targetPdi - roughagePdiActual;

  // ── Step 3: Allocate concentrates to cover remaining UFL and PDI ────────────────
  // Distribute among concentrates based on their nutritional contribution
  if (concentrates.length > 0 && (remainingUfl > 0 || remainingPdi > 0)) {
    // Calculate total UFL and PDI contribution potential from all concentrates
    const totalConcentrateUfl = concentrates.reduce((s, f) => s + f.uflPerKg, 0);
    const totalConcentratePdi = concentrates.reduce((s, f) => s + f.pdiPerKg, 0);

    for (const feed of concentrates) {
      // Distribute remaining needs proportionally to each concentrate's contribution
      const share = feed.uflPerKg / totalConcentrateUfl;
      const uflNeeded = remainingUfl * share;
      const pdiNeeded = remainingPdi * share;

      // Calculate kg needed to meet each requirement
      const kgForUfl = uflNeeded / feed.uflPerKg;
      const kgForPdi = pdiNeeded / feed.pdiPerKg;

      // Use the more limiting factor
      const kgNeeded = Math.max(kgForUfl, kgForPdi);

      if (kgNeeded >= 0.1) {
        amounts.push({
          feed,
          kgPerDay: round1(kgNeeded),
          uflContrib: round2(kgNeeded * feed.uflPerKg),
          pdiContrib: round0(kgNeeded * feed.pdiPerKg),
        });
      }
    }
  }

  // ── Step 4: Compute totals ───────────────────────────────────────────────────
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
