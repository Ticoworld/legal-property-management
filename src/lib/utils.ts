import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNaira(amount: number | string | bigint): string {
  const value = typeof amount === 'string' ? Number(amount) : Number(amount)
  if (!Number.isFinite(value)) return "₦0.00"
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace('NGN', '₦')
    .replace('Naira', '₦')
}
