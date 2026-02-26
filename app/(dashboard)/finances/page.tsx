'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  landlordApi,
  paymentsApi,
  exportsApi,
  downloadBlob,
} from '@/lib/api';
import { formatUGX, formatCompactUGX } from '@/lib/currency';
import {
  Payment,
  TenantInArrears,
  AdvancePaymentRecord,
  LandlordPaymentOverview,
  LandlordFinancialAnalytics,
} from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function FinancesPage() {
  const { user } = useAuth();
  const [paymentSearch, setPaymentSearch] = useState('');
  const [exportingPdf, setExportingPdf] = useState<string | null>(null);

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['landlord-dashboard', user?.id],
    queryFn: () => landlordApi.getDashboardData(),
    enabled: !!user,
  });

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['payment-overview', user?.id],
    queryFn: () => landlordApi.getPaymentOverview(),
    enabled: !!user,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['financial-analytics', user?.id],
    queryFn: () => landlordApi.getFinancialAnalytics(),
    enabled: !!user,
  });

  const { data: completedPaymentsData, isLoading: completedLoading } = useQuery({
    queryKey: ['completed-payments', user?.id],
    queryFn: () => paymentsApi.getAll({ status: 'completed' }),
    enabled: !!user,
  });

  const { data: outstandingData, isLoading: outstandingLoading } = useQuery({
    queryKey: ['outstanding-balances', user?.id],
    queryFn: () => landlordApi.getTenantsWithOutstandingBalance(50),
    enabled: !!user,
  });

  const { data: advanceData, isLoading: advanceLoading } = useQuery({
    queryKey: ['advance-payments', user?.id],
    queryFn: () => landlordApi.getAdvancePayments(),
    enabled: !!user,
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['financial-report', user?.id],
    queryFn: () => landlordApi.getFinancialReport({ reportType: 'summary' }),
    enabled: !!user,
  });

  // ── Derived data ──────────────────────────────────────────────────────────
  const summary = dashboardData?.data;
  const overview: LandlordPaymentOverview | undefined = overviewData?.data;
  const analytics: LandlordFinancialAnalytics | undefined = analyticsData?.data;
  const completedPayments: Payment[] = completedPaymentsData?.data || [];
  const outstandingTenants: TenantInArrears[] = outstandingData?.data?.tenants ?? [];
  const outstandingSummary = outstandingData?.data?.summary;
  const advanceRecords: AdvancePaymentRecord[] = advanceData?.data ?? [];
  const report = reportData?.data;

  // ── Filter completed payments ─────────────────────────────────────────────
  const filteredPayments = completedPayments.filter(p => {
    if (!paymentSearch) return true;
    const q = paymentSearch.toLowerCase();
    return (
      p.lease?.tenant?.firstName?.toLowerCase().includes(q) ||
      p.lease?.tenant?.lastName?.toLowerCase().includes(q) ||
      p.lease?.unit?.property?.name?.toLowerCase().includes(q) ||
      p.lease?.unit?.unitNumber?.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleExportSummary() {
    try {
      const blob = await exportsApi.downloadSummary();
      downloadBlob(blob, 'payments-summary.pdf');
      toast.success('Summary exported');
    } catch {
      toast.error('Failed to export summary');
    }
  }

  async function handleDownloadPropertyReport(propertyId: string, propertyName: string) {
    setExportingPdf(propertyId);
    try {
      const blob = await exportsApi.downloadPropertyReport(propertyId);
      downloadBlob(blob, `${propertyName}-report.pdf`);
      toast.success('Property report downloaded');
    } catch {
      toast.error('Failed to download property report');
    } finally {
      setExportingPdf(null);
    }
  }

  // ── Loading spinner helper ────────────────────────────────────────────────
  function Spinner() {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
        <p className="text-gray-600">Comprehensive financial overview of your properties.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="received">Payments Received</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
          <TabsTrigger value="advance">Advance Payments</TabsTrigger>
          <TabsTrigger value="performance">Property Performance</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {dashboardLoading || overviewLoading || analyticsLoading ? (
            <Spinner />
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
                    <Icon icon="solar:hand-money-broken" className="h-7 w-7 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatUGX(summary?.totalPaymentsReceivedCurrentMonth ?? 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Completed payments this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                    <Icon icon="solar:danger-triangle-broken" className="h-7 w-7 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatUGX(summary?.totalOutstandingBalance ?? 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Overdue across all tenants</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                    <Icon icon="solar:clock-circle-broken" className="h-7 w-7 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overview?.summary.pendingPayments ?? 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatUGX(overview?.summary.totalPendingAmount ?? 0)} pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expected Monthly</CardTitle>
                    <Icon icon="solar:money-bag-broken" className="h-7 w-7 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatUGX(summary?.totalMonthlyRevenueExpected ?? 0)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Sum of active lease rents</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue trend chart */}
              {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={v => formatCompactUGX(v)} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => formatUGX(v)} />
                        <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">No revenue data available yet.</p>
                  </CardContent>
                </Card>
              )}

              {/* Payment status cards */}
              {overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{overview.summary.completedPayments}</div>
                      <div className="text-sm text-gray-600">{formatUGX(overview.summary.totalCompletedAmount)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{overview.summary.pendingPayments}</div>
                      <div className="text-sm text-gray-600">{formatUGX(overview.summary.totalPendingAmount)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-red-700">Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{overview.summary.failedPayments}</div>
                      <div className="text-sm text-gray-600">{formatUGX(overview.summary.totalFailedAmount)}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab 2: Payments Received ─────────────────────────────────────── */}
        <TabsContent value="received" className="space-y-6 mt-6">
          {completedLoading ? (
            <Spinner />
          ) : (
            <>
              {/* Summary strip */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-4">
                  <Card className="px-4 py-3">
                    <div className="text-xs text-gray-500">Total Received</div>
                    <div className="text-lg font-bold">
                      {formatUGX(completedPayments.reduce((s, p) => s + p.amount, 0))}
                    </div>
                  </Card>
                  <Card className="px-4 py-3">
                    <div className="text-xs text-gray-500">Payments</div>
                    <div className="text-lg font-bold">{completedPayments.length}</div>
                  </Card>
                </div>
                <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={handleExportSummary}>
                  <Icon icon="solar:download-minimalistic-broken" className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <Icon icon="solar:magnifer-broken" className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by tenant, property, or unit..."
                  value={paymentSearch}
                  onChange={e => setPaymentSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {/* Table */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No completed payments found.</div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Property / Unit</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {p.lease?.tenant?.firstName} {p.lease?.tenant?.lastName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {p.lease?.unit?.property?.name} — Unit {p.lease?.unit?.unitNumber}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatUGX(p.amount)}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {p.paidDate ? format(new Date(p.paidDate), 'dd MMM yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="capitalize bg-gray-100 text-gray-800 border-transparent">
                              {p.mobileMoneyProvider ?? p.paymentMethod ?? 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab 3: Outstanding Balances ──────────────────────────────────── */}
        <TabsContent value="outstanding" className="space-y-6 mt-6">
          {outstandingLoading ? (
            <Spinner />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatUGX(outstandingSummary?.totalOutstandingAmount ?? 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tenants with Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {outstandingSummary?.totalTenantsWithBalance ?? 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {outstandingTenants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tenants with outstanding balances.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Property / Unit</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Outstanding</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Overdue Periods</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {outstandingTenants
                        .slice()
                        .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
                        .map(t => (
                          <tr key={t.tenant.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">
                              {t.tenant.firstName} {t.tenant.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {t.property.name} — Unit {t.unit.unitNumber}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-red-600">
                              {formatUGX(t.outstandingBalance)}
                            </td>
                            <td className="px-4 py-3 text-right">{t.overdueCount}</td>
                            <td className="px-4 py-3 text-right">
                              <Badge className={t.daysOverdue > 30 ? 'bg-red-100 text-red-800 border-transparent' : 'bg-gray-100 text-gray-800 border-transparent'}>
                                {t.daysOverdue}d
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab 4: Advance Payments ──────────────────────────────────────── */}
        <TabsContent value="advance" className="space-y-6 mt-6">
          {advanceLoading ? (
            <Spinner />
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Advance Credits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatUGX(advanceRecords.reduce((s, r) => s + r.advanceCredit, 0))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tenants Ahead</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{advanceRecords.length}</div>
                  </CardContent>
                </Card>
              </div>

              {advanceRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tenants with advance payments.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Property / Unit</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Credit Amount</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Months Ahead</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {advanceRecords.map(r => (
                        <tr key={r.lease.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            {r.tenant.firstName} {r.tenant.lastName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {r.property.name} — Unit {r.unit.unitNumber}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            {formatUGX(r.advanceCredit)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge className="bg-gray-100 text-gray-800 border-transparent">{r.monthsAhead} mo</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Tab 5: Property Performance ──────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          {reportLoading ? (
            <Spinner />
          ) : !report ? (
            <div className="text-center py-12 text-gray-500">No report data available.</div>
          ) : (
            <>
              {/* Revenue by property bar chart */}
              {report.breakdown?.revenueByProperty?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Property</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={report.breakdown.revenueByProperty}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="propertyName" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => formatCompactUGX(v)} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => formatUGX(v)} />
                        <Legend />
                        <Bar dataKey="totalRevenue" fill="#2563eb" name="Completed" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pendingRevenue" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Properties table */}
              {report.breakdown?.revenueByProperty?.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Property</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Total Revenue</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Pending Revenue</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.breakdown.revenueByProperty.map((prop: any) => (
                        <tr key={prop.propertyId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{prop.propertyName}</td>
                          <td className="px-4 py-3 text-right">{formatUGX(prop.totalRevenue)}</td>
                          <td className="px-4 py-3 text-right text-yellow-600">
                            {formatUGX(prop.pendingRevenue)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              className="h-8 px-3 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                              disabled={exportingPdf === prop.propertyId}
                              onClick={() => handleDownloadPropertyReport(prop.propertyId, prop.propertyName)}
                            >
                              {exportingPdf === prop.propertyId ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                              ) : (
                                <Icon icon="solar:download-minimalistic-broken" className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No property revenue data available.</div>
              )}

              {/* Overall summary */}
              {report.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatUGX(report.summary.totalRevenue)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{report.summary.totalActiveLeases}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{report.summary.occupancyRate?.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
