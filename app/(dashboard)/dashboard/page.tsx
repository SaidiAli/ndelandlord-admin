'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, DollarSign, Eye, AlertTriangle } from 'lucide-react';
import { landlordApi, paymentsApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { Payment } from '@/types';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['landlord-dashboard', user?.id],
    queryFn: () => landlordApi.getDashboardData(),
    enabled: !!user,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['recent-payments', user?.id],
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user,
  });

  const summary = dashboardData?.data?.summary;
  const recentPayments: Payment[] = paymentsData?.data?.slice(0, 5) || [];
  const isLoading = dashboardLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your property management activity.</p>
      </div>


      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading dashboard data...</p>
        </div>
      )}

      {/* Metrics Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/properties">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProperties}</div>
                <p className="text-xs text-muted-foreground">{summary.totalUnits} total units</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tenants"><Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTenants}</div>
              <p className="text-xs text-muted-foreground">{summary.occupancyRate}% occupancy</p>
            </CardContent>
          </Card></Link>


          <Link href="/payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUGX(summary.totalMonthlyRevenue)}</div>
                <p className="text-xs text-muted-foreground">from active leases</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/leases">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.overduePayments}</div>
                <p className="text-xs text-muted-foreground">{formatUGX(summary.totalOverdueAmount)} overdue</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest rent payments received</CardDescription>
            </div>
            <Link href="/payments">
              <Button>
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
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-sm">
                          {payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Unit {payment.lease?.unit?.unitNumber} - {payment.lease?.unit?.property?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatUGX(payment.amount)}</p>
                      <p className="text-xs capitalize text-green-600">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for other activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest leases, maintenance, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Activity feed coming soon.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}