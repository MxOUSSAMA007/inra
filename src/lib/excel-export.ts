/**
 * Excel Export Utility
 * Exports cow records to Excel format using xlsx library
 */

import * as XLSX from "xlsx";
import type { CowRecord } from "./cow-records";

function parityLabel(p: string) {
  return p === "primiparous" ? "بكر (أول ولادة)" : "متعددة الولادات";
}
function housingLabel(h: string) {
  return h === "stall" ? "حظيرة" : "مرعى";
}
function statusLabel(s: string) {
  return s === "lactating" ? "في الإدرار" : "جافة";
}

export function exportRecordsToExcel(records: CowRecord[], filename = "سجلات_الأبقار"): void {
  if (records.length === 0) return;

  // Build rows
  const rows = records.map((r) => ({
    "اسم البقرة": r.cowName,
    "التاريخ": new Date(r.date).toLocaleDateString("ar-SA"),
    "الشهر": r.month,
    "الوزن (كغ)": r.inputs.weight,
    "الحالة": statusLabel(r.inputs.status),
    "الولادة": parityLabel(r.inputs.parity),
    "نوع الإيواء": housingLabel(r.inputs.housingType),
    "إنتاج الحليب (ل/يوم)": r.inputs.milkProduction ?? 0,
    "نسبة الدهن (%)": r.inputs.milkFatPercent ?? 0,
    "شهر الحمل": r.inputs.gestationMonth ?? 0,
    "إجمالي الطاقة (UFL/يوم)": r.uflTotal,
    "طاقة الصيانة (UFL)": r.uflMaintenance,
    "طاقة الإنتاج (UFL)": r.uflProduction,
    "طاقة الحمل (UFL)": r.uflGestation,
    "طاقة النمو (UFL)": r.uflGrowth,
    "مكافأة النشاط (UFL)": r.uflActivityBonus,
    "إجمالي البروتين (غ PDI/يوم)": r.pdiTotal,
    "بروتين الصيانة (غ)": r.pdiMaintenance,
    "بروتين الإنتاج (غ)": r.pdiProduction,
    "بروتين الحمل (غ)": r.pdiGestation,
    "بروتين النمو (غ)": r.pdiGrowth,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 15 }, // اسم البقرة
    { wch: 14 }, // التاريخ
    { wch: 10 }, // الشهر
    { wch: 10 }, // الوزن
    { wch: 14 }, // الحالة
    { wch: 18 }, // الولادة
    { wch: 12 }, // نوع الإيواء
    { wch: 18 }, // إنتاج الحليب
    { wch: 14 }, // نسبة الدهن
    { wch: 10 }, // شهر الحمل
    { wch: 22 }, // إجمالي الطاقة
    { wch: 20 }, // طاقة الصيانة
    { wch: 20 }, // طاقة الإنتاج
    { wch: 18 }, // طاقة الحمل
    { wch: 18 }, // طاقة النمو
    { wch: 20 }, // مكافأة النشاط
    { wch: 24 }, // إجمالي البروتين
    { wch: 20 }, // بروتين الصيانة
    { wch: 20 }, // بروتين الإنتاج
    { wch: 18 }, // بروتين الحمل
    { wch: 18 }, // بروتين النمو
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "سجلات الأبقار");

  // Also create a per-cow summary sheet if multiple cows
  const cowNames = [...new Set(records.map((r) => r.cowName))];
  if (cowNames.length > 1) {
    const summaryRows = cowNames.map((name) => {
      const cowRecords = records.filter((r) => r.cowName === name);
      const latest = cowRecords[cowRecords.length - 1];
      const prev = cowRecords.length > 1 ? cowRecords[cowRecords.length - 2] : null;
      return {
        "اسم البقرة": name,
        "عدد السجلات": cowRecords.length,
        "آخر تسجيل": new Date(latest.date).toLocaleDateString("ar-SA"),
        "آخر طاقة (UFL)": latest.uflTotal,
        "آخر بروتين (غ PDI)": latest.pdiTotal,
        "الطاقة السابقة (UFL)": prev ? prev.uflTotal : "-",
        "البروتين السابق (غ PDI)": prev ? prev.pdiTotal : "-",
        "تغير الطاقة": prev ? (latest.uflTotal - prev.uflTotal).toFixed(2) : "-",
        "تغير البروتين": prev ? (latest.pdiTotal - prev.pdiTotal).toFixed(0) : "-",
      };
    });
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [
      { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص الأبقار");
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportCowHistoryToExcel(cowName: string, records: CowRecord[]): void {
  exportRecordsToExcel(records, `سجل_${cowName}`);
}
