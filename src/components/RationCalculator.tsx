"use client";

import { useState } from "react";
import {
  calculateRation,
  type CowInputs,
  type PhysiologicalStatus,
  type ParityType,
  type HousingType,
  type CalculationResult,
} from "@/lib/inra-calculator";
import ResultsPanel from "./ResultsPanel";

type Step = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 3;

export default function RationCalculator() {
  const [step, setStep] = useState<Step>(1);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Form state
  const [weight, setWeight] = useState<string>("600");
  const [parity, setParity] = useState<ParityType>("multiparous");
  const [housingType, setHousingType] = useState<HousingType>("stall");
  const [status, setStatus] = useState<PhysiologicalStatus>("lactating");
  const [gestationMonth, setGestationMonth] = useState<string>("0");
  const [milkProduction, setMilkProduction] = useState<string>("20");
  const [milkFatPercent, setMilkFatPercent] = useState<string>("4.0");

  function handleCalculate() {
    const inputs: CowInputs = {
      weight: parseFloat(weight) || 600,
      parity,
      housingType,
      status,
      gestationMonth: parseInt(gestationMonth) || 0,
      milkProduction: status === "lactating" ? parseFloat(milkProduction) || 0 : 0,
      milkFatPercent: parseFloat(milkFatPercent) || 4.0,
    };
    setResult(calculateRation(inputs));
    setStep(4);
  }

  function handleReset() {
    setStep(1);
    setResult(null);
  }

  const progressPercent = step < 4 ? ((step - 1) / TOTAL_STEPS) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-3">
          <span className="text-4xl">🐄</span>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            INRA Ration Calculator
          </h1>
        </div>
        <p className="text-emerald-300 text-sm max-w-md mx-auto">
          Calcul des besoins nutritionnels des vaches laitières selon le système INRA
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        {step < 4 && (
          <div className="px-6 pt-5">
            <div className="flex justify-between text-xs text-emerald-300 mb-1">
              <span>Étape {step} / {TOTAL_STEPS}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Step 1: Animal Info */}
          {step === 1 && (
            <StepOne
              weight={weight}
              setWeight={setWeight}
              parity={parity}
              setParity={setParity}
              housingType={housingType}
              setHousingType={setHousingType}
              onNext={() => setStep(2)}
            />
          )}

          {/* Step 2: Physiological Status */}
          {step === 2 && (
            <StepTwo
              status={status}
              setStatus={setStatus}
              gestationMonth={gestationMonth}
              setGestationMonth={setGestationMonth}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {/* Step 3: Milk Production */}
          {step === 3 && (
            <StepThree
              status={status}
              milkProduction={milkProduction}
              setMilkProduction={setMilkProduction}
              milkFatPercent={milkFatPercent}
              setMilkFatPercent={setMilkFatPercent}
              onBack={() => setStep(2)}
              onCalculate={handleCalculate}
            />
          )}

          {/* Step 4: Results */}
          {step === 4 && result && (
            <ResultsPanel result={result} onReset={handleReset} />
          )}
        </div>
      </div>

      <p className="mt-6 text-emerald-500 text-xs text-center">
        Basé sur les normes INRA 2018 · Pour usage indicatif
      </p>
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────────────────────── */

function StepOne({
  weight, setWeight,
  parity, setParity,
  housingType, setHousingType,
  onNext,
}: {
  weight: string; setWeight: (v: string) => void;
  parity: ParityType; setParity: (v: ParityType) => void;
  housingType: HousingType; setHousingType: (v: HousingType) => void;
  onNext: () => void;
}) {
  const isValid = parseFloat(weight) > 0;

  return (
    <div className="space-y-6">
      <StepHeader
        icon="⚖️"
        title="Informations de l'animal"
        subtitle="Entrez le poids et le profil de la vache"
      />

      <div className="space-y-4">
        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            Poids vif (kg)
          </label>
          <input
            type="number"
            min="100"
            max="1200"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="ex: 600"
          />
        </div>

        {/* Parity */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            Parité
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={parity === "primiparous"}
              onClick={() => setParity("primiparous")}
              icon="🐄"
              title="Primipare"
              subtitle="1ère lactation"
            />
            <OptionCard
              selected={parity === "multiparous"}
              onClick={() => setParity("multiparous")}
              icon="🐄🐄"
              title="Multipare"
              subtitle="2ème lactation+"
            />
          </div>
        </div>

        {/* Housing */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            Mode d&apos;élevage
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={housingType === "stall"}
              onClick={() => setHousingType("stall")}
              icon="🏠"
              title="Stabulation"
              subtitle="En bâtiment"
            />
            <OptionCard
              selected={housingType === "pasture"}
              onClick={() => setHousingType("pasture")}
              icon="🌿"
              title="Pâturage"
              subtitle="+10% énergie"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        Suivant <span>→</span>
      </button>
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────────────────────── */

function StepTwo({
  status, setStatus,
  gestationMonth, setGestationMonth,
  onBack, onNext,
}: {
  status: PhysiologicalStatus; setStatus: (v: PhysiologicalStatus) => void;
  gestationMonth: string; setGestationMonth: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  const month = parseInt(gestationMonth) || 0;

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🔬"
        title="État physiologique"
        subtitle="Situation actuelle de la vache"
      />

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            Phase de production
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={status === "lactating"}
              onClick={() => setStatus("lactating")}
              icon="🥛"
              title="En lactation"
              subtitle="Produit du lait"
            />
            <OptionCard
              selected={status === "dry"}
              onClick={() => setStatus("dry")}
              icon="💤"
              title="Tarie"
              subtitle="Période sèche"
            />
          </div>
        </div>

        {/* Gestation month */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            Mois de gestation
            <span className="ml-2 text-emerald-400 font-normal">
              (0 = non gestante)
            </span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="9"
              value={gestationMonth}
              onChange={(e) => setGestationMonth(e.target.value)}
              className="flex-1 accent-emerald-400"
            />
            <span className="text-white font-bold text-lg w-8 text-center">
              {gestationMonth}
            </span>
          </div>
          {month >= 7 && (
            <div className="mt-2 bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-2 text-amber-300 text-xs">
              ⚠️ Dernier trimestre — besoins de gestation significatifs (+
              {month >= 9 ? "2.5" : month >= 8 ? "1.5" : "0.8"} UFL/jour)
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          ← Retour
        </button>
        <button
          onClick={onNext}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3 ─────────────────────────────────────────────────────────────── */

function StepThree({
  status,
  milkProduction, setMilkProduction,
  milkFatPercent, setMilkFatPercent,
  onBack, onCalculate,
}: {
  status: PhysiologicalStatus;
  milkProduction: string; setMilkProduction: (v: string) => void;
  milkFatPercent: string; setMilkFatPercent: (v: string) => void;
  onBack: () => void; onCalculate: () => void;
}) {
  const isDry = status === "dry";

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🥛"
        title="Production laitière"
        subtitle={isDry ? "Vache tarie — pas de production laitière" : "Entrez les données de production"}
      />

      {isDry ? (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 text-blue-200 text-sm text-center">
          <p className="text-2xl mb-2">💤</p>
          <p>La vache est en période de tarissement.</p>
          <p className="mt-1 text-blue-300">Les besoins de production laitière ne seront pas calculés.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Milk production */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              Production laitière (litres/jour)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={milkProduction}
              onChange={(e) => setMilkProduction(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              placeholder="ex: 20"
            />
          </div>

          {/* Fat percent */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              Taux butyreux (% matière grasse)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="2.5"
                max="6.0"
                step="0.1"
                value={milkFatPercent}
                onChange={(e) => setMilkFatPercent(e.target.value)}
                className="flex-1 accent-emerald-400"
              />
              <span className="text-white font-bold text-lg w-12 text-center">
                {parseFloat(milkFatPercent).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-emerald-400 mt-1">
              Référence standard : 4.0% (lait normalisé)
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          ← Retour
        </button>
        <button
          onClick={onCalculate}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          🧮 Calculer
        </button>
      </div>
    </div>
  );
}

/* ─── Shared UI ──────────────────────────────────────────────────────────── */

function StepHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-emerald-300 text-sm mt-1">{subtitle}</p>
    </div>
  );
}

function OptionCard({
  selected, onClick, icon, title, subtitle,
}: {
  selected: boolean; onClick: () => void;
  icon: string; title: string; subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
        selected
          ? "border-emerald-400 bg-emerald-500/20 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="text-xs opacity-70">{subtitle}</span>
    </button>
  );
}
