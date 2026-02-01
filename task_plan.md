# Task Plan: Implement Landlord Wallet Module UI

## Goal
Implement the frontend wallet module for landlords to track collected rent funds and withdraw to mobile money or bank account.

## Context
- Backend has added new wallet APIs: GET /wallet, GET /wallet/balance, GET /wallet/transactions, POST /wallet/withdraw
- Wallet tracks: balance, totalDeposited, totalWithdrawn, pendingWithdrawals
- Withdrawals are via mobile money (MTN, Airtel) or bank account (future)
- This is a Uganda-based system using UGX currency

## Phases

### Phase 1: Types and API Layer
- **Status**: `complete`
- **Tasks**:
  - [x] Add wallet types to `/types/index.ts`
  - [x] Add wallet API functions to `/lib/api.ts`

### Phase 2: Wallet Dashboard Card Component
- **Status**: `complete`
- **Tasks**:
  - [x] Create `/components/wallet/WalletCard.tsx` - summary card for dashboard
  - [x] Shows: balance, totalDeposited, totalWithdrawn, quick actions

### Phase 3: Withdrawal Modal Component
- **Status**: `complete`
- **Tasks**:
  - [x] Create `/components/wallet/WithdrawModal.tsx`
  - [x] Form fields: amount, destination type (mobile_money/bank), provider, phone
  - [x] Validation: min 10,000 UGX, max = available balance, phone format
  - [x] States: form → processing → success/error

### Phase 4: Wallet Page
- **Status**: `complete`
- **Tasks**:
  - [x] Create `/app/(dashboard)/wallet/page.tsx` - full wallet overview
  - [x] Sections: Balance Overview, Quick Actions, Transaction History

### Phase 5: Transaction History Component
- **Status**: `complete`
- **Tasks**:
  - [x] Create `/components/wallet/TransactionHistory.tsx`
  - [x] Table with columns: Date, Type, Amount, Status, Description
  - [x] Filters: type dropdown, status dropdown
  - [x] Pagination support
  - [x] Color coding: green deposits, red withdrawals

### Phase 6: Navigation & Dashboard Integration
- **Status**: `complete`
- **Tasks**:
  - [x] Add Wallet to sidebar navigation (after Payments)
  - [x] Add WalletCard to dashboard page

## Files Created
1. `/components/wallet/WalletCard.tsx`
2. `/components/wallet/WithdrawModal.tsx`
3. `/components/wallet/TransactionHistory.tsx`
4. `/components/wallet/index.ts`
5. `/app/(dashboard)/wallet/page.tsx`

## Files Modified
1. `/types/index.ts` - add wallet types
2. `/lib/api.ts` - add wallet API functions
3. `/components/layout/sidebar.tsx` - add wallet navigation
4. `/app/(dashboard)/dashboard/page.tsx` - add wallet card

## Technical Decisions
- Use React Query for data fetching (consistent with codebase)
- Use shadcn/ui components (Button, Card, Dialog, Table, Select, Input)
- Use React Hook Form + Zod for withdrawal form validation
- Use toast (sonner) for user feedback
- Format amounts with formatUGX from `/lib/currency.ts`
- Use className-based styling (project has simplified Button/Badge without variant props)

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Badge/Button variant props not found | 1 | Used className-based styling instead |
| RadioGroup component not found | 1 | Created custom button-based selector |

## Implementation Complete
All phases completed successfully. TypeScript and ESLint checks pass.
