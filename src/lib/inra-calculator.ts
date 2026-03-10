/**
 * INRA (Institut National de la Recherche Agronomique) Ration Calculator
 * Based on the French INRA system for dairy cow nutritional requirements.
 * Units: UFL (Unité Fourragère Lait) for energy, PDI (g/day) for protein.
 * 
 * Features:
 * - Calculate daily nutritional requirements (UFL, PDIN, PDIE)
 * - Calculate dry matter intake capacity (MSI - Matière Sèche Ingestible)
 * - PDIN/PDIE balance analysis
 * - Warning system for nutritional imbalances
 */

export type PhysiologicalStatus = "lactating" | "dry";
export type ParityType = "primiparous" | "multiparous";
export type HousingType = "stall" | "pasture";

export type AgeCategory = "calf" | "heifer" | "mature"; // calf: 6-15mo, heifer: 15-24mo, mature: >24mo

export interface CowInputs {
  weight: number; // kg
  ageMonths: number; // age in months (6+ for weaned calves)
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

// ============ New: Dry Matter Intake & Balance Interfaces ============

export type WarningLevel = "none" | "info" | "warning" | "critical";

export interface RationWarning {
  level: WarningLevel;
  type: "energy_deficit" | "nitrogen_excess" | "protein_imbalance" | "dmi_exceeded" | "ration_ok";
  message: string;
  messageAr: string;
  messageFr: string;
}

export interface DMICapacity {
  maxDMI: number;        // Maximum dry matter intake (kg DM/day)
  roughageDMI: number;   // Roughage portion (kg DM/day)
  concentrateDMI: number; // Concentrate portion (kg DM/day)
  actualIntake: number;  // If ration provided, actual intake
  isConstrained: boolean; // Whether intake is limited by capacity
}

export interface ProteinBalance {
  pdin: number;           // PDIN (rumen degradable protein, g/day)
  pdie: number;           // PDIE (intestinal digestible protein, g/day)
  balance: number;        // PDIN - PDIE (should be close to 0)
  status: "deficient" | "excess" | "balanced";
  utilization: number;    // PDIE/PDIN ratio (should be ~0.85-1.0)
}

export interface EnhancedCalculationResult extends CalculationResult {
  dmi: DMICapacity;
  proteinBalance: ProteinBalance;
  warnings: RationWarning[];
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
 * Determine age category based on months
 */
function getAgeCategory(ageMonths: number): AgeCategory {
  if (ageMonths < 15) return "calf";       // العجول النامية: 6-14 شهر
  if (ageMonths < 24) return "heifer";     // العجلات الملقحة: 15-23 شهر
  return "mature";                          // الأبقار البالغة: 24+ شهر
}

/**
 * UFL for growth based on age category
 * - calves (6-15mo): need high energy for rapid growth ~2.5 UFL
 * - heifers (15-24mo): moderate growth ~1.5 UFL
 * - mature (24mo+): minimal growth ~0.5 UFL
 */
function uflGrowthByAge(ageCategory: AgeCategory, parity: ParityType): number {
  // For primiparous (first-time mothers), they are still growing
  if (parity === "primiparous") {
    switch (ageCategory) {
      case "calf": return 2.5;    //快速增长
      case "heifer": return 1.5; //中等增长
      case "mature": return 0.5; //最小增长
    }
  }
  // For multiparous, no growth needs
  return 0;
}

/**
 * PDI for growth based on age category (g/day)
 */
function pdiGrowthByAge(ageCategory: AgeCategory, parity: ParityType): number {
  if (parity === "primiparous") {
    switch (ageCategory) {
      case "calf": return 350;   // high protein for growth
      case "heifer": return 200; // moderate
      case "mature": return 50;  // minimal
    }
  }
  return 0;
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
 * PDI for growth based on age (primiparous)
 */
function pdiGrowth(ageCategory: AgeCategory, parity: ParityType): number {
  return pdiGrowthByAge(ageCategory, parity);
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

// ============ New: DMI (Dry Matter Intake) Calculations ============

/**
 * Calculate maximum dry matter intake capacity (MSI - Matière Sèche Ingestible)
 * Based on INRA equations for dairy cows
 * 
 * Factors:
 * - Metabolic weight (W^0.75) is base
 * - Lactation increases intake capacity
 * - Late gestation decreases intake
 * - Body condition affects intake
 */
export function calculateDMICapacity(inputs: CowInputs): DMICapacity {
  const { weight, status, milkProduction, gestationMonth } = inputs;
  const milk = milkProduction ?? 0;
  
  // Base: 0.025 × W^0.75 for mature cows
  // This gives ~12-15 kg DM for a 600 kg cow
  let maxDMI = weight * 0.025;
  
  // Lactation bonus: +0.4 kg DM per kg milk above 15 liters
  if (status === "lactating" && milk > 15) {
    maxDMI += (milk - 15) * 0.4;
  }
  
  // Late gestation penalty (last 2 months): -10% to -20%
  if (gestationMonth && gestationMonth >= 8) {
    const penalty = gestationMonth >= 9 ? 0.20 : 0.10;
    maxDMI *= (1 - penalty);
  }
  
  // Roughage:concentrate ratio (typical: 60:40 to 70:30)
  const roughageDMI = maxDMI * 0.65;
  const concentrateDMI = maxDMI * 0.35;
  
  return {
    maxDMI: round1(maxDMI),
    roughageDMI: round1(roughageDMI),
    concentrateDMI: round1(concentrateDMI),
    actualIntake: 0,
    isConstrained: false,
  };
}

/**
 * Check if ration DMI exceeds capacity and calculate constraint
 */
export function checkDMIConstraint(
  totalFeedDM: number, 
  capacity: DMICapacity
): DMICapacity {
  const isConstrained = totalFeedDM > capacity.maxDMI;
  
  return {
    ...capacity,
    actualIntake: round1(totalFeedDM),
    isConstrained,
  };
}

// ============ New: Protein Balance (PDIN/PDIE) Calculations ============

/**
 * Calculate PDIN/PDIE balance
 * 
 * PDIN = Protein Digestible in the Intestine from Rumen-degradable N
 * PDIE = Protein Digestible in the Intestine from Endogenous sources
 * 
 * The balance should be close to 0 (PDIE ≤ PDIN)
 * Optimal utilization: PDIE/PDIN = 0.85-1.0
 */
export function calculateProteinBalance(
  pdiRequired: number,
  feedPDIN: number,
  feedPDIE: number
): ProteinBalance {
  const balance = feedPDIN - feedPDIE;
  
  // Utilization ratio: how well is rumen N being used?
  const utilization = feedPDIN > 0 ? feedPDIE / feedPDIN : 0;
  
  // Determine status
  let status: "deficient" | "excess" | "balanced";
  
  if (feedPDIE < pdiRequired * 0.95) {
    status = "deficient";
  } else if (balance > 50) {
    // More than 50g excess PDIN = excess N in rumen
    status = "excess";
  } else {
    status = "balanced";
  }
  
  return {
    pdin: round0(feedPDIN),
    pdie: round0(feedPDIE),
    balance: round0(balance),
    status,
    utilization: round2(utilization),
  };
}

// ============ New: Warning System ============

/**
 * Generate nutritional warnings based on ration analysis
 */
export function generateWarnings(
  requirements: CalculationResult,
  actualUFL: number,
  actualPDI: number,
  dmiCapacity: DMICapacity,
  totalFeedDM: number
): RationWarning[] {
  const warnings: RationWarning[] = [];
  const { ufl, pdi } = requirements;
  
  // 1. Energy Deficit Check (Déficit énergétique)
  const energyDeficit = ufl.total - actualUFL;
  if (energyDeficit > 0.5) {
    warnings.push({
      level: energyDeficit > 1.5 ? "critical" : "warning",
      type: "energy_deficit",
      message: `Energy deficit: ${round1(energyDeficit)} UFL below requirements`,
      messageAr: `عجز في الطاقة: ${round1(energyDeficit)} وحدة علفية أقل من الاحتياجات`,
      messageFr: `Déficit énergétique: ${round1(energyDeficit)} UFL en dessous des besoins`,
    });
  }
  
  // 2. Nitrogen Excess Check (Excès azoté)
  // If PDIN >> PDIE, excess nitrogen in rumen -> environmental issue + reduced efficiency
  const proteinBalance = calculateProteinBalance(pdi.total, actualPDI, actualPDI * 0.85);
  if (proteinBalance.status === "excess") {
    warnings.push({
      level: "warning",
      type: "nitrogen_excess",
      message: "Excess rumen degradable protein - nitrogen efficiency low",
      messageAr: "فائض في البروتين القابل للتحلل في الكرش - كفاءة النيتروجين منخفضة",
      messageFr: "Excès de protéines dégradables dans le rumen - efficacité de l'azote faible",
    });
  }
  
  // 3. Protein Imbalance Check (Déséquilibre protéique)
  if (Math.abs(pdi.total - actualPDI) > 100) {
    const deficit = pdi.total - actualPDI;
    warnings.push({
      level: Math.abs(deficit) > 150 ? "critical" : "warning",
      type: "protein_imbalance",
      message: `Protein ${deficit > 0 ? "deficit" : "excess"}: ${round0(Math.abs(deficit))}g PDI`,
      messageAr: `بروتين ${deficit > 0 ? "ناقص" : "زائد"}: ${round0(Math.abs(deficit))} غرام PDI`,
      messageFr: `Protéines ${deficit > 0 ? "déficit" : "excès"}: ${round0(Math.abs(deficit))}g PDI`,
    });
  }
  
  // 4. DMI Exceeded Check
  if (dmiCapacity.isConstrained || totalFeedDM > dmiCapacity.maxDMI) {
    warnings.push({
      level: "warning",
      type: "dmi_exceeded",
      message: `DMI exceeds capacity (${round1(totalFeedDM)} > ${round1(dmiCapacity.maxDMI)} kg DM)`,
      messageAr: `المادة الجافة المتناولة تتجاوز السعة (${round1(totalFeedDM)} > ${round1(dmiCapacity.maxDMI)} كجم مادة جافة)`,
      messageFr: `MSI dépasse la capacité (${round1(totalFeedDM)} > ${round1(dmiCapacity.maxDMI)} kg MS)`,
    });
  }
  
  // 5. Ration OK (no warnings)
  if (warnings.length === 0) {
    warnings.push({
      level: "none",
      type: "ration_ok",
      message: "Ration is balanced and meets all requirements",
      messageAr: "العلوفة متزنة وتلبي جميع الاحتياجات",
      messageFr: "La ration est équilibrée et répond à tous les besoins",
    });
  }
  
  return warnings;
}

/**
 * Main calculation function
 */
export function calculateRation(inputs: CowInputs): CalculationResult {
  const { weight, ageMonths, parity, status, housingType } = inputs;
  const milkLiters = inputs.milkProduction ?? 0;
  const fatPercent = inputs.milkFatPercent ?? 4.0;
  const gestationMonth = inputs.gestationMonth ?? 0;

  // Determine age category
  const ageCategory = getAgeCategory(ageMonths);

  // UFL calculations
  const uflMaint = uflMaintenance(weight);
  const uflActivity = uflActivityBonus(uflMaint, housingType);
  const uflGrowthVal = uflGrowthByAge(ageCategory, parity);
  const uflProd = status === "lactating" ? uflProduction(milkLiters, fatPercent) : 0;
  const uflGest = uflGestation(gestationMonth);

  const uflTotal = uflMaint + uflActivity + uflGrowthVal + uflProd + uflGest;

  // PDI calculations
  const pdiMaint = pdiMaintenance(weight);
  const pdiGrowthVal = pdiGrowth(ageCategory, parity);
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round0(n: number): number {
  return Math.round(n);
}

// ============ New: Enhanced Calculation with All Features ============

/**
 * Enhanced calculation that includes DMI, protein balance, and warnings
 * Use this for complete ration analysis
 */
export function calculateRationEnhanced(inputs: CowInputs): EnhancedCalculationResult {
  // Get base requirements
  const baseResult = calculateRation(inputs);
  
  // Calculate DMI capacity
  const dmi = calculateDMICapacity(inputs);
  
  // Calculate protein balance (using requirements as targets)
  const proteinBalance = calculateProteinBalance(
    baseResult.pdi.total,
    baseResult.pdi.total,
    baseResult.pdi.total * 0.9 // Assume 90% efficiency for requirements
  );
  
  // Initially no warnings (would need actual feed data for full analysis)
  const warnings: RationWarning[] = [
    {
      level: "none",
      type: "ration_ok",
      message: "Requirements calculated - add feed data for complete analysis",
      messageAr: "تم حساب الاحتياجات - أضف بيانات الأعلاف للتحليل الكامل",
      messageFr: "Besoins calculés - ajoutez les données d'aliment pour l'analyse complète",
    },
  ];
  
  return {
    ...baseResult,
    dmi,
    proteinBalance,
    warnings,
  };
}

/**
 * Analyze a complete ration and generate warnings
 * Use after calculating feed amounts
 */
export function analyzeRation(
  inputs: CowInputs,
  actualUFL: number,
  actualPDI: number,
  totalFeedDM: number
): EnhancedCalculationResult {
  const baseResult = calculateRation(inputs);
  const dmi = calculateDMICapacity(inputs);
  const constrainedDMI = checkDMIConstraint(totalFeedDM, dmi);
  
  // For actual feed analysis, we need both PDIN and PDIE from feeds
  // For now, estimate PDIE as 90% of PDIN (typical rumen efficiency)
  const proteinBalance = calculateProteinBalance(
    baseResult.pdi.total,
    actualPDI,
    actualPDI * 0.9
  );
  
  const warnings = generateWarnings(
    baseResult,
    actualUFL,
    actualPDI,
    constrainedDMI,
    totalFeedDM
  );
  
  return {
    ...baseResult,
    dmi: constrainedDMI,
    proteinBalance,
    warnings,
  };
}
