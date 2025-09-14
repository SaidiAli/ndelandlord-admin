'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsApi } from '@/lib/api';
import { PaymentAnalytics } from '@/types';
import { PaymentAnalyticsChart } from '@/components/analytics/PaymentAnalyticsChart';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['payment-analytics'],
    queryFn: () => paymentsApi.getAnalytics(),
  });

  const analytics: PaymentAnalytics = analyticsData?.data || {
    totalPayments: 0,
    totalAmount: 0,
    averagePaymentTime: 0,
    paymentsByStatus: [],
    paymentsByProvider: [],
    monthlyTrends: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Visualize and analyze your property management data</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Payment Analytics</span>
          </CardTitle>
          <CardDescription>A comprehensive overview of payment trends and distributions.</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Loading analytics data...</p>
            </div>
          ) : (
            <PaymentAnalyticsChart analytics={analytics} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}