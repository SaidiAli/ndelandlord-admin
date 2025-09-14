'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, DollarSign, Wrench, CreditCard, TrendingUp, Eye } from 'lucide-react';
import { paymentsApi, propertiesApi, leasesApi, maintenanceApi } from '@/lib/api';
import { formatUGX, MOBILE_MONEY_PROVIDERS } from '@/lib/currency';
import { Payment } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  // Fetch recent payments for dashboard
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: () => paymentsApi.getAll(),
  });

  // Fetch payment analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['payment-analytics-dashboard'],
    queryFn: () => paymentsApi.getAnalytics(),
  });

  // Fetch properties count
  const { data: propertiesData } = useQuery({
    queryKey: ['properties-count'],
    queryFn: () => propertiesApi.getAll(),
  });

  // Fetch active leases for tenant count
  const { data: leasesData } = useQuery({
    queryKey: ['leases-count'],
    queryFn: () => leasesApi.getAll(),
  });

  // Fetch maintenance requests
  const { data: maintenanceData } = useQuery({
    queryKey: ['maintenance-count'],
    queryFn: () => maintenanceApi.getAll(),
  });

  const recentPayments: Payment[] = paymentsData?.data?.slice(0, 5) || [];
  const analytics = analyticsData?.data || null;
  
  const totalPaymentsThisMonth = analytics?.totalPayments || 0;
  const totalRevenueThisMonth = analytics?.totalAmount || 0;
  const completedPayments = analytics?.paymentsByStatus?.find(s => s.status === 'completed')?.count || 0;
  const processingPayments = analytics?.paymentsByStatus?.find(s => s.status === 'processing')?.count || 0;

  // Calculate real metrics from data
  const totalProperties = propertiesData?.data?.length || 0;
  const activeLeases = leasesData?.data?.filter(lease => lease.status === 'active')?.length || 0;
  const maintenanceRequests = maintenanceData?.data?.length || 0;
  const pendingMaintenance = maintenanceData?.data?.filter(req => req.status === 'submitted' || req.status === 'in_progress')?.length || 0;
  const recentMaintenanceRequests = maintenanceData?.data?.slice(0, 2) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your property management</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {totalProperties === 0 ? 'No properties yet' : `${totalProperties} total properties`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <p className="text-xs text-muted-foreground">
              {activeLeases === 0 ? 'No active leases' : 'Active lease agreements'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUGX(totalRevenueThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPaymentsThisMonth} payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaymentsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              {completedPayments} completed, {processingPayments} processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceRequests}</div>
            <p className="text-xs text-muted-foreground">
              {pendingMaintenance} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest rent payments received</CardDescription>
            </div>
            <Link href="/payments">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading payments...</p>
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payments yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => {
                  const providerInfo = payment.mobileMoneyProvider 
                    ? MOBILE_MONEY_PROVIDERS[payment.mobileMoneyProvider]
                    : null;
                  
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: payment.status === 'completed' ? '#22c55e' :
                                               payment.status === 'processing' ? '#eab308' :
                                               payment.status === 'pending' ? '#64748b' : '#ef4444'
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {payment.lease?.unit?.unitNumber} - {payment.lease?.unit?.property?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}
                          </p>
                          {providerInfo && (
                            <p className="text-xs text-gray-400">{providerInfo.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatUGX(payment.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {payment.paidDate 
                            ? new Date(payment.paidDate).toLocaleDateString()
                            : new Date(payment.createdAt).toLocaleDateString()
                          }
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{payment.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>Recent maintenance issues</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMaintenanceRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No maintenance requests
              </div>
            ) : (
              <div className="space-y-4">
                {recentMaintenanceRequests.map((request) => {
                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case 'urgent': return 'bg-red-100 text-red-800';
                      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
                      case 'completed': return 'bg-green-100 text-green-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <div key={request.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-500">
                          {request.unit?.unitNumber} - {request.unit?.property?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(request.priority)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}