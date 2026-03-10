export interface CowIdentity {
  cowId: string; // ear tag / unique id
  name: string;
  breed: string;
  birthDate: string; // ISO date
}

export interface CowGenetics {
  damId?: string; // mother
  sireId?: string; // bull/semen id
}

export interface ReproductionTimeline {
  lastInseminationDate?: string;
  pregnancyCheckDate?: string; // usually +35-40 days
  dryOffDate?: string; // expected calving - 60 days
  expectedCalvingDate?: string;
  gestationMonth?: number;
}

export interface TreatmentRecord {
  id: string;
  medicineName: string;
  dateGiven: string;
  milkWithdrawalDays: number;
  meatWithdrawalDays: number;
}

export interface CowPassport {
  identity: CowIdentity;
  genetics: CowGenetics;
  reproduction: ReproductionTimeline;
  treatments: TreatmentRecord[];
  milkToday?: number;
}

export interface WithdrawalAlert {
  type: "milk" | "meat";
  untilDate: string;
  daysLeft: number;
  medicineName: string;
}

export interface PassportValidation {
  valid: boolean;
  error?: string;
}

const STORAGE_KEY = "inra_digital_cow_passports";

export function getAllPassports(): CowPassport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CowPassport[];
  } catch {
    return [];
  }
}

export function validatePassport(passport: CowPassport): PassportValidation {
  if (!passport.identity.cowId.trim()) {
    return { valid: false, error: "رقم الأذن / Cow ID مطلوب." };
  }

  if (!passport.identity.name.trim()) {
    return { valid: false, error: "اسم البقرة مطلوب." };
  }

  const gm = passport.reproduction.gestationMonth ?? 0;
  if (gm < 0 || gm > 9) {
    return { valid: false, error: "شهر الحمل يجب أن يكون بين 0 و 9." };
  }

  return { valid: true };
}

function sanitizePassport(passport: CowPassport): CowPassport {
  return {
    ...passport,
    identity: {
      ...passport.identity,
      cowId: passport.identity.cowId.trim(),
      name: passport.identity.name.trim(),
      breed: passport.identity.breed.trim(),
    },
  };
}

export function savePassport(passport: CowPassport): CowPassport {
  const normalized = sanitizePassport(passport);
  const all = getAllPassports();
  const idx = all.findIndex((p) => p.identity.cowId === normalized.identity.cowId);
  if (idx >= 0) {
    all[idx] = normalized;
  } else {
    all.push(normalized);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return normalized;
}

export function getPassportByCowId(cowId: string): CowPassport | null {
  return getAllPassports().find((p) => p.identity.cowId === cowId) ?? null;
}

export function createTreatment(medicineName: string, dateGiven: string, milkWithdrawalDays: number, meatWithdrawalDays: number): TreatmentRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    medicineName,
    dateGiven,
    milkWithdrawalDays,
    meatWithdrawalDays,
  };
}

function addDays(baseISO: string, days: number): Date {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWithdrawalAlerts(passport: CowPassport, nowDate = new Date()): WithdrawalAlert[] {
  const alerts: WithdrawalAlert[] = [];

  for (const tx of passport.treatments) {
    const milkUntil = addDays(tx.dateGiven, tx.milkWithdrawalDays);
    const meatUntil = addDays(tx.dateGiven, tx.meatWithdrawalDays);

    const milkDaysLeft = Math.ceil((milkUntil.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
    const meatDaysLeft = Math.ceil((meatUntil.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

    if (milkDaysLeft > 0) {
      alerts.push({
        type: "milk",
        untilDate: milkUntil.toISOString(),
        daysLeft: milkDaysLeft,
        medicineName: tx.medicineName,
      });
    }

    if (meatDaysLeft > 0) {
      alerts.push({
        type: "meat",
        untilDate: meatUntil.toISOString(),
        daysLeft: meatDaysLeft,
        medicineName: tx.medicineName,
      });
    }
  }

  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function computeReproductionDates(lastInseminationDate?: string) {
  if (!lastInseminationDate) {
    return {
      pregnancyCheckDate: "",
      expectedCalvingDate: "",
      dryOffDate: "",
    };
  }

  const insemination = new Date(lastInseminationDate);
  const pregnancyCheck = new Date(insemination);
  pregnancyCheck.setDate(pregnancyCheck.getDate() + 38);

  const calving = new Date(insemination);
  calving.setDate(calving.getDate() + 283);

  const dryOff = new Date(calving);
  dryOff.setDate(dryOff.getDate() - 60);

  return {
    pregnancyCheckDate: pregnancyCheck.toISOString().slice(0, 10),
    expectedCalvingDate: calving.toISOString().slice(0, 10),
    dryOffDate: dryOff.toISOString().slice(0, 10),
  };
}

export function buildNutritionHints(gestationMonth?: number, milkToday?: number, milkYesterday?: number): string[] {
  const hints: string[] = [];

  if ((gestationMonth ?? 0) >= 7) {
    hints.push("🐄 الشهر السابع+ من الحمل: أضف احتياجات الحمل تلقائياً في حساب UFL/PDI.");
  }

  if (typeof milkToday === "number" && typeof milkYesterday === "number") {
    const diff = milkYesterday - milkToday;
    if (diff >= 2) {
      hints.push("📉 انخفاض الحليب ملحوظ: راجع توازن PDI والبروتين المتاح في العليقة.");
    }
  }

  return hints;
}
