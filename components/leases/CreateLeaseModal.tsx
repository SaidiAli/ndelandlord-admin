'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unitsApi, leasesApi, tenantsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TenantWithFullDetails, Unit, User } from '@/types';
import { toast } from 'sonner';
import { formatUGX } from '@/lib/currency';
import { Calendar, Clock } from 'lucide-react';

const createLeaseSchema = z.object({
  unitId: z.string().uuid('Please select a unit'),
  tenantId: z.string().uuid('Please select a tenant'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  paymentDay: z.coerce.number().min(1, 'Payment day must be between 1-31').max(31, 'Payment day must be between 1-31'),
  terms: z.string().optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CreateLeaseFormData = z.infer<typeof createLeaseSchema>;

interface CreateLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLeaseModal({ isOpen, onClose }: CreateLeaseModalProps) {
  const queryClient = useQueryClient();

  const { data: unitsData, isLoading: unitsLoading } = useQuery({
    queryKey: ['available-units'],
    queryFn: () => unitsApi.getAvailable(),
  });
  const availableUnits: any[] = unitsData?.data || [];

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
  });
  const tenants: TenantWithFullDetails[] = tenantsData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateLeaseFormData>({
    resolver: zodResolver(createLeaseSchema),
    defaultValues: {
      paymentDay: 1, // Default to 1st of the month
    },
  });

  // Watch form values for preview
  const watchedValues = watch();

  // Calculate payment schedule preview
  const calculatePaymentPreview = () => {
    const { startDate, endDate, monthlyRent, paymentDay } = watchedValues;
    
    if (!startDate || !endDate || !monthlyRent || !paymentDay) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const rent = Number(monthlyRent);
    const payDay = Number(paymentDay);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || rent <= 0 || payDay < 1 || payDay > 31) {
      return [];
    }

    const payments = [];
    let currentDate = new Date(start);
    let paymentNumber = 1;

    while (currentDate <= end) {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), payDay);
      
      // If payment day has passed for this month, move to next month
      if (dueDate < currentDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      // Stop if due date exceeds lease end
      if (dueDate > end) break;

      payments.push({
        number: paymentNumber,
        dueDate: dueDate.toLocaleDateString(),
        amount: rent,
      });

      paymentNumber++;
      currentDate = new Date(dueDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return payments.slice(0, 5); // Show first 5 payments
  };

  const paymentPreview = calculatePaymentPreview();

  const mutation = useMutation({
    mutationFn: (newLease: CreateLeaseFormData) => leasesApi.create(newLease),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
       queryClient.invalidateQueries({ queryKey: ['available-units'] });
      toast.success('Lease created successfully!');
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create lease:', error);
      
      // Extract specific error message from backend
      let errorMessage = 'Failed to create lease';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle common validation errors with more user-friendly messages
      if (errorMessage.includes('End date must be after start date')) {
        errorMessage = 'The lease end date must be after the start date. Please check your dates.';
      } else if (errorMessage.includes('Invalid start date') || errorMessage.includes('Invalid end date') || errorMessage.includes('Invalid start date format') || errorMessage.includes('Invalid end date format')) {
        errorMessage = 'Please enter valid dates for the lease period.';
      } else if (errorMessage.includes('overlaps with existing')) {
        errorMessage = 'This lease period conflicts with an existing lease for this unit. Please choose different dates.';
      } else if (errorMessage.includes('Unit already has an active lease')) {
        errorMessage = 'This unit already has an active lease. Please select a different unit or terminate the existing lease first.';
      } else if (errorMessage.includes('Invalid unit ID')) {
        errorMessage = 'Please select a valid unit from the dropdown.';
      } else if (errorMessage.includes('Invalid tenant ID')) {
        errorMessage = 'Please select a valid tenant from the dropdown.';
      }
      
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: CreateLeaseFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Lease</DialogTitle>
          <DialogDescription>
            Assign a tenant to a unit by creating a new lease agreement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="unitId">Unit</Label>
             <Controller
              name="unitId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={unitsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an available unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.property.name} - Unit {item.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unitId && <p className="text-sm text-red-500">{errors.unitId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant</Label>
             <Controller
              name="tenantId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={tenantsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.tenant.id} value={t.tenant.id}>
                        {t.tenant.firstName} {t.tenant.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tenantId && <p className="text-sm text-red-500">{errors.tenantId.message}</p>}
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="startDate">Lease Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="endDate">Lease End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent (UGX)</Label>
              <Input id="monthlyRent" type="number" {...register('monthlyRent')} />
              {errors.monthlyRent && <p className="text-sm text-red-500">{errors.monthlyRent.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (UGX)</Label>
              <Input id="deposit" type="number" {...register('deposit')} />
              {errors.deposit && <p className="text-sm text-red-500">{errors.deposit.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="paymentDay">Payment Day of Month</Label>
              <Input 
                id="paymentDay" 
                type="number" 
                min="1" 
                max="31" 
                placeholder="e.g., 1, 15, 30"
                {...register('paymentDay')} 
              />
              {errors.paymentDay && <p className="text-sm text-red-500">{errors.paymentDay.message}</p>}
              <p className="text-xs text-gray-500">Day of month when rent is due (1-31)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Lease Terms (Optional)</Label>
            <textarea
              id="terms"
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter any special terms or conditions for this lease..."
              {...register('terms')}
            />
            <p className="text-xs text-gray-500">
              Include any special conditions, restrictions, or additional terms for this lease agreement.
            </p>
          </div>

          {/* Payment Schedule Preview */}
          {paymentPreview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Payment Schedule Preview
                </CardTitle>
                <CardDescription>
                  First {paymentPreview.length} payments based on your lease terms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paymentPreview.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">Payment {payment.number}</Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          Due: {payment.dueDate}
                        </div>
                      </div>
                      <div className="font-semibold text-green-600">
                        {formatUGX(payment.amount)}
                      </div>
                    </div>
                  ))}
                  {calculatePaymentPreview().length > 5 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      ... and {calculatePaymentPreview().length - 5} more payments
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Saving...' : 'Create Lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}