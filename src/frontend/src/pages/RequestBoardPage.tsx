import { EmptyState } from "@/components/EmptyState";
import { RequestCardSkeleton } from "@/components/LoadingSkeleton";
import { RequestCard } from "@/components/RequestCard";
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
import { listingStore } from "@/lib/listingStore";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardList, Plus, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Category, RequestStatus, type WantedRequest } from "../backend";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: Category.books, label: "Books" },
  { value: Category.electronics, label: "Electronics" },
  { value: Category.clothing, label: "Clothing" },
  { value: Category.furniture, label: "Furniture" },
  { value: Category.food, label: "Food" },
  { value: Category.stationery, label: "Stationery" },
  { value: Category.miscellaneous, label: "Misc" },
];

export function RequestBoardPage() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>(RequestStatus.open);

  // Fetch requests from known requester IDs
  const storedSellerIds = useMemo(() => [...listingStore.getSellerIds()], []);

  const { data: allRequests, isLoading } = useQuery({
    queryKey: ["requests", "all", storedSellerIds.join(",")],
    queryFn: async () => {
      if (!actor) return [];
      const requesterIds = [...storedSellerIds];
      if (identity) requesterIds.push(identity.getPrincipal().toString());

      const unique = [...new Set(requesterIds)];
      if (unique.length === 0) return [];

      const { Principal } = await import("@icp-sdk/core/principal");
      const results = await Promise.all(
        unique.map((sid) => {
          try {
            const p = Principal.fromText(sid);
            return actor.getRequestsByRequester(p);
          } catch {
            return Promise.resolve([]);
          }
        }),
      );
      return results.flat() as WantedRequest[];
    },
    enabled: !!actor && !actorFetching,
  });

  const filteredRequests = useMemo(() => {
    return (allRequests ?? [])
      .filter((r) => {
        if (search) {
          const q = search.toLowerCase();
          if (
            !r.title.toLowerCase().includes(q) &&
            !r.desc.toLowerCase().includes(q)
          )
            return false;
        }
        if (category !== "all" && r.category !== category) return false;
        if (status !== "all" && r.status !== status) return false;
        return true;
      })
      .sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [allRequests, search, category, status]);

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
                Want Board
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Request Board
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                See what fellow students are looking for. Have it? Reach out!
              </p>
            </div>
            {identity && (
              <Link to="/post-request">
                <Button
                  className="gap-2 shrink-0"
                  data-ocid="request.primary_button"
                >
                  <Plus className="h-4 w-4" />
                  Post a Request
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="pl-9"
              data-ocid="request.search_input"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]" data-ocid="request.select">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]" data-ocid="request.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RequestStatus.open}>Open</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value={RequestStatus.fulfilled}>Fulfilled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {!isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            {filteredRequests.length === 0
              ? "No requests found"
              : `${filteredRequests.length} request${filteredRequests.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {isLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            data-ocid="request.loading_state"
          >
            {Array.from({ length: 6 }).map((_, skeletonIdx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
              <RequestCardSkeleton key={skeletonIdx} />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title="No requests yet"
            description={
              identity
                ? "Post a request for something you're looking for — electronics, books, furniture…"
                : "Sign in to post requests and find items from other students."
            }
            action={
              identity ? (
                <Link to="/post-request">
                  <Button data-ocid="request.primary_button">
                    Post a Request
                  </Button>
                </Link>
              ) : undefined
            }
            data-ocid="request.empty_state"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((req, i) => (
              <RequestCard key={req.id} request={req} index={i} />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="mt-8 rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Requests from users you've discovered appear here. Share your
              profile to expand the network.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
