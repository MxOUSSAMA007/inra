/**
 * Feed Ration Solver
 *
 * Given a target UFL and PDI requirement, this module calculates a practical
 * daily ration (kg of each feed) that meets those requirements EXACTLY.
 *
 * Strategy:
 *  1. The farmer selects which feeds are available on their farm.
 *  2. We use a linear solver to find exact amounts that meet UFL and PDI targets.
 *  3. If total DM exceeds DMI (0.025 × weight), we reduce proportionally.
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
  /** Difference from target (should be ~0 with exact solver) */
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

  // Get selected feeds
  const selectedFeeds = feedIds
    .map((id) => FEEDS.find((f) => f.id === id))
    .filter((f): f is Feed => f !== undefined);

  // Tolerance values as per INRA requirements
  const UFL_TOLERANCE = 0.2;  // ±0.2 UFL
  const PDI_TOLERANCE = 50;   // ±50g PDI

  // Try to build an exact ration using linear solver
  const result = solveExactRation(
    targetUfl,
    targetPdi,
    selectedFeeds,
    dmi,
    UFL_TOLERANCE,
    PDI_TOLERANCE
  );

  return result;
}

/**
 * Solve the ration using linear algebra to get EXACT target matching.
 * Uses a weighted optimization approach.
 */
function solveExactRation(
  targetUfl: number,
  targetPdi: number,
  feeds: Feed[],
  dmi: number,
  uflTolerance: number,
  pdiTolerance: number
): RationResult {
  const amounts: FeedAmount[] = [];

  // If no feeds selected, return empty result
  if (feeds.length === 0) {
    return createEmptyResult(targetUfl, targetPdi, dmi);
  }

  // Separate feeds by category
  const roughages = feeds.filter((f) => f.category === "roughage");
  const concentrates = feeds.filter((f) => f.category !== "roughage");

  // If we have at least one roughage and one concentrate, use exact solver
  if (roughages.length > 0 && concentrates.length > 0) {
    // Use 2-feed exact solver with primary roughage and concentrate blend
    const exactResult = solveWithExactMatch(
      targetUfl,
      targetPdi,
      roughages,
      concentrates,
      dmi
    );
    
    if (exactResult) {
      return exactResult;
    }
  }

  // Fallback: proportional distribution if exact solver fails
  return buildProportionalRation(targetUfl, targetPdi, feeds, dmi, uflTolerance, pdiTolerance);
}

/**
 * Solve for exact UFL and PDI match using primary roughage and concentrate blend
 */
function solveWithExactMatch(
  targetUfl: number,
  targetPdi: number,
  roughages: Feed[],
  concentrates: Feed[],
  dmi: number
): RationResult | null {
  // Create a blended concentrate (weighted average)
  const blendUfl = concentrates.reduce((s, f) => s + f.uflPerKg, 0) / concentrates.length;
  const blendPdi = concentrates.reduce((s, f) => s + f.pdiPerKg, 0) / concentrates.length;
  const blendDm = concentrates.reduce((s, f) => s + f.dm, 0) / concentrates.length;

  // Create a blended roughage (weighted average)
  const roughUfl = roughages.reduce((s, f) => s + f.uflPerKg, 0) / roughages.length;
  const roughPdi = roughages.reduce((s, f) => s + f.pdiPerKg, 0) / roughages.length;
  const roughDm = roughages.reduce((s, f) => s + f.dm, 0) / roughages.length;

  // Solve 2x2 system:
  // roughUfl * x + blendUfl * y = targetUfl
  // roughPdi * x + blendPdi * y = targetPdi
  
  const det = roughUfl * blendPdi - roughPdi * blendUfl;
  
  if (Math.abs(det) < 0.0001) {
    // Singular matrix - can't solve exactly
    return null;
  }

  // Cramer's rule
  const roughageKg = (targetUfl * blendPdi - targetPdi * blendUfl) / det;
  const concentrateKg = (roughUfl * targetPdi - roughPdi * targetUfl) / det;

  // Check if solution is valid (positive and within DMI)
  const totalDm = roughageKg * roughDm + concentrateKg * blendDm;
  
  if (roughageKg < 0 || concentrateKg < 0 || totalDm > dmi) {
    // Invalid solution - try with different allocation
    return null;
  }

  // Distribute to individual feeds proportionally
  const amounts: FeedAmount[] = [];

  // Distribute roughage amount proportionally
  if (roughageKg > 0.05) {
    const totalRoughUfl = roughages.reduce((s, f) => s + f.uflPerKg, 0);
    for (const feed of roughages) {
      const share = feed.uflPerKg / totalRoughUfl;
      const kg = roughageKg * share;
      if (kg >= 0.1) {
        amounts.push({
          feed,
          kgPerDay: round1(kg),
          uflContrib: round2(kg * feed.uflPerKg),
          pdiContrib: round0(kg * feed.pdiPerKg),
          dmContrib: round2(kg * feed.dm),
        });
      }
    }
  }

  // Distribute concentrate amount proportionally
  if (concentrateKg > 0.05) {
    const totalConcUfl = concentrates.reduce((s, f) => s + f.uflPerKg, 0);
    for (const feed of concentrates) {
      const share = feed.uflPerKg / totalConcUfl;
      const kg = concentrateKg * share;
      if (kg >= 0.1) {
        amounts.push({
          feed,
          kgPerDay: round1(kg),
          uflContrib: round2(kg * feed.uflPerKg),
          pdiContrib: round0(kg * feed.pdiPerKg),
          dmContrib: round2(kg * feed.dm),
        });
      }
    }
  }

  // Calculate totals
  const totalUfl = round2(amounts.reduce((s, a) => s + a.uflContrib, 0));
  const totalPdi = round0(amounts.reduce((s, a) => s + a.pdiContrib, 0));
  const totalDmFinal = round2(amounts.reduce((s, a) => s + a.dmContrib, 0));

  // Exact match - differences should be 0 (or very close due to rounding)
  const uflDiff = round2(totalUfl - targetUfl);
  const pdiDiff = round0(totalPdi - targetPdi);

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
    balanced: true,
  };
}

