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
 *  4. If total DM exceeds DMI (0.025 × weight), reduce concentrates first, then roughages.
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
  /** Dry matter contributed (kg) */
  dmContrib: number;
}

export interface RationResult {
  feeds: FeedAmount[];
  totalUfl: number;
  totalPdi: number;
  totalDm: number;
  targetUfl: number;
  targetPdi: number;
  dmi: number; // Maximum dry matter intake
  /** Difference from target (can be negative if under) */
  uflDiff: number;
  pdiDiff: number;
  /** true if ration meets both UFL (±0.2) and PDI (±50g) within tolerance */
  balanced: boolean;
}

/**
 * Default feed selection: hay + barley + soybean meal (widely available)
 */
export const DEFAULT_FEED_IDS = ["hay", "barley", "soybean_meal"];

/**
 * Calculate dry matter intake capacity
 * DMI = 0.025 × live weight (kg)
 */
export function calculateDmi(weightKg: number): number {
  return 0.025 * weightKg;
}

/**
 * Calculate a balanced ration for the given UFL and PDI targets.
 *
 * @param targetUfl  - Total UFL needed per day
 * @param targetPdi  - Total PDI needed per day (g)
 * @param feedIds    - IDs of feeds available on the farm
 * @param cowWeight  - Cow weight in kg (for DMI calculation)
 * @returns          - RationResult with kg amounts per feed
 */
export function calculateFeedRation(
  targetUfl: number,
  targetPdi: number,
  feedIds: string[] = DEFAULT_FEED_IDS,
  cowWeight: number = 600
): RationResult {
  // Calculate maximum DMI
  const dmi = calculateDmi(cowWeight);

  // Get selected feeds, split into roughages and concentrates
  const selectedFeeds = feedIds
    .map((id) => FEEDS.find((f) => f.id === id))
    .filter((f): f is Feed => f !== undefined);

  const roughages = selectedFeeds.filter((f) => f.category === "roughage");
  const concentrates = selectedFeeds.filter((f) => f.category !== "roughage");

  // Tolerance values as per INRA requirements
  const UFL_TOLERANCE = 0.2;  // ±0.2 UFL
  const PDI_TOLERANCE = 50;   // ±50g PDI

  // Try to build a balanced ration with iterative adjustment
  const result = buildRationWithAdjustment(
    targetUfl,
    targetPdi,
    roughages,
    concentrates,
    dmi,
    UFL_TOLERANCE,
    PDI_TOLERANCE
  );

  return result;
}

  function buildRationWithAdjustment(
  targetUfl: number,
  targetPdi: number,
  roughages: Feed[],
  concentrates: Feed[],
  dmi: number,
  uflTolerance: number,
  pdiTolerance: number
): RationResult {
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
          dmContrib: round2(kgNeeded * feed.dm),
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
          dmContrib: round2(kgNeeded * feed.dm),
        });
      }
    }
  }

  // ── Step 4: Check DMI constraint and adjust if needed ──────────────────────────
  const totalDm = amounts.reduce((s, a) => s + a.dmContrib, 0);
  
  if (totalDm > dmi) {
    // Reduce concentrates first, then roughages if still over DMI
    adjustForDmi(amounts, concentrates, roughages, dmi, targetUfl, targetPdi);
  }

  // ── Step 5: Compute totals and check balance ───────────────────────────────────
  const totalUfl = round2(amounts.reduce((s, a) => s + a.uflContrib, 0));
  const totalPdi = round0(amounts.reduce((s, a) => s + a.pdiContrib, 0));
  const totalDmFinal = round2(amounts.reduce((s, a) => s + a.dmContrib, 0));

  // Calculate differences from target
  const uflDiff = round2(totalUfl - targetUfl);
  const pdiDiff = round0(totalPdi - targetPdi);

  // Check if balanced within tolerance
  const uflOk = Math.abs(uflDiff) <= uflTolerance;
  const pdiOk = Math.abs(pdiDiff) <= pdiTolerance;

  return {
    feeds: amounts.filter((a) => a.kgPerDay > 0),
    totalUfl,
    totalPdi,
    totalDm: totalDmFinal,
    targetUfl: round2(targetUfl),
    targetPdi: round0(targetPdi),
    dmi: round2(dmi),
    uflDiff,
    pdiDiff,
    balanced: uflOk && pdiOk,
  };
}

/**
 * Adjust ration to not exceed DMI - reduces concentrates first, then roughages
 */
function adjustForDmi(
  amounts: FeedAmount[],
  concentrates: Feed[],
  roughages: Feed[],
  dmi: number,
  targetUfl: number,
  targetPdi: number
): void {
  // Separate current amounts into concentrates and roughages
  const concentrateAmounts = amounts.filter(
    (a) => a.feed.category !== "roughage"
  );
  const roughageAmounts = amounts.filter((a) => a.feed.category === "roughage");

  let currentDm = amounts.reduce((s, a) => s + a.dmContrib, 0);
  let targetDm = dmi;

  // Step 1: Reduce concentrates proportionally
  if (concentrateAmounts.length > 0 && currentDm > targetDm) {
    const concentrateDm = concentrateAmounts.reduce((s, a) => s + a.dmContrib, 0);
    const excessDm = currentDm - targetDm;

    if (concentrateDm > 0) {
      // Reduce concentrates to eliminate excess
      const reduceRatio = Math.max(0, concentrateDm - excessDm) / concentrateDm;

      for (const amount of concentrateAmounts) {
        amount.kgPerDay = round1(amount.kgPerDay * reduceRatio);
        amount.uflContrib = round2(amount.kgPerDay * amount.feed.uflPerKg);
        amount.pdiContrib = round0(amount.kgPerDay * amount.feed.pdiPerKg);
        amount.dmContrib = round2(amount.kgPerDay * amount.feed.dm);
      }

      // Recalculate current DM after concentrate reduction
      currentDm = amounts.reduce((s, a) => s + a.dmContrib, 0);
    }
  }

  // Step 2: If still over DMI, reduce roughages
  if (roughageAmounts.length > 0 && currentDm > targetDm) {
    const roughageDm = roughageAmounts.reduce((s, a) => s + a.dmContrib, 0);
    const excessDm = currentDm - targetDm;

    if (roughageDm > 0) {
      const reduceRatio = Math.max(0, roughageDm - excessDm) / roughageDm;

      for (const amount of roughageAmounts) {
        amount.kgPerDay = round1(amount.kgPerDay * reduceRatio);
        amount.uflContrib = round2(amount.kgPerDay * amount.feed.uflPerKg);
        amount.pdiContrib = round0(amount.kgPerDay * amount.feed.pdiPerKg);
        amount.dmContrib = round2(amount.kgPerDay * amount.feed.dm);
      }
    }
  }
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
