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
import { getAllRecords } from "@/lib/cow-records";
import ResultsPanel from "./ResultsPanel";
import CowRecordsView from "./CowRecordsView";

type Step = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 3;

export default function RationCalculator() {
  const [step, setStep] = useState<Step>(1);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  // Cow name
  const [cowName, setCowName] = useState<string>("");

  // Form state
  const [weight, setWeight] = useState<string>("600");
  const [parity, setParity] = useState<ParityType>("multiparous");
  const [housingType, setHousingType] = useState<HousingType>("stall");
  const [status, setStatus] = useState<PhysiologicalStatus>("lactating");
  const [gestationMonth, setGestationMonth] = useState<string>("0");
  const [milkProduction, setMilkProduction] = useState<string>("20");
  const [milkFatPercent, setMilkFatPercent] = useState<string>("4.0");

  const totalRecords = getAllRecords().length;

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
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <div className="text-center mb-8 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1" />
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl">🐄</span>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              حاسبة INRA
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowRecords(true)}
              className="relative bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-medium"
            >
              📋 السجلات
              {totalRecords > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalRecords > 99 ? "99+" : totalRecords}
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-emerald-300 text-sm max-w-md mx-auto">
          حساب الاحتياجات الغذائية للأبقار الحلوب وفق نظام INRA
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        {step < 4 && (
          <div className="px-6 pt-5">
            <div className="flex justify-between text-xs text-emerald-300 mb-1">
              <span>الخطوة {step} / {TOTAL_STEPS}</span>
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
        مبني على معايير INRA 2018 · للاستخدام الاسترشادي
      </p>
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────────────────────── */

function StepOne({
  cowName, setCowName,
  weight, setWeight,
  parity, setParity,
  housingType, setHousingType,
  onNext,
}: {
  cowName: string; setCowName: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  parity: ParityType; setParity: (v: ParityType) => void;
  housingType: HousingType; setHousingType: (v: HousingType) => void;
  onNext: () => void;
}) {
  const isValid = parseFloat(weight) > 0;

  return (
    <div className="space-y-6">
      <StepHeader
        icon="🐄"
        title="بيانات البقرة"
        subtitle="أدخل اسم البقرة ومعلوماتها الأساسية"
      />

      <div className="space-y-4">
        {/* Cow Name */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            اسم البقرة
            <span className="ml-2 text-emerald-400 font-normal text-xs">(مثال: 1، ماريا، نجمة...)</span>
          </label>
          <input
            type="text"
            value={cowName}
            onChange={(e) => setCowName(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="أدخل اسم أو رقم البقرة"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            الوزن الحي (كغ)
          </label>
          <input
            type="number"
            min="100"
            max="1200"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            placeholder="مثال: 600"
          />
        </div>

        {/* Parity */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            الولادة
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={parity === "primiparous"}
              onClick={() => setParity("primiparous")}
              icon="🐄"
              title="بكر"
              subtitle="أول ولادة"
            />
            <OptionCard
              selected={parity === "multiparous"}
              onClick={() => setParity("multiparous")}
              icon="🐄🐄"
              title="متعددة"
              subtitle="ثاني ولادة فأكثر"
            />
          </div>
        </div>

        {/* Housing */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            نوع الإيواء
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={housingType === "stall"}
              onClick={() => setHousingType("stall")}
              icon="🏠"
              title="حظيرة"
              subtitle="داخل المبنى"
            />
            <OptionCard
              selected={housingType === "pasture"}
              onClick={() => setHousingType("pasture")}
              icon="🌿"
              title="مرعى"
              subtitle="+10% طاقة"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        التالي →
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
        title="الحالة الفسيولوجية"
        subtitle="الوضع الحالي للبقرة"
      />

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            مرحلة الإنتاج
          </label>
          <div className="grid grid-cols-2 gap-3">
            <OptionCard
              selected={status === "lactating"}
              onClick={() => setStatus("lactating")}
              icon="🥛"
              title="في الإدرار"
              subtitle="تنتج حليباً"
            />
            <OptionCard
              selected={status === "dry"}
              onClick={() => setStatus("dry")}
              icon="💤"
              title="جافة"
              subtitle="فترة التجفيف"
            />
          </div>
        </div>

        {/* Gestation month */}
        <div>
          <label className="block text-sm font-medium text-emerald-200 mb-1.5">
            شهر الحمل
            <span className="ml-2 text-emerald-400 font-normal">
              (0 = غير حامل)
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
              ⚠️ الثلث الأخير من الحمل — احتياجات حمل مرتفعة (+
              {month >= 9 ? "2.5" : month >= 8 ? "1.5" : "0.8"} UFL/يوم)
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          ← رجوع
        </button>
        <button
          onClick={onNext}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          التالي →
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
        title="إنتاج الحليب"
        subtitle={isDry ? "البقرة جافة — لا إنتاج حليب" : "أدخل بيانات الإنتاج"}
      />

      {isDry ? (
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 text-blue-200 text-sm text-center">
          <p className="text-2xl mb-2">💤</p>
          <p>البقرة في فترة التجفيف.</p>
          <p className="mt-1 text-blue-300">لن يتم احتساب احتياجات إنتاج الحليب.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Milk production */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              إنتاج الحليب (لتر/يوم)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={milkProduction}
              onChange={(e) => setMilkProduction(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              placeholder="مثال: 20"
            />
          </div>

          {/* Fat percent */}
          <div>
            <label className="block text-sm font-medium text-emerald-200 mb-1.5">
              نسبة الدهن (%)
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
              المعيار القياسي: 4.0% (حليب معياري)
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-200"
        >
          ← رجوع
        </button>
        <button
          onClick={onCalculate}
          className="flex-2 flex-grow bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          🧮 احسب
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
