import { EmptyState } from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useDeleteListing,
  useDeleteRequest,
  useListingsBySeller,
  useMarkListingStatus,
  useMarkRequestFulfilled,
  useRequestsByRequester,
} from "@/hooks/useQueries";
import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Check,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ListingStatus, ListingType, RequestStatus } from "../backend";

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { label: string; cls: string }> = {
    [ListingStatus.active]: {
      label: "Active",
      cls: "bg-emerald/10 text-emerald",
    },
    [ListingStatus.sold]: { label: "Sold", cls: "bg-rose/10 text-rose" },
    [ListingStatus.traded]: {
      label: "Traded",
      cls: "bg-cobalt/10 text-cobalt",
    },
    [ListingStatus.fulfilled]: {
      label: "Fulfilled",
      cls: "bg-muted text-muted-foreground",
    },
  };
  const s = map[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

export function DashboardPage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  const callerPrincipal = identity?.getPrincipal() ?? null;
  const { data: listings, isLoading: listingsLoading } =
    useListingsBySeller(callerPrincipal);
  const { data: requests, isLoading: requestsLoading } =
    useRequestsByRequester(callerPrincipal);
  const markStatus = useMarkListingStatus();
  const deleteListing = useDeleteListing();
  const markFulfilled = useMarkRequestFulfilled();
  const deleteRequest = useDeleteRequest();

  if (!identity) {
    return (
      <main className="container mx-auto px-4 py-16 sm:px-6 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-semibold">
          Sign in to view your Dashboard
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your listings and requests will appear here.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </main>
    );
  }

  async function handleMarkStatus(listingId: string, status: ListingStatus) {
    try {
      await markStatus.mutateAsync({ listingId, status });
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDeleteListing(listingId: string) {
    try {
      await deleteListing.mutateAsync(listingId);
      toast.success("Listing deleted");
    } catch {
      toast.error("Failed to delete listing");
    }
  }

  async function handleMarkRequestFulfilled(requestId: string) {
    try {
      await markFulfilled.mutateAsync(requestId);
      toast.success("Request marked as fulfilled");
    } catch {
      toast.error("Failed to update request");
    }
  }

  async function handleDeleteRequest(requestId: string) {
    try {
      await deleteRequest.mutateAsync(requestId);
      toast.success("Request deleted");
    } catch {
      toast.error("Failed to delete request");
    }
  }

  const sortedListings = [...(listings ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );
  const sortedRequests = [...(requests ?? [])].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );
  const openRequestsCount = sortedRequests.filter(
    (r) => r.status === RequestStatus.open,
  ).length;
  const fulfilledRequestsCount = sortedRequests.filter(
    (r) => r.status !== RequestStatus.open,
  ).length;

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            My Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your listings and requests
          </p>
        </motion.div>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6" data-ocid="dashboard.tab">
            <TabsTrigger
              value="listings"
              className="gap-2"
              data-ocid="dashboard.tab"
            >
              <ShoppingBag className="h-4 w-4" />
              My Listings
              {sortedListings.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 rounded-full px-1 text-xs"
                >
                  {sortedListings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="gap-2"
              data-ocid="dashboard.tab"
            >
              <ClipboardList className="h-4 w-4" />
              My Requests
              {openRequestsCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 rounded-full px-1 text-xs"
                >
                  {openRequestsCount} open
                </Badge>
              )}
              {fulfilledRequestsCount > 0 && (
                <Badge
                  variant="outline"
                  className="ml-0.5 h-5 min-w-5 rounded-full px-1 text-xs text-muted-foreground"
                >
                  {fulfilledRequestsCount} done
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {sortedListings.length} listing
                {sortedListings.length !== 1 ? "s" : ""}
              </p>
              <Link to="/post-listing">
                <Button
                  size="sm"
                  className="gap-1.5"
                  data-ocid="dashboard.primary_button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Listing
                </Button>
              </Link>
            </div>

            {listingsLoading ? (
              <div className="space-y-3" data-ocid="dashboard.loading_state">
                {Array.from({ length: 4 }).map((_, sIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                  <Skeleton key={sIdx} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : sortedListings.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="h-6 w-6" />}
                title="No listings yet"
                description="Post your first listing to start selling or trading."
                action={
                  <Link to="/post-listing">
                    <Button data-ocid="dashboard.primary_button">
                      Post a Listing
                    </Button>
                  </Link>
                }
                data-ocid="dashboard.empty_state"
              />
            ) : (
              <div className="space-y-3">
                {sortedListings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs"
                    data-ocid={`dashboard.item.${i + 1}`}
                  >
                    {/* Thumbnail */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {listing.photos[0] ? (
                        <img
                          src={listing.photos[0].getDirectURL()}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/listing/$id"
                          params={{ id: listing.id }}
                          className="font-semibold text-sm text-foreground hover:text-primary truncate transition-colors"
                          data-ocid="dashboard.link"
                        >
                          {listing.title}
                        </Link>
                        <StatusBadge status={listing.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {listing.listingType}
                        </span>
                        {listing.listingType === ListingType.sale &&
                          listing.price !== undefined && (
                            <span className="font-semibold text-primary">
                              {formatPrice(listing.price)}
                            </span>
                          )}
                        <span>•</span>
                        <span>{formatDate(listing.createdAt)}</span>
                      </div>
                      {/* Actions */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {listing.status === ListingStatus.active && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                handleMarkStatus(listing.id, ListingStatus.sold)
                              }
                              disabled={markStatus.isPending}
                              data-ocid={`dashboard.secondary_button.${i + 1}`}
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Sold
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                handleMarkStatus(
                                  listing.id,
                                  ListingStatus.traded,
                                )
                              }
                              disabled={markStatus.isPending}
                              data-ocid={`dashboard.secondary_button.${i + 1}`}
                            >
                              <ArrowLeftRight className="mr-1 h-3 w-3" />
                              Traded
                            </Button>
                          </>
                        )}
                        {listing.status !== ListingStatus.active && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              handleMarkStatus(listing.id, ListingStatus.active)
                            }
                            disabled={markStatus.isPending}
                            data-ocid={`dashboard.secondary_button.${i + 1}`}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Reactivate
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              data-ocid={`dashboard.delete_button.${i + 1}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-ocid="dashboard.dialog">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete listing?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                "{listing.title}" will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="dashboard.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteListing(listing.id)}
                                className="bg-destructive text-destructive-foreground"
                                data-ocid="dashboard.confirm_button"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {sortedRequests.length} request
                {sortedRequests.length !== 1 ? "s" : ""}
                {fulfilledRequestsCount > 0 && (
                  <span className="ml-1.5">
                    · {openRequestsCount} open, {fulfilledRequestsCount}{" "}
                    fulfilled
                  </span>
                )}
              </p>
              <Link to="/post-request">
                <Button
                  size="sm"
                  className="gap-1.5"
                  data-ocid="dashboard.primary_button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Request
                </Button>
              </Link>
            </div>

            {requestsLoading ? (
              <div className="space-y-3" data-ocid="dashboard.loading_state">
                {Array.from({ length: 3 }).map((_, sIdx) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                  <Skeleton key={sIdx} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : sortedRequests.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-6 w-6" />}
                title="No requests yet"
                description="Post a request to let others know what you're looking for."
                action={
                  <Link to="/post-request">
                    <Button data-ocid="dashboard.primary_button">
                      Post a Request
                    </Button>
                  </Link>
                }
                data-ocid="dashboard.empty_state"
              />
            ) : (
              <div className="space-y-3">
                {sortedRequests.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4 shadow-xs"
                    data-ocid={`dashboard.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground">
                        {req.title}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          req.status === RequestStatus.open
                            ? "bg-emerald/10 text-emerald"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {req.status === RequestStatus.open
                          ? "Open"
                          : "Fulfilled"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {req.desc}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDate(req.createdAt)}
                      {req.budget !== undefined && (
                        <span className="ml-2 font-medium text-primary">
                          Budget: {formatPrice(req.budget)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {req.status === RequestStatus.open && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleMarkRequestFulfilled(req.id)}
                          disabled={markFulfilled.isPending}
                          data-ocid={`dashboard.secondary_button.${i + 1}`}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark Fulfilled
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                            data-ocid={`dashboard.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-ocid="dashboard.dialog">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{req.title}" will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-ocid="dashboard.cancel_button">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRequest(req.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-ocid="dashboard.confirm_button"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
