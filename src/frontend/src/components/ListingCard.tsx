import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice, truncate } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, Clock, Gift, Package, Tag } from "lucide-react";
import { motion } from "motion/react";
import {
  Category,
  type ItemListing,
  ListingStatus,
  ListingType,
} from "../backend";

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.books]: "Books",
  [Category.electronics]: "Electronics",
  [Category.clothing]: "Clothing",
  [Category.furniture]: "Furniture",
  [Category.food]: "Food",
  [Category.stationery]: "Stationery",
  [Category.miscellaneous]: "Misc",
};

const CATEGORY_COLORS: Record<Category, string> = {
  [Category.books]: "bg-cobalt/10 text-cobalt",
  [Category.electronics]: "bg-primary/10 text-primary",
  [Category.clothing]: "bg-rose/10 text-rose",
  [Category.furniture]: "bg-emerald/10 text-emerald",
  [Category.food]: "bg-amber-500/10 text-amber-700",
  [Category.stationery]: "bg-violet-500/10 text-violet-700",
  [Category.miscellaneous]: "bg-muted text-muted-foreground",
};

function ListingTypeBadge({ type }: { type: ListingType }) {
  if (type === ListingType.sale) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
        <Tag className="h-3 w-3" />
        For Sale
      </span>
    );
  }
  if (type === ListingType.trade) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs font-semibold text-cobalt">
        <ArrowLeftRight className="h-3 w-3" />
        Trade
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-emerald">
      <Gift className="h-3 w-3" />
      Free
    </span>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const map = {
    [ListingStatus.active]: {
      label: "Active",
      className: "bg-emerald/10 text-emerald",
    },
    [ListingStatus.sold]: { label: "Sold", className: "bg-rose/10 text-rose" },
    [ListingStatus.traded]: {
      label: "Traded",
      className: "bg-cobalt/10 text-cobalt",
    },
    [ListingStatus.fulfilled]: {
      label: "Fulfilled",
      className: "bg-muted text-muted-foreground",
    },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

interface ListingCardProps {
  listing: ItemListing;
  sellerName?: string;
  index?: number;
}

export function ListingCard({
  listing,
  sellerName,
  index = 0,
}: ListingCardProps) {
  const photoUrl = listing.photos[0]?.getDirectURL();
  const isInactive = listing.status !== ListingStatus.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className={cn(
          "listing-card group block rounded-xl border border-border bg-card shadow-card overflow-hidden",
          isInactive && "opacity-70",
        )}
        data-ocid={`listing.item.${index + 1}`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          {isInactive && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <StatusBadge status={listing.status} />
            </div>
          )}
          <div className="absolute right-2 top-2">
            <ListingTypeBadge type={listing.listingType} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-display text-sm font-semibold leading-tight text-card-foreground line-clamp-2">
              {listing.title}
            </h3>
            {listing.listingType === ListingType.sale &&
              listing.price !== undefined && (
                <span className="shrink-0 font-display text-sm font-bold text-primary">
                  {formatPrice(listing.price)}
                </span>
              )}
          </div>

          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
            {truncate(listing.desc, 80)}
          </p>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                CATEGORY_COLORS[listing.category],
              )}
            >
              {CATEGORY_LABELS[listing.category]}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(listing.createdAt)}
            </div>
          </div>

          {sellerName && (
            <p className="mt-2 text-xs text-muted-foreground">
              By{" "}
              <span className="font-medium text-foreground">{sellerName}</span>
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
