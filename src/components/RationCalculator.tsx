"use client";

import { useState, useEffect } from "react";
import {
  calculateRation,
  type CowInputs,
  type PhysiologicalStatus,
  type ParityType,
  type HousingType,
  type CalculationResult,
} from "@/lib/inra-calculator";
import { getAllRecords } from "@/lib/cow-records";
import { useLanguage, LANGUAGE_LABELS, type Language } from "@/lib/language-context";
import ResultsPanel from "./ResultsPanel";
import CowRecordsView from "./CowRecordsView";

type Step = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 3;

/* ─── Language Switcher ──────────────────────────────────────────────────── */

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const langs: Language[] = ["ar", "fr", "en"];

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            lang === l
              ? "bg-emerald-500 text-white shadow"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          {LANGUAGE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function RationCalculator() {
  const { t, dir } = useLanguage();
  const [step, setStep] = useState<Step>(1);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  // Cow name
  const [cowName, setCowName] = useState<string>("");

  // Form state
  const [weight, setWeight] = useState<string>("600");
  const [ageMonths, setAgeMonths] = useState<string>("36");
  const [parity, setParity] = useState<ParityType>("multiparous");
  const [housingType, setHousingType] = useState<HousingType>("stall");
  const [status, setStatus] = useState<PhysiologicalStatus>("lactating");
  const [gestationMonth, setGestationMonth] = useState<string>("0");
  const [milkProduction, setMilkProduction] = useState<string>("20");
  const [milkFatPercent, setMilkFatPercent] = useState<string>("4.0");

  const [totalRecords, setTotalRecords] = useState(0);
  useEffect(() => {
    // Read from localStorage (client-only) after mount / when records change
    Promise.resolve(getAllRecords().length).then(setTotalRecords);
  }, [recordsRefreshKey]);

  function handleCalculate() {
    const inputs: CowInputs = {
      weight: parseFloat(weight) || 600,
      ageMonths: parseInt(ageMonths) || 36,
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
    setCowName("");
  }

  function handleRecordSaved() {
    setRecordsRefreshKey((k) => k + 1);
  }

  const progressPercent = step < 4 ? ((step - 1) / TOTAL_STEPS) * 100 : 100;

  if (showRecords) {
    return (
      <CowRecordsView
        key={recordsRefreshKey}
        onClose={() => setShowRecords(false)}
      />
    );
  }

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 flex flex-col items-center justify-start py-10 px-4"
    >
      {/* Language switcher — top bar */}
      <div className="w-full max-w-xl flex justify-end mb-4">
        <LanguageSwitcher />
      </div>

      {/* Header */}
      <div className="text-center mb-8 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1" />
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl">🐄</span>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {t.appTitle}
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowRecords(true)}
              className="relative bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-medium"
            >
              📋 {t.records}
              {totalRecords > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalRecords > 99 ? "99+" : totalRecords}
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-emerald-300 text-sm max-w-md mx-auto">
          {t.appSubtitle}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        {step < 4 && (
          <div className="px-6 pt-5">
            <div className="flex justify-between text-xs text-emerald-300 mb-1">
              <span>{t.step} {step} {t.of} {TOTAL_STEPS}</span>
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
          {/* Step 1: Animal Info + Cow Name */}
          {step === 1 && (
            <StepOne
              cowName={cowName}
              setCowName={setCowName}
              weight={weight}
              setWeight={setWeight}
              ageMonths={ageMonths}
              setAgeMonths={setAgeMonths}
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
            <ResultsPanel
              result={result}
              cowName={cowName}
              onReset={handleReset}
              onRecordSaved={handleRecordSaved}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-emerald-500 text-xs text-center">
        {t.footer}
      </p>
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────────────────────── */

function StepOne({
  cowName, setCowName,
  weight, setWeight,
  ageMonths, setAgeMonths,
  parity, setParity,
  housingType, setHousingType,
  onNext,
}: {
  cowName: string; setCowName: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  ageMonths: string; setAgeMonths: (v: string) => void;
  parity: ParityType; setParity: (v: ParityType) => void;
  housingType: HousingType; setHousingType: (v: HousingType) => void;
  onNext: () => void;
}) {
  const { t } = useLanguage();
  const isValid = parseFloat(weight) > 0;

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🐄"
        title={t.step1Title}
        subtitle={t.step1Subtitle}
      />

      <div className="space-y-4">
        {/* Cow Name */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.cowName}
            <span className="mx-2 text-emerald-400 font-normal text-xs">{t.cowNameHint}</span>
          </label>
          <input
            type="text"
            value={cowName}
            onChange={(e) => setCowName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder={t.cowNamePlaceholder}
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.liveWeight}
          </label>
          <input
            type="number"
            min="100"
            max="1200"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder={t.weightPlaceholder}
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.ageInMonths}
          </label>
          <input
            type="number"
            min="6"
            max="240"
            value={ageMonths}
            onChange={(e) => setAgeMonths(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder={t.agePlaceholder}
          />
        </div>

        {/* Age Category */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.ageCategory}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <OptionCard
              selected={(parseInt(ageMonths) || 0) >= 6 && (parseInt(ageMonths) || 0) < 15}
              onClick={() => setAgeMonths("10")}
              icon="🐄"
              title={t.calf}
              subtitle={t.calfSubtitle}
            />
            <OptionCard
              selected={(parseInt(ageMonths) || 0) >= 15 && (parseInt(ageMonths) || 0) < 24}
              onClick={() => setAgeMonths("18")}
              icon="🐄"
              title={t.heifer}
              subtitle={t.heiferSubtitle}
            />
            <OptionCard
              selected={(parseInt(ageMonths) || 0) >= 24}
              onClick={() => setAgeMonths("36")}
              icon="🐄🐄"
              title={t.mature}
              subtitle={t.matureSubtitle}
            />
          </div>
        </div>

        {/* Parity */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.parity}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={parity === "primiparous"}
              onClick={() => setParity("primiparous")}
              icon="🐄"
              title={t.primiparous}
              subtitle={t.primiparousSubtitle}
            />
            <OptionCard
              selected={parity === "multiparous"}
              onClick={() => setParity("multiparous")}
              icon="🐄🐄"
              title={t.multiparous}
              subtitle={t.multiparousSubtitle}
            />
          </div>
        </div>

        {/* Housing */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.housing}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={housingType === "stall"}
              onClick={() => setHousingType("stall")}
              icon="🏠"
              title={t.stall}
              subtitle={t.stallSubtitle}
            />
            <OptionCard
              selected={housingType === "pasture"}
              onClick={() => setHousingType("pasture")}
              icon="🌿"
              title={t.pasture}
              subtitle={t.pastureSubtitle}
            />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        {t.next}
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
  const { t } = useLanguage();
  const month = parseInt(gestationMonth) || 0;

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🔬"
        title={t.step2Title}
        subtitle={t.step2Subtitle}
      />

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.productionStage}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={status === "lactating"}
              onClick={() => setStatus("lactating")}
              icon="🥛"
              title={t.lactating}
              subtitle={t.lactatingSubtitle}
            />
            <OptionCard
              selected={status === "dry"}
              onClick={() => setStatus("dry")}
              icon="💤"
              title={t.dry}
              subtitle={t.drySubtitle}
            />
          </div>
        </div>

        {/* Gestation month */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            {t.gestationMonth}
            <span className="mx-2 text-emerald-400 font-normal">
              {t.notPregnant}
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
              {t.lastTrimesterWarning(
                month >= 9 ? "2.5" : month >= 8 ? "1.5" : "0.8"
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          {t.back}
        </button>
        <button
          onClick={onNext}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {t.next}
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
  const { t } = useLanguage();
  const isDry = status === "dry";

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🥛"
        title={t.step3Title}
        subtitle={isDry ? t.step3SubtitleDry : t.step3SubtitleLactating}
      />

      {isDry ? (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 text-blue-200 text-sm text-center">
          <p className="text-2xl mb-2">💤</p>
          <p>{t.dryMessage}</p>
          <p className="mt-1 text-blue-300">{t.dryMessageSub}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Milk production */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              {t.milkProduction}
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={milkProduction}
              onChange={(e) => setMilkProduction(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              placeholder={t.milkPlaceholder}
            />
          </div>

          {/* Fat percent */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              {t.fatPercent}
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
              {t.fatStandard}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          {t.back}
        </button>
        <button
          onClick={onCalculate}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {t.calculate}
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
      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
        selected
          ? "bg-emerald-500/30 border-emerald-400/60 ring-1 ring-emerald-400/40"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-white font-semibold text-sm">{title}</span>
      <span className="text-white/50 text-xs">{subtitle}</span>
    </button>
  );
}
