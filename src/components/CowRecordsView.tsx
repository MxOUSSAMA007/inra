"use client";

import { useState, useMemo } from "react";
import {
  getAllRecords,
  deleteRecord,
  formatDate,
  type CowRecord,
} from "@/lib/cow-records";
import { exportRecordsToExcel, exportCowHistoryToExcel } from "@/lib/excel-export";

interface Props {
  onClose: () => void;
}

export default function CowRecordsView({ onClose }: Props) {
  const [records, setRecords] = useState<CowRecord[]>(() => getAllRecords());
  const [selectedCow, setSelectedCow] = useState<string | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Derive cow names from records
  const cowNames = useMemo(() => {
    const names = records.map((r) => r.cowName);
    return [...new Set(names)].sort();
  }, [records]);

  function loadData() {
    setRecords(getAllRecords());
  }

  const filteredRecords =
    selectedCow === "all"
      ? records
      : records.filter((r) => r.cowName === selectedCow);

  // Sort newest first
  const sorted = [...filteredRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function handleDelete(id: string) {
    deleteRecord(id);
    loadData();
    setConfirmDelete(null);
  }

  function handleExportAll() {
    exportRecordsToExcel(records);
  }

  function handleExportCow() {
    if (selectedCow !== "all") {
      exportCowHistoryToExcel(selectedCow, filteredRecords);
    } else {
      exportRecordsToExcel(records);
    }
  }

  // Group records by cow for comparison view
  const cowGroups: Record<string, CowRecord[]> = {};
  for (const r of sorted) {
    if (!cowGroups[r.cowName]) cowGroups[r.cowName] = [];
    cowGroups[r.cowName].push(r);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-4xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <h1 className="text-2xl font-bold text-white">سجلات الأبقار</h1>
              <p className="text-emerald-300 text-sm">متابعة الاحتياجات الغذائية لكل بقرة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm font-medium"
          >
            ← العودة للحاسبة
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-4xl mb-4 flex flex-wrap gap-3 items-center justify-between">
        {/* Cow filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCow("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              selectedCow === "all"
                ? "bg-emerald-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            🐄 الكل ({records.length})
          </button>
          {cowNames.map((name) => {
            const count = records.filter((r) => r.cowName === name).length;
            return (
              <button
                key={name}
                onClick={() => setSelectedCow(name)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  selectedCow === name
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                🐄 {name} ({count})
              </button>
            );
          })}
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleExportCow}
            disabled={records.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
          >
            📥 تحميل Excel
            {selectedCow !== "all" && ` (${selectedCow})`}
          </button>
          {selectedCow !== "all" && (
            <button
              onClick={handleExportAll}
              disabled={records.length === 0}
              className="bg-teal-600 hover:bg-teal-500 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              📥 تحميل الكل
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {records.length === 0 && (
        <div className="w-full max-w-4xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🐄</div>
          <h2 className="text-xl font-bold text-white mb-2">لا توجد سجلات بعد</h2>
          <p className="text-emerald-300 text-sm">
            قم بحساب الحصة الغذائية لبقرة وحفظها لتظهر هنا
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            ابدأ الحساب
          </button>
        </div>
      )}

      {/* Records */}
      {sorted.length > 0 && (
        <div className="w-full max-w-4xl space-y-4">
          {/* Comparison view: show per-cow with last vs current */}
          {selectedCow === "all" ? (
            Object.entries(cowGroups).map(([name, cowRecs]) => (
              <CowGroup
                key={name}
                name={name}
                records={cowRecs}
                onDelete={(id) => setConfirmDelete(id)}
                onSelectCow={() => setSelectedCow(name)}
              />
            ))
          ) : (
            <CowGroup
              name={selectedCow}
              records={sorted}
              onDelete={(id) => setConfirmDelete(id)}
              onSelectCow={() => {}}
              expanded
            />
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-emerald-950 border border-white/20 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-white font-bold text-lg mb-2">حذف السجل؟</h3>
            <p className="text-emerald-300 text-sm mb-6">
              هذا الإجراء لا يمكن التراجع عنه
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl font-medium transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2.5 rounded-xl font-medium transition"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CowGroup ─────────────────────────────────────────────────────────────── */

function CowGroup({
  name,
  records,
  onDelete,
  onSelectCow,
  expanded = false,
}: {
  name: string;
  records: CowRecord[];
  onDelete: (id: string) => void;
  onSelectCow: () => void;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(expanded);
  const latest = records[0];
  const previous = records[1] ?? null;

  const uflDiff = previous ? latest.uflTotal - previous.uflTotal : null;
  const pdiDiff = previous ? latest.pdiTotal - previous.pdiTotal : null;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
      {/* Cow header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐄</span>
          <div className="text-left">
            <div className="text-white font-bold text-lg">{name}</div>
            <div className="text-emerald-300 text-xs">
              {records.length} سجل · آخر تسجيل: {formatDate(latest.date)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Latest values */}
          <div className="text-right hidden sm:block">
            <div className="text-white font-mono text-sm">
              ⚡ {latest.uflTotal.toFixed(2)} UFL
              {uflDiff !== null && (
                <span className={`ml-2 text-xs ${uflDiff > 0 ? "text-red-400" : uflDiff < 0 ? "text-green-400" : "text-white/40"}`}>
                  {uflDiff > 0 ? "▲" : uflDiff < 0 ? "▼" : "="}{Math.abs(uflDiff).toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-white font-mono text-sm">
              🧬 {latest.pdiTotal} غ PDI
              {pdiDiff !== null && (
                <span className={`ml-2 text-xs ${pdiDiff > 0 ? "text-red-400" : pdiDiff < 0 ? "text-green-400" : "text-white/40"}`}>
                  {pdiDiff > 0 ? "▲" : pdiDiff < 0 ? "▼" : "="}{Math.abs(pdiDiff).toFixed(0)}
                </span>
              )}
            </div>
          </div>
          <span className="text-white/50 text-lg">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Comparison bar (last vs current) */}
      {previous && (
        <div className="px-5 pb-3 grid grid-cols-2 gap-3">
          <CompareCard
            label="الشهر الماضي"
            date={formatDate(previous.date)}
            ufl={previous.uflTotal}
            pdi={previous.pdiTotal}
            milk={previous.inputs.milkProduction ?? 0}
            dim
          />
          <CompareCard
            label="الآن"
            date={formatDate(latest.date)}
            ufl={latest.uflTotal}
            pdi={latest.pdiTotal}
            milk={latest.inputs.milkProduction ?? 0}
            highlight
          />
        </div>
      )}

      {/* Expanded records list */}
      {open && (
        <div className="border-t border-white/10">
          <div className="px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-semibold">
            جميع السجلات
          </div>
          <div className="divide-y divide-white/5">
            {records.map((rec, idx) => (
              <RecordRow
                key={rec.id}
                record={rec}
                isLatest={idx === 0}
                onDelete={() => onDelete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CompareCard ──────────────────────────────────────────────────────────── */

function CompareCard({
  label, date, ufl, pdi, milk, dim, highlight,
}: {
  label: string; date: string; ufl: number; pdi: number; milk: number;
  dim?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 border ${
      highlight
        ? "bg-emerald-500/20 border-emerald-400/40"
        : "bg-white/5 border-white/10"
    } ${dim ? "opacity-70" : ""}`}>
      <div className={`text-xs font-semibold mb-1 ${highlight ? "text-emerald-300" : "text-white/50"}`}>
        {label}
      </div>
      <div className="text-white/40 text-xs mb-2">{date}</div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-white/60">⚡ طاقة</span>
          <span className="text-white font-mono font-medium">{ufl.toFixed(2)} UFL</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/60">🧬 بروتين</span>
          <span className="text-white font-mono font-medium">{pdi} غ</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/60">🥛 حليب</span>
          <span className="text-white font-mono font-medium">{milk} ل</span>
        </div>
      </div>
    </div>
  );
}

/* ─── RecordRow ────────────────────────────────────────────────────────────── */

function RecordRow({
  record, isLatest, onDelete,
}: {
  record: CowRecord; isLatest: boolean; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isLatest && (
            <span className="bg-emerald-500/30 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
              الأحدث
            </span>
          )}
          <span className="text-white/60 text-sm">{formatDate(record.date)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-sm">
            ⚡ {record.uflTotal.toFixed(2)} · 🧬 {record.pdiTotal}غ
          </span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-white/40 hover:text-white/80 text-xs transition"
          >
            {expanded ? "إخفاء" : "تفاصيل"}
          </button>
          <button
            onClick={onDelete}
            className="text-red-400/60 hover:text-red-400 text-xs transition"
          >
            🗑️
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <DetailItem label="الوزن" value={`${record.inputs.weight} كغ`} />
          <DetailItem label="الحالة" value={record.inputs.status === "lactating" ? "في الإدرار" : "جافة"} />
          <DetailItem label="الإيواء" value={record.inputs.housingType === "stall" ? "حظيرة" : "مرعى"} />
          {record.inputs.milkProduction ? (
            <DetailItem label="الحليب" value={`${record.inputs.milkProduction} ل/يوم`} />
          ) : null}
          {record.inputs.milkFatPercent ? (
            <DetailItem label="نسبة الدهن" value={`${record.inputs.milkFatPercent.toFixed(1)}%`} />
          ) : null}
          {(record.inputs.gestationMonth ?? 0) > 0 ? (
            <DetailItem label="شهر الحمل" value={`الشهر ${record.inputs.gestationMonth}`} />
          ) : null}
          <DetailItem label="طاقة الصيانة" value={`${record.uflMaintenance.toFixed(2)} UFL`} />
          <DetailItem label="طاقة الإنتاج" value={`${record.uflProduction.toFixed(2)} UFL`} />
          <DetailItem label="بروتين الإنتاج" value={`${record.pdiProduction} غ`} />
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg px-3 py-2">
      <div className="text-white/40 text-xs">{label}</div>
      <div className="text-white font-medium text-xs mt-0.5">{value}</div>
    </div>
  );
}
