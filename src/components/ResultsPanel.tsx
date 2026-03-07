"use client";

import type { CalculationResult } from "@/lib/inra-calculator";

interface Props {
  result: CalculationResult;
  onReset: () => void;
}

export default function ResultsPanel({ result, onReset }: Props) {
  const { ufl, pdi, inputs } = result;

  const uflRows = [
    { label: "Entretien (maintenance)", value: ufl.maintenance, icon: "🔋", color: "text-blue-300" },
    ...(ufl.activityBonus > 0
      ? [{ label: "Activité (pâturage +10%)", value: ufl.activityBonus, icon: "🌿", color: "text-lime-300" }]
      : []),
    ...(ufl.growth > 0
      ? [{ label: "Croissance (primipare)", value: ufl.growth, icon: "📈", color: "text-purple-300" }]
      : []),
    ...(ufl.production > 0
      ? [{ label: `Production (${inputs.milkProduction} L × ${inputs.milkFatPercent?.toFixed(1)}% MG)`, value: ufl.production, icon: "🥛", color: "text-emerald-300" }]
      : []),
    ...(ufl.gestation > 0
      ? [{ label: `Gestation (mois ${inputs.gestationMonth})`, value: ufl.gestation, icon: "🤰", color: "text-amber-300" }]
      : []),
  ];

  const pdiRows = [
    { label: "Entretien (maintenance)", value: pdi.maintenance, icon: "🔋", color: "text-blue-300" },
    ...(pdi.growth > 0
      ? [{ label: "Croissance (primipare)", value: pdi.growth, icon: "📈", color: "text-purple-300" }]
      : []),
    ...(pdi.production > 0
      ? [{ label: "Production laitière", value: pdi.production, icon: "🥛", color: "text-emerald-300" }]
      : []),
    ...(pdi.gestation > 0
      ? [{ label: `Gestation (mois ${inputs.gestationMonth})`, value: pdi.gestation, icon: "🤰", color: "text-amber-300" }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-3xl mb-2">✅</div>
        <h2 className="text-xl font-bold text-white">Résultats du calcul</h2>
        <p className="text-emerald-300 text-sm mt-1">
          Besoins journaliers estimés selon INRA
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Énergie totale"
          value={ufl.total.toFixed(2)}
          unit="UFL/jour"
          icon="⚡"
          color="from-emerald-600/40 to-teal-600/40 border-emerald-400/40"
        />
        <SummaryCard
          label="Protéines totales"
          value={pdi.total.toString()}
          unit="g PDI/jour"
          icon="🧬"
          color="from-blue-600/40 to-indigo-600/40 border-blue-400/40"
        />
      </div>

      {/* UFL breakdown */}
      <BreakdownTable
        title="Détail Énergie (UFL)"
        rows={uflRows}
        total={ufl.total}
        unit="UFL"
        totalColor="text-emerald-400"
      />

      {/* PDI breakdown */}
      <BreakdownTable
        title="Détail Protéines (PDI)"
        rows={pdiRows}
        total={pdi.total}
        unit="g"
        totalColor="text-blue-400"
      />

      {/* Animal summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Profil de l&apos;animal
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoRow label="Poids" value={`${inputs.weight} kg`} />
          <InfoRow label="Parité" value={inputs.parity === "primiparous" ? "Primipare" : "Multipare"} />
          <InfoRow label="Élevage" value={inputs.housingType === "stall" ? "Stabulation" : "Pâturage"} />
          <InfoRow label="État" value={inputs.status === "lactating" ? "En lactation" : "Tarie"} />
          {inputs.status === "lactating" && (
            <>
              <InfoRow label="Production" value={`${inputs.milkProduction} L/j`} />
              <InfoRow label="Taux MG" value={`${inputs.milkFatPercent?.toFixed(1)}%`} />
            </>
          )}
          {(inputs.gestationMonth ?? 0) > 0 && (
            <InfoRow label="Gestation" value={`Mois ${inputs.gestationMonth}`} />
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-white/30 text-center leading-relaxed">
        Ces valeurs sont indicatives. Consultez un nutritionniste pour un plan d&apos;alimentation complet.
      </p>

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        🔄 Nouveau calcul
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
              {unit === "g" ? row.value.toFixed(0) : row.value.toFixed(2)} {unit}
            </span>
          </div>
        ))}
      </div>
      <div className={`flex items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10`}>
        <span className="text-sm font-bold text-white">Total</span>
        <span className={`text-base font-bold font-mono ${totalColor}`}>
          {unit === "g" ? total.toFixed(0) : total.toFixed(2)} {unit}
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
