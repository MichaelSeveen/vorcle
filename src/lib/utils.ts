import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "";
  }

  const trimmedName = name.trim();

  if (/^\+\d+$/.test(trimmedName)) {
    return trimmedName;
  }

  if (/^[A-Z]{2,}$/.test(trimmedName)) {
    return trimmedName;
  }

  const parts = trimmedName.split(/\s+/);

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  const initials = parts.map((part) => part[0].toUpperCase()).join("");

  return initials;
}

export function formatAmount(
  amount: number | null,
  currency: string | null
): string {
  if (amount == null || !Number.isFinite(amount) || !currency) {
    return "N/A";
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "narrowSymbol",
    }).format(amount / 100);
  } catch {
    return `${normalizedCurrency} ${(amount / 100).toFixed(2)}`;
  }
}
