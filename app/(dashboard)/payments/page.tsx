'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentUpdates, usePaymentNotifications } from '@/hooks/usePaymentUpdates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Icon } from '@iconify/react';
import { paymentsApi, propertiesApi } from '@/lib/api';
import { Payment, Property } from '@/types';
import { getPaymentColumns } from './columns';
import { PaymentDetailsModal } from '@/components/payments/PaymentDetailsModal';
import { RegisterPaymentModal } from '@/components/RegisterPaymentModal';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
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

  const { data: propertiesData } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.getAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
    },
  });

  const payments: Payment[] = paymentsData?.data || [];
  const properties: Property[] = propertiesData?.data || [];

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (propertyFilter !== 'all' && p.lease?.unit?.property?.id !== propertyFilter) return false;

      const dateStr = p.paidDate ?? p.createdAt;
      const date = new Date(dateStr);
      if (fromDate && date < new Date(fromDate)) return false;
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }

      return true;
    });
  }, [payments, statusFilter, propertyFilter, fromDate, toDate]);

  const columns = useMemo(() => getPaymentColumns(setSelectedPayment), [setSelectedPayment]);

  const hasActiveFilters = statusFilter !== 'all' || propertyFilter !== 'all' || !!fromDate || !!toDate;

  const clearFilters = () => {
    setStatusFilter('all');
    setPropertyFilter('all');
    setFromDate('');
    setToDate('');
  };

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
              <div className="flex flex-wrap gap-3 mt-4 items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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

                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-48">
                    <Icon icon="solar:buildings-bold-duotone" className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-36"
                    placeholder="From"
                    title="From date"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-36"
                    placeholder="To"
                    title="To date"
                    min={fromDate}
                  />
                </div>

                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="text-white">
                    <Icon icon="solar:close-circle-bold" className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {filteredPayments.length} of {payments.length}
                  </span>
                  <Button>
                    <Icon icon="solar:download-bold-duotone" className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
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
