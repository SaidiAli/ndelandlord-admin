'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { walletApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { WalletTransactionType, WalletTransactionStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  limit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
}

// Badge-like component for transaction type/status
function StatusBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      className
    )}>
      {children}
    </span>
  );
}

export function TransactionHistory({
  limit = 10,
  showFilters = true,
  showPagination = true,
}: TransactionHistoryProps) {
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<WalletTransactionStatus | 'all'>('all');
  const [offset, setOffset] = useState(0);

  const { data: transactionsData, isLoading, refetch } = useQuery({
    queryKey: ['wallet-transactions', user?.id, typeFilter, statusFilter, offset, limit],
    queryFn: () =>
      walletApi.getTransactions({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit,
        offset,
      }),
    enabled: !!user,
  });

  const transactions = transactionsData?.data || [];
  const pagination = transactionsData?.pagination;
  const totalPages = pagination ? pagination.pages : 1;
  const currentPage = pagination ? pagination.page : 1;

  const getTypeIcon = (type: WalletTransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: WalletTransactionType) => {
    switch (type) {
      case 'deposit':
        return <StatusBadge className="bg-green-50 text-green-700 border-green-200">Deposit</StatusBadge>;
      case 'withdrawal':
        return <StatusBadge className="bg-red-50 text-red-700 border-red-200">Withdrawal</StatusBadge>;
      case 'adjustment':
        return <StatusBadge className="bg-blue-50 text-blue-700 border-blue-200">Adjustment</StatusBadge>;
    }
  };

  const getStatusBadge = (status: WalletTransactionStatus) => {
    switch (status) {
      case 'completed':
        return <StatusBadge className="bg-green-50 text-green-700 border-green-200">Completed</StatusBadge>;
      case 'pending':
        return <StatusBadge className="bg-amber-50 text-amber-700 border-amber-200">Pending</StatusBadge>;
      case 'failed':
        return <StatusBadge className="bg-red-50 text-red-700 border-red-200">Failed</StatusBadge>;
    }
  };

  const getAmountColor = (type: WalletTransactionType) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-900';
    }
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as WalletTransactionType | 'all');
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as WalletTransactionStatus | 'all');
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => refetch()}
            className="ml-auto bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-9 px-3"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.createdAt), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transaction.type)}
                      {getTypeBadge(transaction.type)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.description || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${getAmountColor(transaction.type)}`}>
                    {transaction.type === 'withdrawal' ? '-' : '+'}
                    {formatUGX(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatUGX(transaction.balanceAfter)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showPagination && pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1} to {Math.min(offset + limit, pagination.total)} of {pagination.total} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrevPage}
              disabled={offset === 0}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-9 px-3 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-9 px-3 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
