"use client";

import { useState, useMemo } from "react";
import { FEEDS, type FeedCategory } from "@/lib/feed-database";
import { calculateFeedRation, DEFAULT_FEED_IDS } from "@/lib/feed-ration";
import { useLanguage } from "@/lib/language-context";

interface Props {
  targetUfl: number;
  targetPdi: number;
}

const CATEGORY_ORDER: FeedCategory[] = ["roughage", "concentrate", "byproduct"];

const FEED_ICONS: Record<string, string> = {
  hay: "🌾",
  straw: "🌿",
  grass_fresh: "🍃",
  corn_silage: "🌽",
  alfalfa_hay: "🌱",
  alfalfa_fresh: "🌱",
  barley: "🌾",
  corn_grain: "🌽",
  wheat_bran: "🌾",
  soybean_meal: "🫘",
  sunflower_meal: "🌻",
  sugar_beet_pulp: "🟤",
};

export default function FeedRationPanel({ targetUfl, targetPdi }: Props) {
  const { t } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_FEED_IDS);

  function toggleFeed(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const ration = useMemo(
    () => calculateFeedRation(targetUfl, targetPdi, selectedIds),
    [targetUfl, targetPdi, selectedIds]
  );

  // Group feeds by category for the selector
  const feedsByCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    feeds: FEEDS.filter((f) => f.category === cat),
  }));

  const feedNamesMap = t.feedNames as Record<string, string>;
  const feedCategoriesMap = t.feedCategories as Record<string, string>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-white">{t.feedRationTitle}</h3>
        <p className="text-xs text-white/50 mt-0.5">{t.feedRationSubtitle}</p>
      </div>

      {/* Feed selector */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          {t.feedRationNote}
        </p>

        {feedsByCategory.map(({ cat, feeds }) => (
          <div key={cat}>
            <p className="text-xs text-white/40 mb-1.5">
              {feedCategoriesMap[cat] ?? cat}
            </p>
            <div className="flex flex-wrap gap-2">
              {feeds.map((feed) => {
                const selected = selectedIds.includes(feed.id);
                return (
                  <button
                    key={feed.id}
                    onClick={() => toggleFeed(feed.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                      selected
                        ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-200"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span>{FEED_ICONS[feed.id] ?? "🌿"}</span>
                    <span>{feedNamesMap[feed.id] ?? feed.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Results table */}
      {ration.feeds.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">{t.feedRationResult}</h4>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                ration.balanced
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {ration.balanced ? t.feedRationBalanced : t.feedRationUnbalanced}
            </span>
          </div>

          {/* Feed rows */}
          <div className="divide-y divide-white/5">
            {ration.feeds.map((item) => (
              <div
                key={item.feed.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">
                    {FEED_ICONS[item.feed.id] ?? "🌿"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {feedNamesMap[item.feed.id] ?? item.feed.id}
                    </div>
                    <div className="text-xs text-white/40">
                      {item.uflContrib.toFixed(2)} UFL · {item.pdiContrib} g PDI
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ms-3">
                  <div className="text-lg font-bold text-emerald-300">
                    {item.kgPerDay.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/40">{t.kgPerDay}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals row */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/10 space-y-1.5">
            <TotalRow
              label={t.feedRationTotal}
              ufl={ration.totalUfl}
              pdi={ration.totalPdi}
              color="text-white"
            />
            <TotalRow
              label={t.feedRationTarget}
              ufl={ration.targetUfl}
              pdi={ration.targetPdi}
              color="text-white/50"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-white/40 text-sm">
            {t.feedRationNote}
          </p>
        </div>
      )}
    </div>
  );
}

function TotalRow({
  label,
  ufl,
  pdi,
  color,
}: {
  label: string;
  ufl: number;
  pdi: number;
  color: string;
}) {
  return (
    <div className={`flex items-center justify-between text-xs ${color}`}>
      <span className="font-semibold">{label}</span>
      <span className="font-mono">
        {ufl.toFixed(2)} UFL · {pdi} g PDI
      </span>
    </div>
  );
}
