// SHARED TYPES

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Wallet {
  id: string;
  name: string;
  plan: 'Personal' | 'Shared';
  collaborators?: Collaborator[];
}

// SHARED CONSTANTS

export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
};

export const CHART_COLORS = [
  '#2d7d99',
  '#6bb6d6',
  '#87ceeb',
  '#4a5568',
  '#a0aec0',
  '#2c5282',
  '#2b6cb0',
  '#285e61'
];

export const DEFAULT_TEXT_COLOR = '#ffffff';

// SHARED UTILITY FUNCTIONS

export const formatAmount = (value: string): string => {
  if (!value) return '0.00';
  const parts = value.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts[1] ? `.${parts[1]}` : '';
  return integerPart + decimalPart;
};

export const validateAndFormatAmount = (value: string): string => {
  let v = value.replace(/[^0-9.]/g, '');
  const parts = v.split('.');
  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
  if (parts[1] && parts[1].length > 2) v = parts[0] + '.' + parts[1].substring(0, 2);
  return v;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const triggerSelectDropdown = (selectElement: HTMLSelectElement): void => {
  selectElement.style.pointerEvents = 'auto';
  selectElement.style.opacity = '1';
  selectElement.style.zIndex = '1000';
  
  if ('showPicker' in HTMLSelectElement.prototype) {
    (selectElement as any).showPicker();
  } else {
    (selectElement as HTMLSelectElement).focus();
    const clickEvent = new MouseEvent('mousedown', { bubbles: true });
    (selectElement as HTMLSelectElement).dispatchEvent(clickEvent);
  }
  
  const hideSelect = () => {
    selectElement.style.pointerEvents = 'none';
    selectElement.style.opacity = '0';
    selectElement.style.zIndex = '10';
  };
  
  selectElement.addEventListener('blur', hideSelect, { once: true });
  selectElement.addEventListener('change', hideSelect, { once: true });
};

export const calculateDateRange = (period: string, baseDate: Date = new Date()): { startDate: Date; endDate: Date } => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();
  
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'Daily':
      startDate = new Date(year, month, day);
      endDate = new Date(year, month, day);
      break;
    case 'Weekly':
      startDate = new Date(year, month, day);
      endDate = new Date(year, month, day + 6);
      break;
    case 'Monthly':
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month, getDaysInMonth(year, month));
      break;
    case 'Yearly':
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      break;
    default:
      startDate = baseDate;
      endDate = baseDate;
  }

  return { startDate, endDate };
};
