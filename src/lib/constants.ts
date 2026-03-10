/**
 * Shared constants. Categories and fruit types are now in the database;
 * these are only for entry type and payment method.
 */

export const ENTRY_TYPES = [
  { value: "ingreso", label: "Ingreso" },
  { value: "gasto", label: "Gasto" },
] as const;

export const CURRENCIES = [
  { value: "UYU", label: "UYU" },
  { value: "USD", label: "USD" },
] as const;

export const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number]["value"];
export type Currency = (typeof CURRENCIES)[number]["value"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const ROLES = {
  ADMIN: "ADMIN",
  USUARIO: "USUARIO",
} as const;
