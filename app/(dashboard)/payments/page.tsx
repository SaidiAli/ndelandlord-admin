'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentUpdates, usePaymentNotifications } from '@/hooks/usePaymentUpdates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatUGX, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { Payment } from '@/types';
import { PaymentDetailsModal } from '@/components/payments/PaymentDetailsModal';
import { RegisterPaymentModal } from '@/components/RegisterPaymentModal';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Real-time payment updates
  const { showNotification } = usePaymentNotifications();
  usePaymentUpdates({
    enabled: true,
    interval: 30000, // Check every 30 seconds
    onPaymentUpdate: (paymentId, status) => {
      // Show notification for completed payments
      if (status === 'completed') {
        showNotification(paymentId, status);
      }
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id], // Include user ID to prevent cache sharing between users
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user, // Only fetch when user is available
  });

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.getAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
    },
  });

  const payments: Payment[] = paymentsData?.data || [];

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.unit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case 'completed': return '';
      case 'processing': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'pending': return 'bg-transparent border-input text-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      default: return 'bg-transparent border-input text-foreground';
    }
  };

  const getProviderInfo = (provider?: string) => {
    if (!provider) return null;
    return MOBILE_MONEY_PROVIDERS[provider as keyof typeof MOBILE_MONEY_PROVIDERS];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage rent payments and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRegisterModalOpen(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Register Payment
          </Button>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by transaction ID, tenant name, or unit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-2">
                {paymentsLoading ? (
                  <div className="text-center py-8">Loading payments...</div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No payments found</div>
                ) : (
                  filteredPayments.map((payment) => {
                    const providerInfo = getProviderInfo(payment.mobileMoneyProvider);
                    const periodCovered = (payment as any).periodCovered;
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {payment.lease?.unit?.unitNumber} - {payment.lease?.unit?.property?.name}
                              </p>
                              {providerInfo && (
                                <Badge
                                  style={{
                                    backgroundColor: providerInfo.color,
                                    color: providerInfo.textColor
                                  }}
                                >
                                  {providerInfo.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {payment.transactionId || payment.id}
                            </p>
                            {periodCovered && (
                              <p className="text-xs text-gray-500">
                                Covers: {periodCovered}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-medium">{formatUGX(payment.amount)}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeClassName(payment.status)}>
                              {payment.status}
                            </Badge>
                            <Button
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">

        </TabsContent>
      </Tabs>

      <PaymentDetailsModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />

      <RegisterPaymentModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          refreshMutation.mutate();
          setIsRegisterModalOpen(false);
        }}
      />
    </div>
  );
}