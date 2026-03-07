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
import { useCreateRequest } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Category } from "../backend";

const CATEGORIES = [
  { value: Category.books, label: "Books" },
  { value: Category.electronics, label: "Electronics" },
  { value: Category.clothing, label: "Clothing" },
  { value: Category.furniture, label: "Furniture" },
  { value: Category.food, label: "Food" },
  { value: Category.stationery, label: "Stationery" },
  { value: Category.miscellaneous, label: "Miscellaneous" },
];

export function PostRequestPage() {
  const { identity } = useInternetIdentity();
  const { isFetching: actorLoading } = useActor();
  const navigate = useNavigate();
  const createRequest = useCreateRequest();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [budget, setBudget] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!identity) {
    return (
      <main className="container mx-auto px-4 py-16 sm:px-6 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-semibold">
          Sign in to Post a Request
        </h2>
        <p className="mt-2 text-muted-foreground">
          You need an account to post requests.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/requests" })}>
          Back to Board
        </Button>
      </main>
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!desc.trim()) errs.desc = "Description is required";
    if (!category) errs.category = "Category is required";
    if (budget && Number.isNaN(Number(budget)))
      errs.budget = "Budget must be a number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const budgetVal = budget ? BigInt(Math.round(Number(budget))) : null;
      await createRequest.mutateAsync({
        title: title.trim(),
        desc: desc.trim(),
        category: category as Category,
        budget: budgetVal,
      });
      toast.success("Request posted!");
      navigate({ to: "/requests" });
    } catch (err: unknown) {
      console.error("Create request error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isAuthError =
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("not connected") ||
        msg.toLowerCase().includes("not registered") ||
        msg.toLowerCase().includes("user is not registered");
      toast.error(
        isAuthError
          ? "Session error -- please sign out and sign in again."
          : "Failed to post request. Please try again.",
      );
    }
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-xl px-4 sm:px-6">
        <Link
          to="/requests"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="post-request.link"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Request Board
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Post a Request
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Let the community know what you're looking for.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium"
              >
                What are you looking for?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Engineering Drawing textbook by N.D. Bhatt"
                className={cn(errors.title && "border-destructive")}
                data-ocid="post-request.input"
              />
              {errors.title && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-request.error_state"
                >
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="desc"
                className="mb-1.5 block text-sm font-medium"
              >
                Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe what you need, preferred condition, any specific requirements…"
                rows={4}
                className={cn(errors.desc && "border-destructive")}
                data-ocid="post-request.textarea"
              />
              {errors.desc && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-request.error_state"
                >
                  {errors.desc}
                </p>
              )}
            </div>

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
                  data-ocid="post-request.select"
                >
                  <SelectValue placeholder="Select a category…" />
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
                  data-ocid="post-request.error_state"
                >
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="budget"
                className="mb-1.5 block text-sm font-medium"
              >
                Budget (₹){" "}
                <span className="text-muted-foreground font-normal text-xs">
                  Optional
                </span>
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 300"
                className={cn(errors.budget && "border-destructive")}
                data-ocid="post-request.input"
              />
              {errors.budget && (
                <p
                  className="mt-1 text-xs text-destructive"
                  data-ocid="post-request.error_state"
                >
                  {errors.budget}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Helps sellers know your price range
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createRequest.isPending || actorLoading}
                className="flex-1 gap-2"
                data-ocid="post-request.submit_button"
              >
                {createRequest.isPending || actorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4" />
                )}
                {actorLoading
                  ? "Connecting…"
                  : createRequest.isPending
                    ? "Posting…"
                    : "Post Request"}
              </Button>
              <Link to="/requests">
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="post-request.cancel_button"
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
