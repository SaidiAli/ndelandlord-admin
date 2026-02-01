'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ExternalLink } from 'lucide-react';
import { walletApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useState } from 'react';
import { WithdrawModal } from './WithdrawModal';

export function WalletCard() {
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { data: walletData, isLoading, refetch } = useQuery({
    queryKey: ['wallet-summary', user?.id],
    queryFn: () => walletApi.getSummary(),
    enabled: !!user,
  });

  const wallet = walletData?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableBalance = (wallet?.balance || 0) - (wallet?.pendingWithdrawals || 0);

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-2xl font-bold text-primary">
              {formatUGX(wallet?.balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {formatUGX(availableBalance)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="font-medium">{formatUGX(wallet?.totalDeposited || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="font-medium">{formatUGX(wallet?.totalWithdrawn || 0)}</p>
              </div>
            </div>
          </div>

          {(wallet?.pendingWithdrawals || 0) > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
              <Clock className="h-4 w-4" />
              <span>Pending withdrawals: {formatUGX(wallet?.pendingWithdrawals || 0)}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              className="h-9 px-3"
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableBalance < 10000}
            >
              Withdraw
            </Button>
            <Link href="/wallet">
              <Button className="h-9 px-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
                <ExternalLink className="h-4 w-4 mr-1" />
                Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <WithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        availableBalance={availableBalance}
        onSuccess={() => refetch()}
      />
    </>
  );
}
