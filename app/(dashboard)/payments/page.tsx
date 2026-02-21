'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentUpdates, usePaymentNotifications } from '@/hooks/usePaymentUpdates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Icon } from '@iconify/react';
import { paymentsApi } from '@/lib/api';
import { Payment } from '@/types';
import { getPaymentColumns } from './columns';
import { PaymentDetailsModal } from '@/components/payments/PaymentDetailsModal';
import { RegisterPaymentModal } from '@/components/RegisterPaymentModal';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Real-time payment updates
  const { showNotification } = usePaymentNotifications();
  usePaymentUpdates({
    enabled: true,
    interval: 30000,
    onPaymentUpdate: (paymentId, status) => {
      if (status === 'completed') {
        showNotification(paymentId, status);
      }
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user,
  });

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.getAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
    },
  });

  const payments: Payment[] = paymentsData?.data || [];

  const filteredPayments = useMemo(
    () => payments.filter(p => statusFilter === 'all' || p.status === statusFilter),
    [payments, statusFilter],
  );

  const columns = useMemo(() => getPaymentColumns(setSelectedPayment), [setSelectedPayment]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage rent payments and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsRegisterModalOpen(true)}>
            <Icon icon="solar:card-2-bold-duotone" className="h-4 w-4 mr-2" />
            Receive Payment
          </Button>
          <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
            <Icon icon="solar:refresh-bold-duotone" className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
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
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <Icon icon="solar:filter-bold-duotone" className="h-4 w-4 mr-2" />
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
                  <Icon icon="solar:download-bold-duotone" className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {paymentsLoading ? (
                <div className="text-center py-8">Loading payments...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredPayments}
                  searchKey="transactionId"
                  searchPlaceholder="Search by transaction ID..."
                />
              )}
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
