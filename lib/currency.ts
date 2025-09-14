export function formatUGX(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'UGX 0';
  }
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactUGX(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'UGX 0';
  }
  
  if (amount >= 1000000) {
    return `UGX ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `UGX ${(amount / 1000).toFixed(0)}K`;
  }
  return formatUGX(amount);
}

export function parseUGXAmount(value: string): number {
  const cleanValue = value.replace(/[^\d]/g, '');
  return parseInt(cleanValue) || 0;
}

export function validateUGXAmount(amount: number): boolean {
  return amount > 0 && amount <= 100000000;
}

export function getMobileMoneyProvider(phoneNumber: string): 'mtn' | 'airtel' | 'm-sente' | null {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.startsWith('256')) {
    const localNumber = cleanNumber.substring(3);
    if (localNumber.startsWith('77') || localNumber.startsWith('78')) {
      return 'mtn';
    } else if (localNumber.startsWith('70') || localNumber.startsWith('74') || localNumber.startsWith('75')) {
      return 'airtel';
    }
  }
  
  if (cleanNumber.startsWith('77') || cleanNumber.startsWith('78')) {
    return 'mtn';
  } else if (cleanNumber.startsWith('70') || cleanNumber.startsWith('74') || cleanNumber.startsWith('75')) {
    return 'airtel';
  }
  
  return null;
}

export function formatPhoneNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.startsWith('256')) {
    return `+${cleanNumber.substring(0, 3)} ${cleanNumber.substring(3, 6)} ${cleanNumber.substring(6, 9)} ${cleanNumber.substring(9)}`;
  } else if (cleanNumber.length === 9) {
    return `+256 ${cleanNumber.substring(0, 2)} ${cleanNumber.substring(2, 5)} ${cleanNumber.substring(5)}`;
  }
  
  return phoneNumber;
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.startsWith('256') && cleanNumber.length === 12) {
    return true;
  } else if (cleanNumber.length === 9) {
    return true;
  }
  
  return false;
}

export const MOBILE_MONEY_PROVIDERS = {
  mtn: {
    name: 'MTN Mobile Money',
    color: '#FFCC00',
    textColor: '#000000',
  },
  airtel: {
    name: 'Airtel Money',
    color: '#FF0000',
    textColor: '#FFFFFF',
  },
  'm-sente': {
    name: 'M-Sente',
    color: '#FF6600',
    textColor: '#FFFFFF',
  },
} as const;