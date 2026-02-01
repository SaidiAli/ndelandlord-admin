'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { walletApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Banknote,
} from 'lucide-react';

export default function WalletPage() {
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['wallet-summary', user?.id],
    queryFn: () => walletApi.getSummary(),
    enabled: !!user,
  });

  const wallet = walletData?.data;
  const availableBalance = (wallet?.balance || 0) - (wallet?.pendingWithdrawals || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600">Manage your collected rent funds and withdrawals.</p>
        </div>
        <Button
          onClick={() => setShowWithdrawModal(true)}
          disabled={isLoading || availableBalance < 10000}
        >
          <Banknote className="h-4 w-4 mr-2" />
          Withdraw Funds
        </Button>
      </div>

      {/* Balance Overview Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatUGX(wallet?.balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Available: {formatUGX(availableBalance)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatUGX(wallet?.totalDeposited || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime deposits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatUGX(wallet?.totalWithdrawn || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifetime withdrawals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatUGX(wallet?.pendingWithdrawals || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Being processed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      {wallet && wallet.totalDeposited > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Withdrawal Rate</p>
                <p className="text-xl font-semibold">
                  {((wallet.totalWithdrawn / wallet.totalDeposited) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">of collected funds withdrawn</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Retained</p>
                <p className="text-xl font-semibold">
                  {((wallet.balance / wallet.totalDeposited) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">of collected funds in wallet</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Transactions</p>
                <p className="text-xl font-semibold">
                  {wallet.recentTransactions?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">in the last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View all deposits from rent payments and your withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory limit={15} showFilters={true} showPagination={true} />
        </CardContent>
      </Card>

      {/* Withdraw Modal */}
      <WithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        availableBalance={availableBalance}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
