'use client';

import { Lease, Payment, PaymentSchedule } from '@/types';
import { paymentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatUGX } from '@/lib/currency';
import { Info, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface PaymentScheduleTabProps {
  lease: Lease;
  payments: Payment[];
}

export function PaymentScheduleTab({ lease }: PaymentScheduleTabProps) {
  const { data: schedules = [], isLoading, isError } = useQuery<PaymentSchedule[]>({
    queryKey: ['paymentSchedules', lease.id],
    queryFn: async () => {
      const response = await paymentsApi.getPaymentSchedules(lease.id);
      return response.data;
    },
    enabled: !!lease?.id,
  });

  console.log({ schedules })

  if (isLoading) {
    return <div>Loading schedule...</div>;
  }

  if (isError) {
    return <div className="text-red-500">Failed to load payment schedule</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'upcoming': return <Clock className="h-5 w-5 text-gray-400" />;
      case 'partial': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  }

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case 'paid': return ''; // default primary style
      case 'overdue': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      case 'pending': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      default: return 'bg-transparent border-input text-foreground';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule, index) => {
              // Calculate running balance up to and including this row
              const runningBalance = schedule.amount - (schedule.paidAmount || 0);

              return (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.paymentNumber}</TableCell>
                <TableCell>
                  {format(new Date(schedule.dueDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(schedule.status || (schedule.isPaid ? 'paid' : 'pending'))}
                    <Badge className={getStatusBadgeClassName(schedule.status || (schedule.isPaid ? 'paid' : 'pending'))}>
                      {schedule.status ? schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) : (schedule.isPaid ? 'Paid' : 'Pending')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(schedule.periodStart), "dd/MM/yyyy")} - {format(new Date(schedule.periodEnd), "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-right font-medium">{formatUGX(schedule.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {schedule.isPaid ? formatUGX(schedule.amount) : (schedule.paidAmount ? formatUGX(schedule.paidAmount) : '-')}
                </TableCell>
                <TableCell className={`text-right font-medium ${runningBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatUGX(runningBalance)}
                </TableCell>
              </TableRow>
            );
            })}
            {schedules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No payment schedule generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}