'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePaymentUpdates, usePaymentNotifications } from '@/hooks/usePaymentUpdates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { formatUGX, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { Payment, PaymentAnalytics } from '@/types';
import { PaymentDetailsModal } from '@/components/payments/PaymentDetailsModal';
import { PaymentAnalyticsChart } from '@/components/analytics/PaymentAnalyticsChart';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
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

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['payment-analytics', user?.id], // Include user ID to prevent cache sharing between users
    queryFn: () => paymentsApi.getAnalytics(),
    enabled: !!user, // Only fetch when user is available
  });

  const refreshMutation = useMutation({
    mutationFn: () => paymentsApi.getAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['payment-analytics', user?.id] });
    },
  });

  const payments: Payment[] = paymentsData?.data || [];
  const analytics: PaymentAnalytics = analyticsData?.data || {
    totalPayments: 0,
    totalAmount: 0,
    averagePaymentTime: 0,
    paymentsByStatus: [],
    paymentsByProvider: [],
    monthlyTrends: [],
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.lease?.unit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
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
        <Button 
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalPayments}</div>
                <p className="text-xs text-muted-foreground">
                  {formatUGX(analytics.totalAmount)} total value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.paymentsByStatus.find(s => s.status === 'completed')?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatUGX(analytics.paymentsByStatus.find(s => s.status === 'completed')?.amount || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.paymentsByStatus.find(s => s.status === 'processing')?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg. {Math.round(analytics.averagePaymentTime)} mins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12%</div>
                <p className="text-xs text-muted-foreground">
                  vs last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          {payment.lease?.unit?.unitNumber} - {payment.lease?.unit?.property?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatUGX(payment.amount)}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
              <CardDescription>Complete payment transaction history</CardDescription>
            </CardHeader>
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
                <Button variant="outline">
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
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {payment.lease?.unit?.unitNumber} - {payment.lease?.unit?.property?.name}
                              </p>
                              {providerInfo && (
                                <Badge 
                                  variant="outline" 
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
                        <div className="text-right">
                          <p className="font-medium">{formatUGX(payment.amount)}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getStatusBadgeVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
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
          {analyticsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading analytics...</p>
            </div>
          ) : (
            <PaymentAnalyticsChart analytics={analytics} />
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payments by Provider</CardTitle>
                <CardDescription>Mobile money provider distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.paymentsByProvider.map((provider) => {
                    const providerInfo = getProviderInfo(provider.provider);
                    return (
                      <div key={provider.provider} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: providerInfo?.color || '#gray' }}
                          />
                          <span>{providerInfo?.name || provider.provider}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{provider.count} payments</div>
                          <div className="text-sm text-gray-500">{formatUGX(provider.amount)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
                <CardDescription>Current status of all payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.paymentsByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusBadgeVariant(status.status)}>
                          {status.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{status.count} payments</div>
                        <div className="text-sm text-gray-500">{formatUGX(status.amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentDetailsModal 
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}