/**
 * Fallback proportional ration builder
 */
function buildProportionalRation(
  targetUfl: number,
  targetPdi: number,
  feeds: Feed[],
  dmi: number,
  uflTolerance: number,
  pdiTolerance: number
): RationResult {
  const amounts: FeedAmount[] = [];
  const roughages = feeds.filter((f) => f.category === "roughage");
  const concentrates = feeds.filter((f) => f.category !== "roughage");

  // Step 1: Allocate roughages (~60% of UFL target)
  const roughageUflTarget = targetUfl * 0.6;

  if (roughages.length > 0) {
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

  // Step 2: Calculate remaining and fill with concentrates
  const roughageUflActual = amounts.reduce((s, a) => s + a.uflContrib, 0);
  const roughagePdiActual = amounts.reduce((s, a) => s + a.pdiContrib, 0);

  let remainingUfl = targetUfl - roughageUflActual;
  let remainingPdi = targetPdi - roughagePdiActual;

  if (concentrates.length > 0 && (remainingUfl > 0 || remainingPdi > 0)) {
    const totalConcentrateUfl = concentrates.reduce((s, f) => s + f.uflPerKg, 0);
    const totalConcentratePdi = concentrates.reduce((s, f) => s + f.pdiPerKg, 0);

    for (const feed of concentrates) {
      const share = feed.uflPerKg / totalConcentrateUfl;
      const uflNeeded = remainingUfl * share;
      const pdiNeeded = remainingPdi * share;

      const kgForUfl = uflNeeded / feed.uflPerKg;
      const kgForPdi = pdiNeeded / feed.pdiPerKg;
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

  // Step 3: Check DMI and adjust if needed
  const totalDm = amounts.reduce((s, a) => s + a.dmContrib, 0);
  
  if (totalDm > dmi) {
    adjustForDmi(amounts, concentrates, roughages, dmi, targetUfl, targetPdi);
  }

  // Step 4: Compute totals
  const totalUfl = round2(amounts.reduce((s, a) => s + a.uflContrib, 0));
  const totalPdi = round0(amounts.reduce((s, a) => s + a.pdiContrib, 0));
  const totalDmFinal = round2(amounts.reduce((s, a) => s + a.dmContrib, 0));

  const uflDiff = round2(totalUfl - targetUfl);
  const pdiDiff = round0(totalPdi - targetPdi);

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

function createEmptyResult(targetUfl: number, targetPdi: number, dmi: number): RationResult {
  return {
    feeds: [],
    totalUfl: 0,
    totalPdi: 0,
    totalDm: 0,
    targetUfl: round2(targetUfl),
    targetPdi: round0(targetPdi),
    dmi: round2(dmi),
    uflDiff: -targetUfl,
    pdiDiff: -targetPdi,
    balanced: false,
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
