/**
 * Currency formatting utilities for energy pricing
 * All database values are stored in dollars (e.g., 0.86 = $0.86)
 */

/**
 * Format a dollar value for display
 * @param dollars - Value in dollars (e.g., 0.86)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "$0.86")
 */
export function formatDollars(dollars: number | null, decimals: number = 2): string {
  if (dollars === null || dollars === undefined) return 'N/A'
  return `$${dollars.toFixed(decimals)}`
}

/**
 * Format a dollar value as cents for display
 * @param dollars - Value in dollars (e.g., 0.86)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "86.00c")
 */
export function formatCents(dollars: number | null, decimals: number = 2): string {
  if (dollars === null || dollars === undefined) return 'N/A'
  const cents = dollars * 100
  return `${cents.toFixed(decimals)}c`
}

/**
 * Format a rate per kWh for display
 * @param dollarsPerKwh - Value in $/kWh (e.g., 0.32)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "$0.32/kWh")
 */
export function formatRate(dollarsPerKwh: number | null, decimals: number = 2): string {
  if (dollarsPerKwh === null || dollarsPerKwh === undefined) return 'N/A'
  return `$${dollarsPerKwh.toFixed(decimals)}/kWh`
}

/**
 * Format a rate per kWh as cents for display
 * @param dollarsPerKwh - Value in $/kWh (e.g., 0.32)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "32.00c/kWh")
 */
export function formatRateCents(dollarsPerKwh: number | null, decimals: number = 2): string {
  if (dollarsPerKwh === null || dollarsPerKwh === undefined) return 'N/A'
  const cents = dollarsPerKwh * 100
  return `${cents.toFixed(decimals)}c/kWh`
}

/**
 * Format daily supply charge for display
 * @param dollarsPerDay - Value in $/day (e.g., 0.86)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "$0.86/day")
 */
export function formatDailyCharge(dollarsPerDay: number | null, decimals: number = 2): string {
  if (dollarsPerDay === null || dollarsPerDay === undefined) return 'N/A'
  return `$${dollarsPerDay.toFixed(decimals)}/day`
}

/**
 * Format daily supply charge as cents for display
 * @param dollarsPerDay - Value in $/day (e.g., 0.86)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "86.00c/day")
 */
export function formatDailyChargeCents(dollarsPerDay: number | null, decimals: number = 2): string {
  if (dollarsPerDay === null || dollarsPerDay === undefined) return 'N/A'
  const cents = dollarsPerDay * 100
  return `${cents.toFixed(decimals)}c/day`
}

/**
 * Add GST to a dollar value
 * @param dollars - Value in dollars (e.g., 0.86)
 * @returns Value with GST added (e.g., 0.946)
 */
export function addGST(dollars: number): number {
  return dollars * 1.1
}

/**
 * Remove GST from a dollar value
 * @param dollarsIncGST - Value in dollars including GST (e.g., 0.946)
 * @returns Value excluding GST (e.g., 0.86)
 */
export function removeGST(dollarsIncGST: number): number {
  return dollarsIncGST / 1.1
}
