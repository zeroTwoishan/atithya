// DiscoverNearby — photo-first proactive discovery feed
import { useState } from "react";
import { motion } from "motion/react";
import {
  MagnifyingGlass, Sliders, MapPin, Lightning,
  ArrowRight, Fire,
} from "@phosphor-icons/react";
import { ListingCard } from "../../components/ListingCard";

// ── Category filter chips ─────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "homestay", label: "Homestays" },
  { id: "trek", label: "Treks & Trails" },
  { id: "artisan", label: "Artisans" },
  { id: "food", label: "Pahadi Food" },
  { id: "offbeat", label: "Offbeat" },
];

// ── Listing data — real Himachal Pradesh ─────────────────────
const LISTINGS = [
  {
    id: 1,
    name: "Meera Devi's Himalayan Homestay",
    location: "Tirthan Valley, Kullu",
    pricePerNight: 1850,
    rating: 4.92,
    reviewCount: 51,
    verified: true,
    eco: true,
    tags: ["Kathkuni Cedar", "Bukhari Heating", "Dham Meals"],
    category: "homestay",
  },
  {
    id: 2,
    name: "Chhoie Waterfall Trek — Guided",
    location: "Gushaini, Tirthan Valley",
    pricePerNight: 650,
    rating: 4.87,
    reviewCount: 34,
    verified: true,
    eco: false,
    tags: ["6 km Trail", "Pine Forest", "Sacred Falls"],
    category: "trek",
  },
  {
    id: 3,
    name: "Ramesh Kumar — Kullu Shawl Weaver",
    location: "Bhuntar, Kullu Valley",
    pricePerNight: 200,
    rating: 4.95,
    reviewCount: 18,
    verified: true,
    eco: false,
    tags: ["Loom Demo", "Handwoven Shawls", "Custom Orders"],
    category: "artisan",
  },
  {
    id: 4,
    name: "Sita's Siddu & Dham Thali Experience",
    location: "Naggar, Kullu",
    pricePerNight: 450,
    rating: 4.80,
    reviewCount: 27,
    verified: true,
    eco: false,
    tags: ["Home Cooking", "Siddu & Chutney", "Dham Thali"],
    category: "food",
  },
  {
    id: 5,
    name: "Jalori Pass Meadow Camp",
    location: "Jalori Pass, 3,120m",
    pricePerNight: 1200,
    rating: 4.78,
    reviewCount: 42,
    verified: true,
    eco: true,
    tags: ["High Altitude", "Star Gazing", "Bonfire Included"],
    category: "offbeat",
  },
  {
    id: 6,
    name: "Parvati Riverside Cottage",
    location: "Kasol, Parvati Valley",
    pricePerNight: 1400,
    rating: 4.85,
    reviewCount: 63,
    verified: true,
    eco: false,
    tags: ["River View", "Yoga Deck", "Israeli Breakfasts"],
    category: "homestay",
  },
];

// ── Proactive tip banner ──────────────────────────────────────
function ProactiveTip() {
  return (
    <motion.div
      className="glass rounded-[14px] px-4 py-3 flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{ background: "linear-gradient(120deg, rgba(255,226,141,0.15), rgba(191,78,48,0.12))" }}
    >
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,226,141,0.2)", border: "1px solid rgba(255,226,141,0.3)" }}>
        <Lightning size={18} weight="fill" style={{ color: "#FFE28D" }} />
      </div>
      <div className="flex-1">
        <p className="font-accent font-bold text-[12px] text-white">Tirthan Valley is trending 🔥</p>
        <p className="font-sans-bhraman text-[11px] text-white/60 leading-snug mt-0.5">
          Bookings up 38% this week. 12 new verified listings added.
        </p>
      </div>
      <ArrowRight size={16} className="text-white/40 shrink-0" />
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function DiscoverNearby() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = LISTINGS.filter((l) => {
    const matchCategory = activeCategory === "all" || l.category === activeCategory;
    const matchSearch =
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 pt-4 pb-3 z-30 safe-top">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-[21px] font-semibold text-white leading-none">
              Discover Nearby
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} style={{ color: "#FAC1A8" }} />
              <span className="font-accent text-[11.5px] font-medium" style={{ color: "#FAC1A8" }}>
                Tirthan Valley, Himachal Pradesh
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full glass-sm">
              <Fire size={13} weight="fill" style={{ color: "#FAC1A8" }} />
              <span className="font-accent font-bold text-[10px] text-white">12 New</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="glass-sm rounded-full px-3 py-2 flex items-center gap-2 mb-3">
          <MagnifyingGlass size={16} className="text-white/50 shrink-0" />
          <input
            id="input-search-discover"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search experiences, places, hosts..."
            className="flex-1 bg-transparent text-[12.5px] text-white placeholder-white/35 focus:outline-none font-sans-bhraman"
          />
          <button
            id="btn-filter"
            className="w-7 h-7 rounded-full glass flex items-center justify-center text-white/70 shrink-0 active:scale-90 transition"
            aria-label="Filter listings"
          >
            <Sliders size={14} />
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map(({ id, label }) => {
            const active = activeCategory === id;
            return (
              <button
                key={id}
                id={`filter-${id}`}
                onClick={() => setActiveCategory(id)}
                className="shrink-0 px-4 py-1.5 rounded-full font-accent text-[12px] font-semibold btn-chip"
                style={{
                  background: active
                    ? "#e8643a"
                    : "rgba(255,255,255,0.08)",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.60)",
                  border: active ? "1px solid rgba(232,100,58,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(16px)",
                  boxShadow: active ? "0 4px 16px rgba(232,100,58,0.35)" : "none",
                }}
                aria-pressed={active}
                aria-label={`Filter by ${label}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Feed */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-36 space-y-4">
        <ProactiveTip />

        {/* Section label */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="font-accent font-bold text-[10.5px] uppercase tracking-widest text-white/40">
            {activeCategory === "all" ? "All Experiences" : CATEGORIES.find(c => c.id === activeCategory)?.label}
          </p>
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-mono-bhraman text-[10px] text-white/35">{filtered.length} found</span>
        </motion.div>

        {/* Listing cards */}
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((listing, i) => (
              <ListingCard key={listing.id} {...listing} index={i} onReserve={() => {}} />
            ))}
          </div>
        ) : (
          <motion.div
            className="glass-sm rounded-[16px] p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-display text-[22px] text-white/30 mb-2">🌿</p>
            <p className="font-accent font-semibold text-[14px] text-white/60">No results found</p>
            <p className="font-sans-bhraman text-[12px] text-white/40 mt-1">
              Try a different category or search term
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
