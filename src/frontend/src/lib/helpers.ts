export function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatPrice(price: bigint | undefined | null): string {
  if (price === undefined || price === null) return "";
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

export function getPrincipalStr(
  principal: { toString(): string } | undefined | null,
): string {
  if (!principal) return "";
  return principal.toString();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
