import { ShoppingBag } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="mt-auto border-t border-border/60 bg-background py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-bold text-foreground">
            Hostel<span className="text-primary">Mart</span>
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {year}. Built with ❤️ using{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          A peer-to-peer campus marketplace
        </p>
      </div>
    </footer>
  );
}
