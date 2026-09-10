// ListingCard — photo-first listing card with overlay badges and CTA
import { motion } from "motion/react";
import { Star, MapPin, Heart, ArrowRight } from "@phosphor-icons/react";
import { StatusBadge } from "./StatusBadge";
import { useState } from "react";

export function ListingCard({
  name,
  location,
  image,
  pricePerNight,
  rating,
  reviewCount,
  tags = [],
  verified = true,
  eco = false,
  index = 0,
  onReserve,
  compact = false,
}) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      className="glass rounded-[18px] overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.40, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Photo */}
      <div className={`relative w-full overflow-hidden ${compact ? "h-36" : "h-48"}`}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          /* Gradient placeholder when no image */
          <div className="w-full h-full"
            style={{ background: "linear-gradient(135deg, #FFE28D 0%, #FAC1A8 50%, #7B4FA0 100%)" }}
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {verified && <StatusBadge type="verified" />}
          {eco && <StatusBadge type="eco" />}
        </div>

        {/* Heart / wishlist */}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full glass-sm btn-icon flex items-center justify-center transition-all"
          onClick={() => setLiked((l) => !l)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={16}
            weight={liked ? "fill" : "regular"}
            className={liked ? "text-rose-400" : "text-white"}
          />
        </button>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 glass-dark rounded-lg px-2.5 py-1.5 flex items-baseline gap-1">
          <span className="font-display text-[15px] font-semibold text-white">
            ₹{pricePerNight?.toLocaleString("en-IN")}
          </span>
          <span className="font-sans-bhraman text-[10px] text-white/70">/ night</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-accent font-semibold text-[15px] text-white leading-snug">
              {name}
            </h3>
            <p className="font-sans-bhraman text-[11.5px] text-white/60 flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {location}
            </p>
          </div>
          {rating && (
            <div className="glass-sm rounded-lg px-2 py-1 flex items-center gap-1 shrink-0">
              <Star size={12} weight="fill" className="text-yellow-300" />
              <span className="font-mono-bhraman text-[12px] font-semibold text-white">{rating}</span>
              <span className="font-sans-bhraman text-[10px] text-white/50">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-sans-bhraman text-[10.5px] font-medium px-2 py-0.5 rounded-full glass-sm text-white/75"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {onReserve && (
          <button
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[12px] font-accent font-semibold text-[13.5px] text-white btn-primary"
            style={{ background: "#e8643a" }}
            onClick={onReserve}
          >
            Reserve with ₹1,000 Token
            <ArrowRight size={15} weight="bold" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
