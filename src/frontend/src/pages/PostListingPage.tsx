import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCreateListing } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  ShoppingBag,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Category, Condition, ExternalBlob, ListingType } from "../backend";

const CATEGORIES = [
  { value: Category.books, label: "Books" },
  { value: Category.electronics, label: "Electronics" },
  { value: Category.clothing, label: "Clothing" },
  { value: Category.furniture, label: "Furniture" },
  { value: Category.food, label: "Food" },
  { value: Category.stationery, label: "Stationery" },
  { value: Category.miscellaneous, label: "Miscellaneous" },
];

const CONDITIONS = [
  { value: Condition.new_, label: "Brand New" },
  { value: Condition.likeNew, label: "Like New" },
  { value: Condition.good, label: "Good" },
  { value: Condition.fair, label: "Fair" },
  { value: Condition.poor, label: "Poor" },
];

const LISTING_TYPES = [
  { value: ListingType.sale, label: "For Sale" },
  { value: ListingType.trade, label: "Trade / Exchange" },
  { value: ListingType.free, label: "Free / Give Away" },
];

interface PhotoPreview {
  url: string;
  bytes: Uint8Array<ArrayBuffer>;
}

export function PostListingPage() {
  const { identity } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [price, setPrice] = useState("");
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!identity) {
    return (
      <main className="container mx-auto px-4 py-16 sm:px-6 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-semibold">
          Sign in to Post a Listing
        </h2>
        <p className="mt-2 text-muted-foreground">
          You need an account to sell items.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </main>
    );
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    if (photos.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    setUploading(true);
    const newPhotos: PhotoPreview[] = [];
    for (const file of Array.from(files)) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const url = URL.createObjectURL(file);
      newPhotos.push({ url, bytes });
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!desc.trim()) errs.desc = "Description is required";
    if (!category) errs.category = "Category is required";
    if (!listingType) errs.listingType = "Listing type is required";
    if (!condition) errs.condition = "Condition is required";
    if (listingType === ListingType.sale && !price.trim()) {
      errs.price = "Price is required for sale listings";
    }
    if (
      listingType === ListingType.sale &&
      price &&
      Number.isNaN(Number(price))
    ) {
      errs.price = "Price must be a number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const photoBlobs = photos.map((p) => ExternalBlob.fromBytes(p.bytes));
      const priceVal =
        listingType === ListingType.sale && price
          ? BigInt(Math.round(Number(price)))
          : null;

      const id = await createListing.mutateAsync({
        title: title.trim(),
        desc: desc.trim(),
        price: priceVal,
        category: category as Category,
        listingType: listingType as ListingType,
        condition: condition as Condition,
        photos: photoBlobs,
      });

      toast.success(
        "Listing posted! Any matching requests have been automatically fulfilled.",
      );
      navigate({ to: "/listing/$id", params: { id } });
    } catch (err: unknown) {
      console.error("Create listing error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isAuthError =
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("not connected") ||
        msg.toLowerCase().includes("not registered") ||
        msg.toLowerCase().includes("user is not registered");
      toast.error(
        isAuthError
          ? "Session error -- please sign out and sign in again."
          : "Failed to post listing. Please try again.",
      );
    }
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="post-listing.link"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Post a Listing
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Share something you want to sell, trade, or give away.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Photos */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Photos{" "}
                <span className="text-muted-foreground font-normal">
                  (up to 5)
                </span>
              </Label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {photos.map((photo, photoIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: photo position index
                    key={photoIdx}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photoIdx)}
                      className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 hover:bg-background"
                      data-ocid="post-listing.delete_button"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 text-muted-foreground hover:border-primary/50 hover:bg-secondary/60 transition-colors"
                    data-ocid="post-listing.upload_button"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mb-1" />
                        <span className="text-xs">Add</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                data-ocid="post-listing.dropzone"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                JPEG, PNG, WebP up to 5MB each
              </p>
            </div>

            {/* Title */}
            <div>
              <Label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium"
              >
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., MTech Engineering Maths textbook"
                className={cn(errors.title && "border-destructive")}
                data-ocid="post-listing.input"
              />
              {errors.title && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-listing.error_state"
                >
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label
                htmlFor="desc"
                className="mb-1.5 block text-sm font-medium"
              >
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the item, its condition, any defects, etc."
                rows={4}
                className={cn(errors.desc && "border-destructive")}
                data-ocid="post-listing.textarea"
              />
              {errors.desc && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-listing.error_state"
                >
                  {errors.desc}
                </p>
              )}
            </div>

            {/* Category + Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
                  <SelectTrigger
                    className={cn(errors.category && "border-destructive")}
                    data-ocid="post-listing.select"
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p
                    className="mt-1 text-xs text-destructive"
                    data-ocid="post-listing.error_state"
                  >
                    {errors.category}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Condition <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={condition}
                  onValueChange={(v) => setCondition(v as Condition)}
                >
                  <SelectTrigger
                    className={cn(errors.condition && "border-destructive")}
                    data-ocid="post-listing.select"
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p
                    className="mt-1 text-xs text-destructive"
                    data-ocid="post-listing.error_state"
                  >
                    {errors.condition}
                  </p>
                )}
              </div>
            </div>

            {/* Listing Type */}
            <div>
              <Label className="mb-1.5 block text-sm font-medium">
                Listing Type <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {LISTING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setListingType(t.value)}
                    className={cn(
                      "rounded-lg border py-2.5 px-3 text-sm font-medium transition-colors text-left",
                      listingType === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                    data-ocid="post-listing.toggle"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {errors.listingType && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-listing.error_state"
                >
                  {errors.listingType}
                </p>
              )}
            </div>

            {/* Price — only if sale */}
            {listingType === ListingType.sale && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Label
                  htmlFor="price"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g., 500"
                  className={cn(errors.price && "border-destructive")}
                  data-ocid="post-listing.input"
                />
                {errors.price && (
                  <p
                    className="mt-1 text-xs text-destructive"
                    data-ocid="post-listing.error_state"
                  >
                    {errors.price}
                  </p>
                )}
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createListing.isPending || actorLoading}
                className="flex-1 gap-2"
                data-ocid="post-listing.submit_button"
              >
                {createListing.isPending || actorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                {actorLoading
                  ? "Connecting…"
                  : createListing.isPending
                    ? "Posting…"
                    : "Post Listing"}
              </Button>
              <Link to="/">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="post-listing.cancel_button"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
