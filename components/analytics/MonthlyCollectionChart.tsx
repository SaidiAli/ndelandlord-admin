'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUGX } from '@/lib/currency';
import { Payment } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyCollectionChartProps {
  payments: Payment[];
}

export function MonthlyCollectionChart({ payments }: MonthlyCollectionChartProps) {
  const monthlyData: { [key: string]: { collected: number; pending: number } } = {};

  payments.forEach((payment) => {
    const month = new Date(payment.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { collected: 0, pending: 0 };
    }
    if (payment.status === 'completed') {
      monthlyData[month].collected += payment.amount;
    } else {
      monthlyData[month].pending += payment.amount;
    }
  });

  const chartData = Object.keys(monthlyData).map(month => ({
    month,
    collected: monthlyData[month].collected,
    pending: monthlyData[month].pending,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Collection Report</CardTitle>
        <CardDescription>Collected vs. pending payments each month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatUGX(value as number)} />
              <Tooltip formatter={(value) => formatUGX(value as number)} />
              <Bar dataKey="collected" fill="#739BA4" name="Collected" />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}