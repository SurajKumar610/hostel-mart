import { EmptyState } from "@/components/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { RequestCard } from "@/components/RequestCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@/hooks/useActor";
import { formatDate, getInitials } from "@/lib/helpers";
import { listingStore } from "@/lib/listingStore";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Copy,
  ShoppingBag,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ListingStatus, RequestStatus } from "../backend";

export function PublicProfilePage() {
  const { principal } = useParams({ from: "/profile/$principal" });
  const { actor, isFetching: actorFetching } = useActor();
  const [copied, setCopied] = useState(false);

  // Store this seller for discovery
  useEffect(() => {
    if (principal) {
      listingStore.addSellerId(principal);
    }
  }, [principal]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(principal);
      return actor.getUserProfile(p);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", "seller", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(principal);
      return actor.getListingsBySeller(p);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["requests", "requester", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(principal);
      return actor.getRequestsByRequester(p);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });

  const activeListings = (listings ?? [])
    .filter((l) => l.status === ListingStatus.active)
    .sort((a, b) => Number(b.createdAt - a.createdAt));

  const openRequests = (requests ?? [])
    .filter((r) => r.status === RequestStatus.open)
    .sort((a, b) => Number(b.createdAt - a.createdAt));

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }

  const displayName = profile?.displayName ?? "Anonymous User";
  const initials = getInitials(displayName);

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="profile.link"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          {profileLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl font-display">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">
                    {displayName}
                  </h1>
                  {profile?.hostel && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {profile.hostel}
                    </div>
                  )}
                  {profile?.createdAt && (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Member since {formatDate(profile.createdAt)}
                    </div>
                  )}
                  {!profile && (
                    <p className="text-sm text-muted-foreground">
                      No profile information available
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyProfileLink}
                className="gap-1.5 self-start sm:self-auto"
                data-ocid="profile.secondary_button"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Share Profile"}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Listings */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">
              Active Listings
            </h2>
            {activeListings.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {activeListings.length}
              </span>
            )}
          </div>

          {listingsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, sIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                <Skeleton key={sIdx} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : activeListings.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="h-5 w-5" />}
              title="No active listings"
              description="This user hasn't posted any active listings yet."
              className="py-8"
              data-ocid="profile.empty_state"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeListings.map((listing, i) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  sellerName={displayName}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>

        {/* Open Requests */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">
              Open Requests
            </h2>
            {openRequests.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {openRequests.length}
              </span>
            )}
          </div>

          {requestsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 2 }).map((_, sIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                <Skeleton key={sIdx} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : openRequests.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-5 w-5" />}
              title="No open requests"
              description="This user doesn't have any open requests."
              className="py-8"
              data-ocid="profile.empty_state"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openRequests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  requesterName={displayName}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
