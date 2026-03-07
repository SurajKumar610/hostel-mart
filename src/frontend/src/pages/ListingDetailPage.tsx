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
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useDeleteListing,
  useListing,
  useMarkListingStatus,
  useUserProfile,
} from "@/hooks/useQueries";
import { formatDate, formatPrice } from "@/lib/helpers";
import { listingStore } from "@/lib/listingStore";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
  Package,
  Phone,
  ShoppingCart,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Category, Condition, ListingStatus, ListingType } from "../backend";

const CONDITION_LABELS: Record<Condition, string> = {
  [Condition.new_]: "Brand New",
  [Condition.likeNew]: "Like New",
  [Condition.good]: "Good",
  [Condition.fair]: "Fair",
  [Condition.poor]: "Poor",
};

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.books]: "Books",
  [Category.electronics]: "Electronics",
  [Category.clothing]: "Clothing",
  [Category.furniture]: "Furniture",
  [Category.food]: "Food",
  [Category.stationery]: "Stationery",
  [Category.miscellaneous]: "Miscellaneous",
};

export function ListingDetailPage() {
  const { id } = useParams({ from: "/listing/$id" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: listing, isLoading, error } = useListing(id);
  const { data: sellerProfile, isLoading: sellerLoading } = useUserProfile(
    listing?.seller ?? null,
  );

  const markStatus = useMarkListingStatus();
  const deleteListing = useDeleteListing();

  const isOwner =
    identity &&
    listing &&
    identity.getPrincipal().toString() === listing.seller.toString();

  // Add seller to discovery store
  useEffect(() => {
    if (listing?.seller) {
      listingStore.addSellerId(listing.seller.toString());
    }
    if (id) {
      listingStore.addListingId(id);
    }
  }, [listing, id]);

  async function handleMarkStatus(status: ListingStatus) {
    if (!id) return;
    try {
      await markStatus.mutateAsync({ listingId: id, status });
      toast.success(`Listing marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteListing.mutateAsync(id);
      toast.success("Listing deleted");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Failed to delete listing");
    }
  }

  if (isLoading) {
    return (
      <main
        className="container mx-auto px-4 py-8 sm:px-6"
        data-ocid="listing.loading_state"
      >
        <Skeleton className="mb-6 h-5 w-24" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main
        className="container mx-auto px-4 py-12 sm:px-6 text-center"
        data-ocid="listing.error_state"
      >
        <Package className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-semibold">
          Listing not found
        </h2>
        <p className="mt-2 text-muted-foreground">
          This listing may have been removed.
        </p>
        <Link to="/">
          <Button className="mt-6">Browse Listings</Button>
        </Link>
      </main>
    );
  }

  const photos = listing.photos;

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="listing.link"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          {/* Photo Carousel */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary border border-border">
              {photos.length > 0 && photos[photoIndex] ? (
                <img
                  src={photos[photoIndex].getDirectURL()}
                  alt={listing.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoIndex(
                        (idx) => (idx - 1 + photos.length) % photos.length,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-sm backdrop-blur hover:bg-background"
                    data-ocid="listing.button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoIndex((idx) => (idx + 1) % photos.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-sm backdrop-blur hover:bg-background"
                    data-ocid="listing.button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, dotIdx) => (
                      <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: index-based dot indicator
                        key={dotIdx}
                        type="button"
                        onClick={() => setPhotoIndex(dotIdx)}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          dotIdx === photoIndex
                            ? "w-5 bg-primary"
                            : "w-1.5 bg-primary/30",
                        )}
                        data-ocid="listing.toggle"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, thumbIdx) => (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: thumbnail position
                    key={thumbIdx}
                    type="button"
                    onClick={() => setPhotoIndex(thumbIdx)}
                    className={cn(
                      "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                      thumbIdx === photoIndex
                        ? "border-primary"
                        : "border-transparent opacity-60",
                    )}
                    data-ocid="listing.button"
                  >
                    <img
                      src={photo.getDirectURL()}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Status + Type */}
            <div className="flex flex-wrap items-center gap-2">
              {listing.listingType === ListingType.sale ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                  <Tag className="h-3.5 w-3.5" />
                  For Sale
                </span>
              ) : listing.listingType === ListingType.trade ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cobalt/10 px-3 py-1 text-sm font-semibold text-cobalt">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Trade
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1 text-sm font-semibold text-emerald">
                  <Gift className="h-3.5 w-3.5" />
                  Free
                </span>
              )}
              <Badge
                variant={
                  listing.status === ListingStatus.active
                    ? "default"
                    : "secondary"
                }
                className="capitalize"
              >
                {listing.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {CATEGORY_LABELS[listing.category]}
              </Badge>
            </div>

            {/* Title + Price */}
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {listing.title}
              </h1>
              {listing.listingType === ListingType.sale &&
                listing.price !== undefined && (
                  <p className="mt-2 font-display text-2xl font-bold text-primary">
                    {formatPrice(listing.price)}
                  </p>
                )}
            </div>

            {/* Description */}
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {listing.desc}
              </p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4 shrink-0" />
                <span>
                  Condition:{" "}
                  <span className="font-medium text-foreground">
                    {CONDITION_LABELS[listing.condition]}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>
                  Posted:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(listing.createdAt)}
                  </span>
                </span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Seller
              </h3>
              {sellerLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {sellerProfile?.displayName ?? "Anonymous"}
                      </span>
                    </div>
                    {sellerProfile?.hostel && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {sellerProfile.hostel}
                      </div>
                    )}
                    {/* Contact info — only for logged-in non-owners */}
                    {identity && !isOwner && sellerProfile?.contact && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {sellerProfile.contact}
                        </span>
                      </div>
                    )}
                    {identity && !isOwner && !sellerProfile?.contact && (
                      <p className="text-xs text-muted-foreground italic">
                        No contact info provided
                      </p>
                    )}
                    {!identity && (
                      <p className="text-xs text-muted-foreground">
                        Sign in to see contact info
                      </p>
                    )}
                  </div>
                  <Link
                    to="/profile/$principal"
                    params={{ principal: listing.seller.toString() }}
                    className="text-xs text-primary underline underline-offset-4 hover:opacity-80"
                    data-ocid="listing.link"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Manage Listing
                </h3>
                <div className="flex flex-wrap gap-2">
                  {listing.status === ListingStatus.active && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStatus(ListingStatus.sold)}
                        disabled={markStatus.isPending}
                        className="gap-1.5"
                        data-ocid="listing.secondary_button"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Mark Sold
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkStatus(ListingStatus.traded)}
                        disabled={markStatus.isPending}
                        className="gap-1.5"
                        data-ocid="listing.secondary_button"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Mark Traded
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleMarkStatus(ListingStatus.fulfilled)
                        }
                        disabled={markStatus.isPending}
                        className="gap-1.5"
                        data-ocid="listing.secondary_button"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark Fulfilled
                      </Button>
                    </>
                  )}
                  {listing.status !== ListingStatus.active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkStatus(ListingStatus.active)}
                      disabled={markStatus.isPending}
                      className="gap-1.5"
                      data-ocid="listing.secondary_button"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Reactivate
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5 ml-auto"
                        data-ocid="listing.delete_button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-ocid="listing.dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this listing?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The listing will be
                          permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="listing.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteListing.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-ocid="listing.confirm_button"
                        >
                          {deleteListing.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
