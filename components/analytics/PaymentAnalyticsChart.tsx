'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUGX, formatCompactUGX } from '@/lib/currency';
import { PaymentAnalytics } from '@/types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PaymentAnalyticsChartProps {
  analytics: PaymentAnalytics;
}

const PROVIDER_COLORS = {
  'MTN Mobile Money': '#FFCC00',
  'Airtel Money': '#FF0000',
  'M-Sente': '#FF6600',
  'Other': '#8884d8',
} as const;

const STATUS_COLORS = {
  completed: '#22c55e',
  processing: '#eab308', 
  pending: '#64748b',
  failed: '#ef4444',
  refunded: '#8b5cf6',
} as const;

export function PaymentAnalyticsChart({ analytics }: PaymentAnalyticsChartProps) {
  // Prepare data for monthly trends chart
  const monthlyTrendsData = analytics.monthlyTrends.map((trend) => ({
    ...trend,
    formattedAmount: formatCompactUGX(trend.amount),
  }));

  // Prepare data for provider pie chart
  const providerData = analytics.paymentsByProvider.map((provider) => ({
    name: provider.provider === 'mtn' ? 'MTN Mobile Money' :
          provider.provider === 'airtel' ? 'Airtel Money' :
          provider.provider === 'm-sente' ? 'M-Sente' : 'Other',
    value: provider.amount,
    count: provider.count,
    color: PROVIDER_COLORS[
      provider.provider === 'mtn' ? 'MTN Mobile Money' :
      provider.provider === 'airtel' ? 'Airtel Money' :
      provider.provider === 'm-sente' ? 'M-Sente' : 'Other'
    ],
  }));

  // Prepare data for status bar chart
  const statusData = analytics.paymentsByStatus.map((status) => ({
    status: status.status.charAt(0).toUpperCase() + status.status.slice(1),
    count: status.count,
    amount: status.amount,
    fill: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] || '#8884d8',
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'totalAmount' 
                ? `Amount: ${formatUGX(entry.value)}`
                : `${entry.dataKey}: ${entry.value}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p>{formatUGX(data.value)}</p>
          <p className="text-sm text-gray-500">{data.count} payments</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trends Line Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Payment Trends</CardTitle>
          <CardDescription>Payment volume and amount over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCompactUGX(value)}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  yAxisId="left"
                  dataKey="totalAmount" 
                  fill="#3b82f6" 
                  name="Amount"
                  opacity={0.7}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="totalPayments" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Distribution</CardTitle>
          <CardDescription>Number of payments by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p style={{ color: payload[0].color }}>
                            Count: {payload[0].value}
                          </p>
                          <p style={{ color: payload[0].color }}>
                            Amount: {formatUGX(payload[0].payload.amount)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Provider Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Distribution</CardTitle>
          <CardDescription>Payment amounts by mobile money provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {providerData.map((provider, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: provider.color }}
                />
                <span className="text-sm">{provider.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}