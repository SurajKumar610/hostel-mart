import { EmptyState } from "@/components/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { ListingCardSkeleton } from "@/components/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useListingsBySeller } from "@/hooks/useQueries";
import { listingStore } from "@/lib/listingStore";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Laptop,
  Package,
  PenTool,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Sofa,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  Category,
  type ItemListing,
  ListingStatus,
  ListingType,
} from "../backend";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories", icon: Package },
  { value: Category.books, label: "Books", icon: BookOpen },
  { value: Category.electronics, label: "Electronics", icon: Laptop },
  { value: Category.clothing, label: "Clothing", icon: Shirt },
  { value: Category.furniture, label: "Furniture", icon: Sofa },
  { value: Category.food, label: "Food", icon: UtensilsCrossed },
  { value: Category.stationery, label: "Stationery", icon: PenTool },
  { value: Category.miscellaneous, label: "Misc", icon: Package },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: ListingType.sale, label: "For Sale" },
  { value: ListingType.trade, label: "Trade" },
  { value: ListingType.free, label: "Free" },
];

const STATUS_OPTIONS = [
  { value: ListingStatus.active, label: "Active" },
  { value: "all", label: "All Statuses" },
  { value: ListingStatus.sold, label: "Sold" },
  { value: ListingStatus.traded, label: "Traded" },
];

export function HomePage() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("all");
  const [status, setStatus] = useState<string>(ListingStatus.active);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch caller's own listings
  const callerPrincipal = identity?.getPrincipal() ?? null;
  const { data: myListings, isLoading: myLoading } =
    useListingsBySeller(callerPrincipal);

  // Fetch listings from stored seller IDs
  const storedSellerIds = useMemo(() => [...listingStore.getSellerIds()], []);

  const { data: discoveredListings, isLoading: discoveredLoading } = useQuery({
    queryKey: ["discoveredListings", storedSellerIds.join(",")],
    queryFn: async () => {
      if (!actor || storedSellerIds.length === 0) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const results = await Promise.all(
        storedSellerIds.map((sid) => {
          try {
            const p = Principal.fromText(sid);
            return actor.getListingsBySeller(p);
          } catch {
            return Promise.resolve([]);
          }
        }),
      );
      return results.flat() as ItemListing[];
    },
    enabled: !!actor && !actorFetching,
  });

  // Track current user's seller ID
  useEffect(() => {
    if (callerPrincipal) {
      listingStore.addSellerId(callerPrincipal.toString());
    }
  }, [callerPrincipal]);

  // Merge and deduplicate listings
  const allListings = useMemo(() => {
    const map = new Map<string, ItemListing>();
    for (const l of myListings ?? []) map.set(l.id, l);
    for (const l of discoveredListings ?? []) map.set(l.id, l);
    return [...map.values()].sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [myListings, discoveredListings]);

  const isLoading = myLoading || discoveredLoading || actorFetching;

  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.desc.toLowerCase().includes(q)
        )
          return false;
      }
      if (category !== "all" && l.category !== category) return false;
      if (listingType !== "all" && l.listingType !== listingType) return false;
      if (status !== "all" && l.status !== status) return false;
      return true;
    });
  }, [allListings, search, category, listingType, status]);

  const activeFilters = [
    category !== "all" && category,
    listingType !== "all" && listingType,
    status !== ListingStatus.active && status !== "all" && status,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero border-b border-border/40 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <ShoppingBag className="h-4 w-4" />
              Campus Peer-to-Peer Marketplace
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Buy, Sell & Trade
              <span className="block text-primary">Within Your Hostel</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Find great deals on books, electronics, furniture and more — all
              from fellow students.
            </p>
            {!identity && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link
                  to="/"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to post your own listings and connect with sellers.
              </p>
            )}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mx-auto mt-8 max-w-xl"
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search listings…"
                className="pl-10 pr-4 h-12 text-base bg-card shadow-card border-border/80 focus-visible:ring-primary"
                data-ocid="listing.search_input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Filter Bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-secondary"
              data-ocid="listing.toggle"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilters > 0 && (
                <Badge className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                  {activeFilters}
                </Badge>
              )}
            </button>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.slice(0, 5).map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategory(cat.value === category ? "all" : cat.value)
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === cat.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  data-ocid="listing.tab"
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {identity && (
              <div className="ml-auto">
                <Link to="/post-listing">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    data-ocid="listing.primary_button"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Post Listing
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Expanded Filters */}
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-border bg-card p-4 shadow-xs"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Category
                  </p>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-ocid="listing.select">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Listing Type
                  </p>
                  <Select value={listingType} onValueChange={setListingType}>
                    <SelectTrigger data-ocid="listing.select">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Status
                  </p>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-ocid="listing.select">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Count */}
          {!isLoading && (
            <p className="mb-4 text-sm text-muted-foreground">
              {filteredListings.length === 0
                ? "No listings found"
                : `${filteredListings.length} listing${filteredListings.length !== 1 ? "s" : ""} found`}
            </p>
          )}

          {/* Grid */}
          {isLoading ? (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-ocid="listing.loading_state"
            >
              {Array.from({ length: 8 }).map((_, sIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                <ListingCardSkeleton key={sIdx} />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="No listings yet"
              description={
                identity
                  ? "Be the first to post a listing in your hostel! Share your books, electronics, and more."
                  : "Sign in to see listings from your hostel community and post your own items."
              }
              action={
                identity ? (
                  <Link to="/post-listing">
                    <Button data-ocid="listing.primary_button">
                      Post First Listing
                    </Button>
                  </Link>
                ) : undefined
              }
              data-ocid="listing.empty_state"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListings.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} index={i} />
              ))}
            </div>
          )}

          {/* Discovery note */}
          {!isLoading && allListings.length > 0 && (
            <div className="mt-8 rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Peer-to-peer marketplace:</strong> Listings appear as
                you and other users share profile links. Visit a seller's
                profile to see all their listings.{" "}
                <Link
                  to="/requests"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Check the Request Board
                </Link>{" "}
                to find what others need.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
