'use client';

import { useState, useEffect } from 'react';
import { Lease, Payment, PaymentSchedule } from '@/types';
import { paymentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatUGX } from '@/lib/currency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentScheduleTabProps {
  lease: Lease;
  payments: Payment[];
}

export function PaymentScheduleTab({ lease, payments }: PaymentScheduleTabProps) {
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!lease?.id) return;
      try {
        setLoading(true);
        const response = await paymentsApi.getPaymentSchedules(lease.id);
        if (response.success) {
          setSchedules(response.data);
        } else {
          setError('Failed to load payment schedule');
        }
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError('Error loading schedules');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [lease?.id]);

  if (loading) {
    return <div>Loading schedule...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
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
                  {new Date(schedule.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(schedule.status || (schedule.isPaid ? 'paid' : 'pending'))}
                    {/* The backend returns a calculated 'status' field now */}
                    <Badge className={getStatusBadgeClassName(schedule.status || (schedule.isPaid ? 'paid' : 'pending'))}>
                      {schedule.status ? schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1) : (schedule.isPaid ? 'Paid' : 'Pending')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(schedule.periodStart).toLocaleDateString()} - {new Date(schedule.periodEnd).toLocaleDateString()}
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