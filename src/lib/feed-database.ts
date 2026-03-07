/**
 * Feed Database — INRA nutritional values for common dairy cow feeds
 * Sources: INRA 2018 tables (Alimentation des bovins, ovins et caprins)
 *
 * UFL = Unité Fourragère Lait (energy unit per kg of dry matter)
 * PDI = Protéines Digestibles dans l'Intestin (g per kg of dry matter)
 * DM  = Dry Matter content (fraction, e.g. 0.88 = 88% DM)
 */

export type FeedCategory = "roughage" | "concentrate" | "byproduct";

export interface Feed {
  id: string;
  /** Dry matter fraction (0–1) */
  dm: number;
  /** UFL per kg of fresh weight */
  uflPerKg: number;
  /** PDI (g) per kg of fresh weight */
  pdiPerKg: number;
  category: FeedCategory;
  /** Typical max inclusion as fraction of total DM intake (0–1) */
  maxFraction: number;
}

/**
 * Common feeds available in North Africa / Maghreb farms.
 * Values are per kg of FRESH weight (as-fed basis).
 */
export const FEEDS: Feed[] = [
  // ── Roughages ──────────────────────────────────────────────────────────────
  {
    id: "hay",
    dm: 0.88,
    uflPerKg: 0.72,
    pdiPerKg: 55,
    category: "roughage",
    maxFraction: 1.0,
  },
  {
    id: "straw",
    dm: 0.88,
    uflPerKg: 0.40,
    pdiPerKg: 20,
    category: "roughage",
    maxFraction: 0.4,
  },
  {
    id: "grass_fresh",
    dm: 0.20,
    uflPerKg: 0.18,
    pdiPerKg: 16,
    category: "roughage",
    maxFraction: 1.0,
  },
  {
    id: "corn_silage",
    dm: 0.33,
    uflPerKg: 0.30,
    pdiPerKg: 18,
    category: "roughage",
    maxFraction: 0.6,
  },
  {
    id: "alfalfa_hay",
    dm: 0.88,
    uflPerKg: 0.78,
    pdiPerKg: 100,
    category: "roughage",
    maxFraction: 0.5,
  },
  {
    id: "alfalfa_fresh",
    dm: 0.22,
    uflPerKg: 0.19,
    pdiPerKg: 26,
    category: "roughage",
    maxFraction: 0.5,
  },
  // ── Concentrates ───────────────────────────────────────────────────────────
  {
    id: "barley",
    dm: 0.88,
    uflPerKg: 1.05,
    pdiPerKg: 80,
    category: "concentrate",
    maxFraction: 0.4,
  },
  {
    id: "corn_grain",
    dm: 0.88,
    uflPerKg: 1.12,
    pdiPerKg: 65,
    category: "concentrate",
    maxFraction: 0.4,
  },
  {
    id: "wheat_bran",
    dm: 0.88,
    uflPerKg: 0.85,
    pdiPerKg: 100,
    category: "byproduct",
    maxFraction: 0.2,
  },
  {
    id: "soybean_meal",
    dm: 0.88,
    uflPerKg: 1.05,
    pdiPerKg: 290,
    category: "concentrate",
    maxFraction: 0.15,
  },
  {
    id: "sunflower_meal",
    dm: 0.88,
    uflPerKg: 0.85,
    pdiPerKg: 200,
    category: "concentrate",
    maxFraction: 0.15,
  },
  {
    id: "sugar_beet_pulp",
    dm: 0.88,
    uflPerKg: 0.90,
    pdiPerKg: 70,
    category: "byproduct",
    maxFraction: 0.2,
  },
];

/** Look up a feed by id */
export function getFeedById(id: string): Feed | undefined {
  return FEEDS.find((f) => f.id === id);
}
