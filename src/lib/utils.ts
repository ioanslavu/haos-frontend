import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name (first letter of first name + first letter of last name)
 * Examples:
 *   "Alexandru Voicu" -> "AV"
 *   "John" -> "JO"
 *   "John Doe Smith" -> "JS"
 *   "" or null -> "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '?'

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    // Single name: take first two characters
    return parts[0].substring(0, 2).toUpperCase()
  }

  // Multiple names: first letter of first name + first letter of last name
  const firstInitial = parts[0].charAt(0)
  const lastInitial = parts[parts.length - 1].charAt(0)
  return (firstInitial + lastInitial).toUpperCase()
}

/**
 * Format a date string or Date object to a localized date string
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format money value with currency symbol
 * Alias for formatCurrency for backwards compatibility
 */
export function formatMoney(amount: number | string, currency: string = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return formatCurrency(numAmount, currency)
}

/**
 * Format a date string or Date object to a localized date and time string
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
