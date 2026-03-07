import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCallerProfile, useSaveProfile } from "@/hooks/useQueries";
import { formatDate, getInitials } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Phone,
  Save,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function MyProfilePage() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useCallerProfile();
  const saveProfile = useSaveProfile();

  const [displayName, setDisplayName] = useState("");
  const [hostel, setHostel] = useState("");
  const [contact, setContact] = useState("");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setHostel(profile.hostel || "");
      setContact(profile.contact || "");
    }
  }, [profile]);

  if (!identity) {
    return (
      <main className="container mx-auto px-4 py-16 sm:px-6 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-xl font-semibold">
          Sign in to view your Profile
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your profile information will appear here.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </main>
    );
  }

  const principalStr = identity.getPrincipal().toString();
  const profileUrl = `${window.location.origin}/profile/${principalStr}`;

  function validate() {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = "Display name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const now = BigInt(Date.now()) * BigInt(1_000_000); // ms to ns
      await saveProfile.mutateAsync({
        id: identity!.getPrincipal(),
        displayName: displayName.trim(),
        hostel: hostel.trim(),
        contact: contact.trim(),
        createdAt: profile?.createdAt ?? now,
      });
      toast.success("Profile saved!");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error("Failed to save profile");
    }
  }

  async function copyProfileLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }

  const initials = getInitials(displayName || "U");
  const isNewUser = !isLoading && !profile;

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-xl px-4 sm:px-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="my-profile.link"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* New user banner */}
          {isNewUser && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <h3 className="font-display text-sm font-semibold text-primary">
                👋 Welcome to Hostel Mart!
              </h3>
              <p className="mt-1 text-sm text-foreground/80">
                Set up your profile so other students can contact you about your
                listings.
              </p>
            </div>
          )}

          {/* Avatar + Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl font-display">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold">
                {profile?.displayName || "Your Profile"}
              </h1>
              {profile?.createdAt && (
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(profile.createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* Profile Link */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your Public Profile
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-secondary px-2 py-1.5 text-xs font-mono text-foreground">
                {profileUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyProfileLink}
                className="shrink-0 gap-1.5"
                data-ocid="my-profile.secondary_button"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy
              </Button>
              <Link
                to="/profile/$principal"
                params={{ principal: principalStr }}
                target="_blank"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  data-ocid="my-profile.link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Share this link so others can find your listings
            </p>
          </div>

          {/* Form */}
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label
                  htmlFor="displayName"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className={cn(
                      "pl-9",
                      errors.displayName && "border-destructive",
                    )}
                    data-ocid="my-profile.input"
                  />
                </div>
                {errors.displayName && (
                  <p
                    className="mt-1 text-xs text-destructive"
                    data-ocid="my-profile.error_state"
                  >
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="hostel"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Hostel / Block
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="hostel"
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g., Block C, Room 204"
                    className="pl-9"
                    data-ocid="my-profile.input"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Helps buyers know where to meet you
                </p>
              </div>

              <div>
                <Label
                  htmlFor="contact"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Contact Info
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Phone, WhatsApp, or email"
                    className="pl-9"
                    data-ocid="my-profile.input"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shown to logged-in users who view your listings
                </p>
              </div>

              <Button
                type="submit"
                disabled={saveProfile.isPending}
                className="w-full gap-2"
                data-ocid="my-profile.submit_button"
              >
                {saveProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveProfile.isPending
                  ? "Saving…"
                  : saved
                    ? "Saved!"
                    : "Save Profile"}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
