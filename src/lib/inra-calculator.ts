/**
 * INRA (Institut National de la Recherche Agronomique) Ration Calculator
 * Based on the French INRA system for dairy cow nutritional requirements.
 * Units: UFL (Unité Fourragère Lait) for energy, PDI (g/day) for protein.
 */

export type PhysiologicalStatus = "lactating" | "dry";
export type ParityType = "primiparous" | "multiparous";
export type HousingType = "stall" | "pasture";

export interface CowInputs {
  weight: number; // kg
  parity: ParityType;
  status: PhysiologicalStatus;
  // Lactation fields
  milkProduction?: number; // liters/day
  milkFatPercent?: number; // % fat content
  // Gestation fields
  gestationMonth?: number; // 1-9
  housingType: HousingType;
}

export interface NutritionBreakdown {
  maintenance: number;
  growth: number; // only for primiparous
  production: number;
  gestation: number;
  activityBonus: number;
  total: number;
}

export interface PDIBreakdown {
  maintenance: number;
  growth: number;
  production: number;
  gestation: number;
  total: number;
}

export interface CalculationResult {
  ufl: NutritionBreakdown;
  pdi: PDIBreakdown;
  inputs: CowInputs;
}

/**
 * Calculate metabolic body weight (W^0.75)
 */
function metabolicWeight(weight: number): number {
  return Math.pow(weight, 0.75);
}

/**
 * UFL for maintenance
 * Formula: 0.035 × W^0.75
 */
function uflMaintenance(weight: number): number {
  return 0.035 * metabolicWeight(weight);
}

/**
 * UFL activity bonus for pasture cows
 * Pasture cows need ~10% more energy for locomotion
 */
function uflActivityBonus(maintenance: number, housing: HousingType): number {
  if (housing === "pasture") {
    return maintenance * 0.1;
  }
  return 0;
}

/**
 * UFL for growth (primiparous cows still growing)
 * Primiparous cows need +1.5 UFL/day for body growth
 */
function uflGrowth(parity: ParityType): number {
  return parity === "primiparous" ? 1.5 : 0;
}

/**
 * UFL for milk production
 * Standard: 0.44 UFL per liter of 4% fat milk
 * Adjusted for actual fat content using correction factor
 */
function uflProduction(milkLiters: number, fatPercent: number): number {
  // Fat correction: each 0.1% above/below 4% adds/removes ~0.015 UFL/liter
  const fatCorrection = (fatPercent - 4.0) * 0.015 * milkLiters;
  const base = milkLiters * 0.44;
  return base + fatCorrection;
}

/**
 * UFL for gestation (significant only in last 3 months)
 * Month 7: +0.8 UFL, Month 8: +1.5 UFL, Month 9: +2.5 UFL
 */
function uflGestation(gestationMonth: number): number {
  if (gestationMonth >= 9) return 2.5;
  if (gestationMonth >= 8) return 1.5;
  if (gestationMonth >= 7) return 0.8;
  return 0;
}

/**
 * PDI (Protein Digestible in the Intestine) for maintenance
 * Formula: 3.25 × W^0.75 (g/day)
 */
function pdiMaintenance(weight: number): number {
  return 3.25 * metabolicWeight(weight);
}

/**
 * PDI for growth (primiparous)
 * ~100-120 g/day additional protein for body growth
 */
function pdiGrowth(parity: ParityType): number {
  return parity === "primiparous" ? 110 : 0;
}

/**
 * PDI for milk production
 * Standard: ~48 g PDI per liter of 4% fat milk
 */
function pdiProduction(milkLiters: number, fatPercent: number): number {
  // Slight adjustment for fat content
  const fatCorrection = (fatPercent - 4.0) * 1.5 * milkLiters;
  return milkLiters * 48 + fatCorrection;
}

/**
 * PDI for gestation (last 3 months)
 * Month 7: +50g, Month 8: +100g, Month 9: +150g
 */
function pdiGestation(gestationMonth: number): number {
  if (gestationMonth >= 9) return 150;
  if (gestationMonth >= 8) return 100;
  if (gestationMonth >= 7) return 50;
  return 0;
}

/**
 * Main calculation function
 */
export function calculateRation(inputs: CowInputs): CalculationResult {
  const { weight, parity, status, housingType } = inputs;
  const milkLiters = inputs.milkProduction ?? 0;
  const fatPercent = inputs.milkFatPercent ?? 4.0;
  const gestationMonth = inputs.gestationMonth ?? 0;

  // UFL calculations
  const uflMaint = uflMaintenance(weight);
  const uflActivity = uflActivityBonus(uflMaint, housingType);
  const uflGrowthVal = uflGrowth(parity);
  const uflProd = status === "lactating" ? uflProduction(milkLiters, fatPercent) : 0;
  const uflGest = uflGestation(gestationMonth);

  const uflTotal = uflMaint + uflActivity + uflGrowthVal + uflProd + uflGest;

  // PDI calculations
  const pdiMaint = pdiMaintenance(weight);
  const pdiGrowthVal = pdiGrowth(parity);
  const pdiProd = status === "lactating" ? pdiProduction(milkLiters, fatPercent) : 0;
  const pdiGest = pdiGestation(gestationMonth);

  const pdiTotal = pdiMaint + pdiGrowthVal + pdiProd + pdiGest;

  return {
    ufl: {
      maintenance: round2(uflMaint),
      growth: round2(uflGrowthVal),
      production: round2(uflProd),
      gestation: round2(uflGest),
      activityBonus: round2(uflActivity),
      total: round2(uflTotal),
    },
    pdi: {
      maintenance: round0(pdiMaint),
      growth: round0(pdiGrowthVal),
      production: round0(pdiProd),
      gestation: round0(pdiGest),
      total: round0(pdiTotal),
    },
    inputs,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round0(n: number): number {
  return Math.round(n);
}
