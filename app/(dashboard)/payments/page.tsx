'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentUpdates, usePaymentNotifications } from '@/hooks/usePaymentUpdates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { format } from 'date-fns';
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
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
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
      if (fromDate && date < fromDate) return false;
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
    setFromDate(undefined);
    setToDate(undefined);
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
            <Icon icon="solar:card-2-broken" className="h-4 w-4 mr-2" />
            Receive Payment
          </Button>
          <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
            <Icon icon="solar:refresh-broken" className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
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
                    <Icon icon="solar:filter-broken" className="h-4 w-4 mr-2" />
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
                    <Icon icon="solar:buildings-broken" className="h-4 w-4 mr-2" />
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="w-full justify-start text-left font-normal bg-transparent border-2 text-black">
                        <Icon icon="solar:calendar-broken" className="mr-2 h-4 w-4" />
                        {fromDate ? format(fromDate, 'dd MMM yyyy') : <span className="text-muted-foreground">From</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fromDate}
                        onSelect={setFromDate}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-gray-400 text-sm">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="w-full justify-start text-left font-normal bg-transparent border-2 text-black">
                        <Icon icon="solar:calendar-broken" className="mr-2 h-4 w-4" />
                        {toDate ? format(toDate, 'dd MMM yyyy') : <span className="text-muted-foreground">To</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={toDate}
                        onSelect={setToDate}
                        disabled={(date) => !!fromDate && date < fromDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="text-white">
                    <Icon icon="solar:close-circle-broken" className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {filteredPayments.length} of {payments.length}
                  </span>
                  <Button>
                    <Icon icon="solar:download-broken" className="h-4 w-4 mr-2" />
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
