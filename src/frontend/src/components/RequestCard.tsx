import { formatDate, formatPrice } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Banknote, CheckCircle2, Circle, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Category, RequestStatus, type WantedRequest } from "../backend";

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

interface RequestCardProps {
  request: WantedRequest;
  requesterName?: string;
  index?: number;
}

export function RequestCard({
  request,
  requesterName,
  index = 0,
}: RequestCardProps) {
  const isFulfilled = request.status === RequestStatus.fulfilled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className={cn(
          "listing-card rounded-xl border border-border bg-card p-4 shadow-card",
          isFulfilled && "opacity-60",
        )}
        data-ocid={`request.item.${index + 1}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isFulfilled ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-primary" />
              )}
              <h3 className="font-display text-sm font-semibold text-card-foreground truncate">
                {request.title}
              </h3>
            </div>
            <p className="ml-6 text-xs text-muted-foreground line-clamp-2 mb-3">
              {request.desc}
            </p>
            <div className="ml-6 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  CATEGORY_COLORS[request.category],
                )}
              >
                {CATEGORY_LABELS[request.category]}
              </span>
              {request.budget !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Banknote className="h-3 w-3" />
                  Budget: {formatPrice(request.budget)}
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  isFulfilled
                    ? "bg-muted text-muted-foreground"
                    : "bg-emerald/10 text-emerald",
                )}
              >
                {isFulfilled ? "Fulfilled" : "Open"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
          {requesterName ? (
            <Link
              to="/profile/$principal"
              params={{ principal: request.requester.toString() }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="request.link"
            >
              Requested by{" "}
              <span className="font-medium text-foreground">
                {requesterName}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Principal: {request.requester.toString().slice(0, 12)}…
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(request.createdAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
