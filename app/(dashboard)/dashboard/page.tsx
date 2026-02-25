'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { landlordApi, paymentsApi } from '@/lib/api';
import { formatUGX } from '@/lib/currency';
import { Payment, TenantInArrears } from '@/types';
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

  const { data: arrearsData, isLoading: arrearsLoading } = useQuery({
    queryKey: ['tenants-in-arrears', user?.id],
    queryFn: () => landlordApi.getTenantsWithOutstandingBalance(5),
    enabled: !!user,
  });

  console.log({ dashboardData })

  const summary = dashboardData?.data;
  const recentPayments: Payment[] = paymentsData?.data?.slice(0, 5) || [];
  const tenantsInArrears: TenantInArrears[] = arrearsData?.data?.tenants ?? [];
  const isLoading = dashboardLoading || paymentsLoading || arrearsLoading;

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
                <Icon icon="solar:buildings-broken" className="h-8 w-8 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProperties}</div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expected Income</CardTitle>
              <Icon icon="solar:money-bag-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(summary.totalMonthlyRevenueExpected)}</div>
            </CardContent>
          </Card>


          <Link href="/payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Received payments <span className='text-[10px]'>(This Month)</span></CardTitle>
                <Icon icon="solar:hand-money-broken" className="h-8 w-8 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUGX(summary.totalPaymentsReceivedCurrentMonth)}</div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              <Icon icon="solar:danger-triangle-broken" className="h-8 w-8 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(summary.totalOutstandingBalance)}</div>
            </CardContent>
          </Card>

          <Link href="/tenants"><Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Icon icon="solar:info-square-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUnits}</div>
            </CardContent>
          </Card>
          </Link>

          <Link href="/tenants"><Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Occupied</CardTitle>
              <Icon icon="solar:info-square-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.occupiedUnits}</div>
            </CardContent>
          </Card>
          </Link>

          <Link href="/tenants"><Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empty</CardTitle>
              <Icon icon="solar:info-square-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUnits - summary.occupiedUnits}</div>
            </CardContent>
          </Card>
          </Link>

          <Link href="/tenants"><Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Occupancy</CardTitle>
              <Icon icon="solar:info-square-broken" className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summary.occupancyRate)}</div>
            </CardContent>
          </Card>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tenants in Arrears</CardTitle>
              <CardDescription>Tenants with outstanding balances</CardDescription>
            </div>
            <Link href="/payments">
              <Button>
                <Icon icon="solar:eye-broken" className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {arrearsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : tenantsInArrears.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tenants in arrears
              </div>
            ) : (
              <div className="space-y-4">
                {tenantsInArrears.map((item) => (
                  <div key={item.tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {item.tenant.firstName} {item.tenant.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Unit {item.unit.unitNumber} — {item.property.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-red-600">{formatUGX(item.outstandingBalance)}</p>
                      <p className="text-xs text-gray-500">{item.daysOverdue} days overdue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest rent payments received</CardDescription>
            </div>
            <Link href="/payments">
              <Button>
                <Icon icon="solar:eye-broken" className="h-4 w-4 mr-2" />
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

        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest leases, maintenance, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              Activity feed coming soon.
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}