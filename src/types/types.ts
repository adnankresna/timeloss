// Extended participant interface with salary range support
export interface Participant {
  id: string;
  name: string;
  hourlyRate: string;
  salaryRange: string;
  salaryType: "hourly" | "monthly" | "annual";
}

// Currency information interface
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// Common currencies list
export const COMMON_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
]; 