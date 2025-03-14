import { CurrencyInfo } from "@/types/types";

// Multipliers for salary ranges based on currency
// These are approximate and based on exchange rates and local wage standards
export const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1, // Base currency
  EUR: 0.9, // 1 USD ≈ 0.9 EUR
  GBP: 0.8, // 1 USD ≈ 0.8 GBP
  JPY: 100, // 1 USD ≈ 100 JPY
  CAD: 1.3, // 1 USD ≈ 1.3 CAD
  AUD: 1.4, // 1 USD ≈ 1.4 AUD
  CNY: 7, // 1 USD ≈ 7 CNY
  INR: 75, // 1 USD ≈ 75 INR
  SGD: 1.3, // 1 USD ≈ 1.3 SGD
  MYR: 4.5, // 1 USD ≈ 4.5 MYR
  IDR: 15000, // 1 USD ≈ 15,000 IDR
  BRL: 5, // 1 USD ≈ 5 BRL
};

// Base salary ranges in USD
const BASE_SALARY_RANGES = [
  { label: "$0-$25/hr", min: 0, max: 25, value: "0-25" },
  { label: "$26-$50/hr", min: 26, max: 50, value: "26-50" },
  { label: "$51-$75/hr", min: 51, max: 75, value: "51-75" },
  { label: "$76-$100/hr", min: 76, max: 100, value: "76-100" },
  { label: "$101-$150/hr", min: 101, max: 150, value: "101-150" },
  { label: "$151-$200/hr", min: 151, max: 200, value: "151-200" },
  { label: "$201-$300/hr", min: 201, max: 300, value: "201-300" },
  { label: "$301-$500/hr", min: 301, max: 500, value: "301-500" },
  { label: "$500+/hr", min: 500, max: 750, value: "500+" },
];

// Helper to format numbers according to currency conventions
function formatNumber(num: number, currencyCode: string): string {
  // For currencies with large values, we might want to simplify display
  if (currencyCode === 'JPY' || currencyCode === 'IDR') {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
  }
  
  // For most currencies, use standard formatting
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
    useGrouping: true
  }).format(num);
}

// Generate salary ranges for a specific currency
export function generateSalaryRanges(currency: CurrencyInfo) {
  const multiplier = CURRENCY_MULTIPLIERS[currency.code] || 1;
  
  return BASE_SALARY_RANGES.map(range => {
    const min = Math.round(range.min * multiplier);
    const max = Math.round(range.max * multiplier);
    
    // Format the label with the correct currency symbol
    let label = range.value === "500+" 
      ? `${currency.symbol}${formatNumber(min, currency.code)}+/hr`
      : `${currency.symbol}${formatNumber(min, currency.code)}-${currency.symbol}${formatNumber(max, currency.code)}/hr`;
    
    return {
      ...range,
      min,
      max,
      label
    };
  });
}

// Find the closest equivalent range in the new currency
export function findClosestRange(oldValue: string, oldRanges: any[], newRanges: any[]): string {
  if (!oldValue) return "";
  
  const oldRange = oldRanges.find(r => r.value === oldValue);
  if (!oldRange) return newRanges[0]?.value || "";
  
  // Get the midpoint of the old range
  const oldMidpoint = (oldRange.min + oldRange.max) / 2;
  
  // Find the closest range in the new currency
  let closestRange = newRanges[0];
  let minDifference = Infinity;
  
  newRanges.forEach(range => {
    const midpoint = (range.min + range.max) / 2;
    const difference = Math.abs(midpoint - oldMidpoint);
    
    if (difference < minDifference) {
      minDifference = difference;
      closestRange = range;
    }
  });
  
  return closestRange.value;
} 