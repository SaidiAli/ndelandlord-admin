# Verit Admin - Property Management Dashboard

## Project Overview

Next.js 14 property management dashboard for landlords in Uganda. Manages properties, units, tenants, leases, and rent payments with mobile money integration.

### Ecosystem

| Project | Description | Port | Path |
|---------|-------------|------|------|
| **verit-admin** (this) | Dashboard for landlords/admins | 4001 | `../verit-admin` |
| **verit-server** | Express.js backend API | 4000 | `../verit-server` |
| **verit-tenant-mobile-app** | React Native app for tenants | - | `../verit-tenant-mobile-app` |

Backend API base URL: `http://localhost:4000/api`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Data Fetching**: React Query v5 (`@tanstack/react-query`)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Toasts**: Sonner
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Key File Locations

```
/app
├── (auth)/                    # Public routes (login, register)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/               # Protected routes (requires auth)
│   ├── dashboard/page.tsx     # Main dashboard
│   ├── properties/            # Property management
│   ├── units/                 # Unit management
│   ├── tenants/               # Tenant management
│   ├── leases/                # Lease management
│   ├── payments/              # Payment tracking
│   └── reports/               # Analytics/reports
├── layout.tsx                 # Root layout with providers
└── providers.tsx              # QueryClient + AuthProvider

/components
├── ui/                        # shadcn primitives - DO NOT MODIFY
├── properties/                # AddPropertyModal, EditPropertyModal
├── units/                     # AddUnitModal, EditUnitModal
├── tenants/                   # TenantDetailsModal
├── leases/                    # LeaseDetailsModal, EnhancedLeaseDetailsModal
├── payments/                  # Payment-related components
└── layout/                    # Sidebar, Header, etc.

/lib
├── api.ts                     # All API functions (axios instance)
├── auth.ts                    # authStorage (token/user in localStorage)
├── currency.ts                # UGX formatting utilities
├── unit-utils.ts              # Type guards & display helpers
└── utils.ts                   # cn() for classNames

/hooks
└── useAuth.tsx                # Auth context & provider

/types
└── index.ts                   # All TypeScript types
```

## Development Commands

```bash
npm run dev        # Start dev server on port 4001
npm run build      # Production build
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

### 7. SSR-Safe localStorage Access
The `authStorage` helper in `/lib/auth.ts` safely accesses localStorage:

```tsx
// Always check for window before localStorage access
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
```

## Type Conventions

### Discriminated Unions for Units
Units have type-specific details based on property type:

```tsx
interface ResidentialUnitDetails {
  unitType: 'apartment' | 'studio' | 'house' | ...;
  bedrooms: number;
  bathrooms: number;
  hasBalcony?: boolean;
  isFurnished?: boolean;
}

interface CommercialUnitDetails {
  unitType: 'office' | 'retail' | 'warehouse' | ...;
  suiteNumber?: string;
  maxOccupancy?: number;
  ceilingHeight?: number;
}

interface Unit {
  details?: ResidentialUnitDetails | CommercialUnitDetails;
}
```

### Type Guards
```tsx
import { isResidentialDetails, isCommercialDetails } from '@/lib/unit-utils';

if (isResidentialDetails(unit.details)) {
  // TypeScript knows details has bedrooms/bathrooms
  console.log(unit.details.bedrooms);
}
```

### API Response Transformation
Backend returns nested structures; transform in API layer:

```tsx
// In lib/api.ts
export function transformLeaseResponse(response: LeaseApiResponse): Lease {
  const { lease, tenant, unit, property } = response;
  return {
    id: lease.id,
    monthlyRent: parseFloat(lease.monthlyRent), // String to number
    // ... flatten nested structure
  };
}
```

## Currency & Locale

**Country**: Uganda
**Currency**: Uganda Shillings (UGX)

```tsx
import { formatUGX, formatCompactUGX } from '@/lib/currency';

formatUGX(1500000)        // "UGX 1,500,000"
formatCompactUGX(1500000) // "UGX 1.5M"
formatCompactUGX(50000)   // "UGX 50K"
```

### Mobile Money Providers
```tsx
type MobileMoneyProvider = 'mtn' | 'airtel';

// Phone number prefixes:
// MTN: 77x, 78x
// Airtel: 70x, 74x, 75x
```

## Important Rules

1. **Always use `'use client'`** for components with:
   - useState/useEffect
   - Event handlers
   - useQuery/useMutation
   - useAuth

2. **Include `user?.id` in query keys** to scope data per user:
   ```tsx
   queryKey: ['properties', user?.id]
   ```

3. **Use Controller for controlled components** (Select, Switch, Checkbox):
   ```tsx
   <Controller name="type" control={control} render={({ field }) => (
     <Select onValueChange={field.onChange} value={field.value}>
   ```

4. **Handle loading and empty states**:
   ```tsx
   if (isLoading) return <div>Loading...</div>;
   if (!data?.length) return <div>No items found</div>;
   ```

5. **Use toast for user feedback**:
   ```tsx
   toast.success('Saved!');
   toast.error('Failed to save');
   toast.warning('Some items were skipped');
   ```
6. Always check in with the backend for type definitions and API responses
