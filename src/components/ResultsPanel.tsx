"use client";

import { useState } from "react";
import type { CalculationResult } from "@/lib/inra-calculator";
import { saveRecord } from "@/lib/cow-records";

interface Props {
  result: CalculationResult;
  cowName: string;
  onReset: () => void;
  onRecordSaved: () => void;
}

export default function ResultsPanel({ result, cowName, onReset, onRecordSaved }: Props) {
  const { ufl, pdi, inputs } = result;
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveRecord(cowName, result);
    setSaved(true);
    onRecordSaved();
  }

  const uflRows = [
    { label: "الصيانة (Entretien)", value: ufl.maintenance, icon: "🔋", color: "text-blue-300" },
    ...(ufl.activityBonus > 0
      ? [{ label: "النشاط (مرعى +10%)", value: ufl.activityBonus, icon: "🌿", color: "text-lime-300" }]
      : []),
    ...(ufl.growth > 0
      ? [{ label: "النمو (بكر)", value: ufl.growth, icon: "📈", color: "text-purple-300" }]
      : []),
    ...(ufl.production > 0
      ? [{ label: `الإنتاج (${inputs.milkProduction} ل × ${inputs.milkFatPercent?.toFixed(1)}% دهن)`, value: ufl.production, icon: "🥛", color: "text-emerald-300" }]
      : []),
    ...(ufl.gestation > 0
      ? [{ label: `الحمل (الشهر ${inputs.gestationMonth})`, value: ufl.gestation, icon: "🤰", color: "text-amber-300" }]
      : []),
  ];

  const pdiRows = [
    { label: "الصيانة (Entretien)", value: pdi.maintenance, icon: "🔋", color: "text-blue-300" },
    ...(pdi.growth > 0
      ? [{ label: "النمو (بكر)", value: pdi.growth, icon: "📈", color: "text-purple-300" }]
      : []),
    ...(pdi.production > 0
      ? [{ label: "إنتاج الحليب", value: pdi.production, icon: "🥛", color: "text-emerald-300" }]
      : []),
    ...(pdi.gestation > 0
      ? [{ label: `الحمل (الشهر ${inputs.gestationMonth})`, value: pdi.gestation, icon: "🤰", color: "text-amber-300" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-3xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-white">نتائج الحساب</h2>
        {cowName && (
          <div className="mt-1 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-1">
            <span className="text-lg">🐄</span>
            <span className="text-emerald-300 font-semibold text-sm">{cowName}</span>
          </div>
        )}
        <p className="text-emerald-300 text-sm mt-2">
          الاحتياجات اليومية المقدرة وفق نظام INRA
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="إجمالي الطاقة"
          value={ufl.total.toFixed(2)}
          unit="UFL/يوم"
          icon="⚡"
          color="from-emerald-600/40 to-teal-600/40 border-emerald-400/40"
        />
        <SummaryCard
          label="إجمالي البروتين"
          value={pdi.total.toString()}
          unit="غ PDI/يوم"
          icon="🧬"
          color="from-blue-600/40 to-indigo-600/40 border-blue-400/40"
        />
      </div>

      {/* UFL breakdown */}
      <BreakdownTable
        title="تفاصيل الطاقة (UFL)"
        rows={uflRows}
        total={ufl.total}
        unit="UFL"
        totalColor="text-emerald-400"
      />

      {/* PDI breakdown */}
      <BreakdownTable
        title="تفاصيل البروتين (PDI)"
        rows={pdiRows}
        total={pdi.total}
        unit="غ"
        totalColor="text-blue-400"
      />

      {/* Animal summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          بيانات الحيوان
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {cowName && <InfoRow label="اسم البقرة" value={cowName} />}
          <InfoRow label="الوزن" value={`${inputs.weight} كغ`} />
          <InfoRow label="الولادة" value={inputs.parity === "primiparous" ? "بكر" : "متعددة"} />
          <InfoRow label="الإيواء" value={inputs.housingType === "stall" ? "حظيرة" : "مرعى"} />
          <InfoRow label="الحالة" value={inputs.status === "lactating" ? "في الإدرار" : "جافة"} />
          {inputs.status === "lactating" && (
            <>
              <InfoRow label="الإنتاج" value={`${inputs.milkProduction} ل/يوم`} />
              <InfoRow label="نسبة الدهن" value={`${inputs.milkFatPercent?.toFixed(1)}%`} />
            </>
          )}
          {(inputs.gestationMonth ?? 0) > 0 && (
            <InfoRow label="الحمل" value={`الشهر ${inputs.gestationMonth}`} />
          )}
        </div>
      </div>

      {/* Save record button */}
      {!saved ? (
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          💾 حفظ في سجل {cowName ? `"${cowName}"` : "البقرة"}
        </button>
      ) : (
        <div className="w-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          ✅ تم الحفظ في السجل
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-white/30 text-center leading-relaxed">
        هذه القيم استرشادية. استشر متخصصاً في التغذية لخطة غذائية متكاملة.
      </p>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        🔄 حساب جديد
      </button>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SummaryCard({
  label, value, unit, icon, color,
}: {
  label: string; value: string; unit: string; icon: string; color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} border rounded-xl p-4 text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/70 mt-0.5">{unit}</div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );
}

function BreakdownTable({
  title, rows, total, unit, totalColor,
}: {
  title: string;
  rows: { label: string; value: number; icon: string; color: string }[];
  total: number;
  unit: string;
  totalColor: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{row.icon}</span>
              <span className={`text-sm ${row.color}`}>{row.label}</span>
            </div>
            <span className="text-sm font-mono text-white font-medium">
              {unit === "غ" ? row.value.toFixed(0) : row.value.toFixed(2)} {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
        <span className="text-sm font-bold text-white">الإجمالي</span>
        <span className={`text-base font-bold font-mono ${totalColor}`}>
          {unit === "غ" ? total.toFixed(0) : total.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
