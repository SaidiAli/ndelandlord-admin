# Findings: Wallet Module Implementation

## Backend API Summary

### GET /api/wallet
Returns wallet summary:
```typescript
{
  walletId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  recentTransactions: WalletTransaction[];
}
```

### GET /api/wallet/balance
Lightweight balance only endpoint.

### GET /api/wallet/transactions
Paginated history with query params:
- `type`: deposit | withdrawal | adjustment
- `status`: pending | completed | failed
- `limit`: 1-100 (default 50)
- `offset`: default 0

### POST /api/wallet/withdraw
Request body (mobile money):
```typescript
{
  amount: number; // min 10,000 UGX
  destinationType: 'mobile_money' | 'bank_account';
  provider: 'mtn' | 'airtel';
  phoneNumber: string; // 10-12 digits
}
```

## Codebase Patterns Observed

### API Layer Pattern
- Uses axios instance in `/lib/api.ts`
- Auth token added via interceptor
- Functions grouped by resource (propertiesApi, leasesApi, etc.)

### Data Fetching Pattern
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['resource-name', user?.id],
  queryFn: () => resourceApi.getAll(),
  enabled: !!user,
});
```

### Form Pattern
- React Hook Form with Controller for controlled components
- Zod schemas for validation
- toast.success/error for feedback

### Component Structure
- 'use client' directive for interactive components
- Import useAuth for user context
- Card-based layouts with CardHeader, CardContent

### Currency Formatting
```tsx
import { formatUGX, formatCompactUGX } from '@/lib/currency';
formatUGX(1500000) // "UGX 1,500,000"
```

### Mobile Money Providers
- MTN: prefixes 77x, 78x
- Airtel: prefixes 70x, 74x, 75x

## UI Requirements from Docs

### Wallet Dashboard Card
- Current balance (large, highlighted)
- Total deposited (lifetime)
- Total withdrawn (lifetime)
- Pending withdrawals count/amount
- Quick "Withdraw" button

### Transaction Table
- Color coding: green for deposits, red for withdrawals
- Columns: Date, Type, Amount, Status, Description
- Filters: Type dropdown, Status dropdown
- Pagination

### Withdrawal Modal
- Amount input with UGX prefix
- Destination type radio (Mobile Money / Bank Account)
- Provider dropdown (MTN, Airtel) - conditional
- Phone number with validation - conditional
- Bank fields (future)
- Validation messages
- Processing state with spinner
