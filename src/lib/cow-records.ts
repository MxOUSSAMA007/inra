/**
 * Cow Records Storage
 * Manages per-cow calculation history using localStorage
 */

import type { CalculationResult, CowInputs } from "./inra-calculator";

export interface CowRecord {
  id: string;
  cowName: string;
  date: string; // ISO date string
  month: string; // "YYYY-MM" for grouping
  inputs: CowInputs;
  uflTotal: number;
  pdiTotal: number;
  uflMaintenance: number;
  uflProduction: number;
  uflGestation: number;
  uflGrowth: number;
  uflActivityBonus: number;
  pdiMaintenance: number;
  pdiProduction: number;
  pdiGestation: number;
  pdiGrowth: number;
}

const STORAGE_KEY = "inra_cow_records";

export function getAllRecords(): CowRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CowRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(cowName: string, result: CalculationResult): CowRecord {
  const now = new Date();
  const record: CowRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cowName: cowName.trim() || "غير مسمى",
    date: now.toISOString(),
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    inputs: result.inputs,
    uflTotal: result.ufl.total,
    pdiTotal: result.pdi.total,
    uflMaintenance: result.ufl.maintenance,
    uflProduction: result.ufl.production,
    uflGestation: result.ufl.gestation,
    uflGrowth: result.ufl.growth,
    uflActivityBonus: result.ufl.activityBonus,
    pdiMaintenance: result.pdi.maintenance,
    pdiProduction: result.pdi.production,
    pdiGestation: result.pdi.gestation,
    pdiGrowth: result.pdi.growth,
  };

  const existing = getAllRecords();
  existing.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return record;
}

export function deleteRecord(id: string): void {
  const records = getAllRecords().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getRecordsByCow(cowName: string): CowRecord[] {
  return getAllRecords().filter(
    (r) => r.cowName.toLowerCase() === cowName.toLowerCase()
  );
}

export function getUniqueCowNames(): string[] {
  const names = getAllRecords().map((r) => r.cowName);
  return [...new Set(names)].sort();
}

export function getRecordsByMonth(month: string): CowRecord[] {
  return getAllRecords().filter((r) => r.month === month);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return date.toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
