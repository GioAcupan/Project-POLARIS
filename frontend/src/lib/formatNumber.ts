type FormatPesoOptions = {
  digits?: number
}

export function formatPesoBillions(
  value: number | null | undefined,
  options?: FormatPesoOptions,
): string {
  const numericValue = Number(value ?? 0)
  const digits = options?.digits ?? 1

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return "\u20B10"
  }

  const abs = Math.abs(numericValue)
  if (abs >= 1e12) return `\u20B1${(numericValue / 1e12).toFixed(digits)}T`
  if (abs >= 1e9) return `\u20B1${(numericValue / 1e9).toFixed(digits)}B`
  if (abs >= 1e6) return `\u20B1${(numericValue / 1e6).toFixed(digits)}M`

  return `\u20B1${numericValue.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`
}

export function formatYears(value: number, digits = 1): string {
  const suffix = Math.abs(value - 1) < 0.05 ? "" : "s"
  return `${value.toFixed(digits)} yr${suffix}`
}
