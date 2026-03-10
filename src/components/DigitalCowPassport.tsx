"use client";

import { useMemo, useState } from "react";
import { getUniqueCowNames } from "@/lib/cow-records";
import {
  buildNutritionHints,
  computeReproductionDates,
  createTreatment,
  getAllPassports,
  getPassportByCowId,
  getWithdrawalAlerts,
  savePassport,
  type CowPassport,
} from "@/lib/cow-passport";

const MEDICINE_PRESETS = [
  { name: "Oxytetracycline", milkDays: 3, meatDays: 28 },
  { name: "Penicillin", milkDays: 4, meatDays: 14 },
  { name: "Ivermectin", milkDays: 7, meatDays: 28 },
];

function emptyPassport(cowId = ""): CowPassport {
  return {
    identity: { cowId, name: cowId, breed: "", birthDate: "" },
    genetics: { damId: "", sireId: "" },
    reproduction: { gestationMonth: 0 },
    treatments: [],
    milkToday: undefined,
  };
}

export default function DigitalCowPassport() {
  const [cowId, setCowId] = useState("");
  const [passport, setPassport] = useState<CowPassport>(emptyPassport());
  const [milkYesterday, setMilkYesterday] = useState<number | undefined>(undefined);

  const knownCows = getUniqueCowNames();
  const allPassports = getAllPassports();

  const alerts = useMemo(() => getWithdrawalAlerts(passport), [passport]);
  const hints = useMemo(
    () => buildNutritionHints(passport.reproduction.gestationMonth, passport.milkToday, milkYesterday),
    [passport.reproduction.gestationMonth, passport.milkToday, milkYesterday]
  );

  function loadCow(nextCowId: string) {
    setCowId(nextCowId);
    if (!nextCowId) {
      setPassport(emptyPassport());
      return;
    }

    const saved = getPassportByCowId(nextCowId);
    if (saved) {
      setPassport(saved);
    } else {
      setPassport(emptyPassport(nextCowId));
    }
  }

  function autoComputeReproduction(inseminationDate: string) {
    const dates = computeReproductionDates(inseminationDate);
    setPassport((prev) => ({
      ...prev,
      reproduction: {
        ...prev.reproduction,
        lastInseminationDate: inseminationDate,
        ...dates,
      },
    }));
  }

  function addTreatment(medName: string, milkDays: number, meatDays: number) {
    if (!medName) return;
    const newTx = createTreatment(medName, new Date().toISOString().slice(0, 10), milkDays, meatDays);
    setPassport((prev) => ({ ...prev, treatments: [newTx, ...prev.treatments] }));
  }

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mt-6 space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold">📘 السجل الصحي والوراثي (Digital Cow Passport)</h2>
        <p className="text-white/70 text-sm mt-1">إدارة هوية البقرة، نسبها، تكاثرها، الأدوية وفترة السحب في مكان واحد.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-white/80 text-xs">اختيار بقرة من السجلات</label>
          <select
            className="w-full mt-1 bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20"
            value={cowId}
            onChange={(e) => loadCow(e.target.value)}
          >
            <option value="">-- اختر --</option>
            {knownCows.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-white/60 self-end">عدد جوازات الأبقار المسجلة: <span className="text-emerald-300 font-bold">{allPassports.length}</span></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="رقم الأذن / Cow ID" value={passport.identity.cowId} onChange={(e) => setPassport((p) => ({ ...p, identity: { ...p.identity, cowId: e.target.value } }))} />
        <input className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="الاسم" value={passport.identity.name} onChange={(e) => setPassport((p) => ({ ...p, identity: { ...p.identity, name: e.target.value } }))} />
        <input className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="السلالة (Holstein / Montbéliarde...)" value={passport.identity.breed} onChange={(e) => setPassport((p) => ({ ...p, identity: { ...p.identity, breed: e.target.value } }))} />
        <input type="date" className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" value={passport.identity.birthDate ?? ""} onChange={(e) => setPassport((p) => ({ ...p, identity: { ...p.identity, birthDate: e.target.value } }))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="الأم (Dam ID)" value={passport.genetics.damId ?? ""} onChange={(e) => setPassport((p) => ({ ...p, genetics: { ...p.genetics, damId: e.target.value } }))} />
        <input className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="الثور / المني (Sire ID)" value={passport.genetics.sireId ?? ""} onChange={(e) => setPassport((p) => ({ ...p, genetics: { ...p.genetics, sireId: e.target.value } }))} />
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-semibold">🗓️ الجدول التكاثري</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="date" className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" value={passport.reproduction.lastInseminationDate ?? ""} onChange={(e) => autoComputeReproduction(e.target.value)} />
          <input type="number" min={0} max={9} className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="شهر الحمل (0-9)" value={passport.reproduction.gestationMonth ?? 0} onChange={(e) => setPassport((p) => ({ ...p, reproduction: { ...p.reproduction, gestationMonth: parseInt(e.target.value) || 0 } }))} />
          <input disabled className="bg-black/30 text-white/70 rounded-lg px-3 py-2 border border-white/10" value={passport.reproduction.pregnancyCheckDate ?? ""} placeholder="تنبيه فحص الحمل (+35/+40 يوم)" />
          <input disabled className="bg-black/30 text-white/70 rounded-lg px-3 py-2 border border-white/10" value={passport.reproduction.dryOffDate ?? ""} placeholder="تنبيه التجفيف" />
          <input disabled className="bg-black/30 text-white/70 rounded-lg px-3 py-2 border border-white/10 md:col-span-2" value={passport.reproduction.expectedCalvingDate ?? ""} placeholder="تاريخ الولادة المتوقع" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-semibold">💉 فترة السحب (Withdrawal Period)</h3>
        <div className="flex flex-wrap gap-2">
          {MEDICINE_PRESETS.map((m) => (
            <button key={m.name} onClick={() => addTreatment(m.name, m.milkDays, m.meatDays)} className="bg-rose-500/20 border border-rose-300/30 text-rose-200 px-3 py-1 rounded-lg text-xs hover:bg-rose-500/30">
              + {m.name}
            </button>
          ))}
        </div>
        {alerts.length > 0 ? (
          <div className="space-y-2">
            {alerts.map((a, idx) => (
              <div key={`${a.medicineName}-${idx}`} className="bg-red-500/20 border border-red-400/40 text-red-100 rounded-lg px-3 py-2 text-sm">
                🚫 {a.type === "milk" ? "منع بيع الحليب" : "منع الذبح"} بسبب <b>{a.medicineName}</b> لمدة <b>{a.daysLeft}</b> يوم (حتى {new Date(a.untilDate).toLocaleDateString("ar")})
              </div>
            ))}
          </div>
        ) : (
          <div className="text-emerald-300 text-sm">✅ لا توجد فترات سحب نشطة.</div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-white font-semibold">🥛 الربط مع التغذية (UFL/PDI)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="number" className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="إنتاج اليوم (لتر)" value={passport.milkToday ?? ""} onChange={(e) => setPassport((p) => ({ ...p, milkToday: parseFloat(e.target.value) || 0 }))} />
          <input type="number" className="bg-black/20 text-white rounded-lg px-3 py-2 border border-white/20" placeholder="إنتاج أمس (لتر)" value={milkYesterday ?? ""} onChange={(e) => setMilkYesterday(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-1">
          {hints.length > 0 ? hints.map((h) => <p key={h} className="text-amber-200 text-sm">{h}</p>) : <p className="text-white/50 text-sm">لا توجد ملاحظات غذائية حالياً.</p>}
        </div>
      </div>

      <button
        onClick={() => savePassport(passport)}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl"
      >
        💾 حفظ الجواز الرقمي للبقرة
      </button>
    </div>
  );
}
