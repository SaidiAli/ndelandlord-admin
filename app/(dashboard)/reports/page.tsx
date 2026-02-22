'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsApi, exportsApi, downloadBlob } from '@/lib/api';
import { Payment, PaymentAnalytics } from '@/types';
import { PaymentAnalyticsChart } from '@/components/analytics/PaymentAnalyticsChart';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MonthlyCollectionChart } from '@/components/analytics/MonthlyCollectionChart';
import { PaymentComplianceDashboard } from '@/components/analytics/PaymentComplianceDashboard';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ReportsPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

  const handleDownloadSummary = async () => {
    setIsDownloadingSummary(true);
    try {
      const blob = await exportsApi.downloadSummary(startDate || undefined, endDate || undefined);
      downloadBlob(blob, 'financial-summary.pdf');
    } catch {
      toast.error('Failed to generate summary. Please try again.');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['payment-analytics', user?.id],
    queryFn: () => paymentsApi.getAnalytics(),
    enabled: !!user,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user?.id],
    queryFn: () => paymentsApi.getAll(),
    enabled: !!user,
  });

  const analytics: PaymentAnalytics = analyticsData?.data || {
    totalPayments: 0,
    totalAmount: 0,
    averagePaymentTime: 0,
    paymentsByStatus: [],
    paymentsByProvider: [],
    monthlyTrends: [],
  };

  const payments: Payment[] = paymentsData?.data || [];
  const isLoading = analyticsLoading || paymentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Visualize and analyze your property management data</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="startDate" className="text-xs text-gray-500">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="endDate" className="text-xs text-gray-500">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
          <Button onClick={handleDownloadSummary} disabled={isDownloadingSummary}>
            {isDownloadingSummary ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Reports
          </Button>
        </div>
      </div>

      <PaymentComplianceDashboard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Payment Analytics</span>
          </CardTitle>
          <CardDescription>A comprehensive overview of payment trends and distributions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Loading analytics data...</p>
            </div>
          ) : (
            <PaymentAnalyticsChart analytics={analytics} />
          )}
        </CardContent>
      </Card>

      <MonthlyCollectionChart payments={payments} />
    </div>
  );
}