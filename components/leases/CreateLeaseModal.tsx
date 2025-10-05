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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TenantWithFullDetails } from '@/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { formatUGX } from '@/lib/currency';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const createLeaseSchema = z
  .object({
    unitId: z.string().uuid('Please select a unit'),
    tenantId: z.string().uuid('Please select a tenant'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date',
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date',
    }),
    monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
    deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
    paymentDay: z.coerce.number().int().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31').default(1),
    terms: z.string().optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

type CreateLeaseFormData = z.infer<typeof createLeaseSchema>;

interface CreateLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLeaseModal({ isOpen, onClose }: CreateLeaseModalProps) {
  const queryClient = useQueryClient();
  const [proratedFirstMonth, setProratedFirstMonth] = useState<number | null>(
    null
  );
  const [proratedLastMonth, setProratedLastMonth] = useState<number | null>(
    null
  );

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
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateLeaseFormData>({
    resolver: zodResolver(createLeaseSchema),
  });

  const watchAllFields = watch();

  useEffect(() => {
    const calculateProration = () => {
      const { startDate, endDate, monthlyRent } = watchAllFields;
      if (startDate && endDate && monthlyRent > 0) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          // Prorate first month
          const daysInStartMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          const daysRemaining = daysInStartMonth - start.getDate() + 1;
          setProratedFirstMonth((daysRemaining / daysInStartMonth) * monthlyRent);

          // Prorate last month
          const daysInEndMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
          const daysUsed = end.getDate();
          setProratedLastMonth((daysUsed / daysInEndMonth) * monthlyRent);
        }
      } else {
        setProratedFirstMonth(null);
        setProratedLastMonth(null);
      }
    };
    calculateProration();
  }, [watchAllFields]);


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
      toast.error(`Failed to create lease: ${error.response?.data?.message || error.message}`);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitId">Unit</Label>
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={unitsLoading}
                  >
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
              {errors.unitId && (
                <p className="text-sm text-red-500">{errors.unitId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant</Label>
              <Controller
                name="tenantId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={tenantsLoading}
                  >
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
              {errors.tenantId && (
                <p className="text-sm text-red-500">
                  {errors.tenantId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Lease Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Lease End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent (UGX)</Label>
              <Input
                id="monthlyRent"
                type="number"
                {...register('monthlyRent')}
              />
              {errors.monthlyRent && (
                <p className="text-sm text-red-500">
                  {errors.monthlyRent.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (UGX)</Label>
              <Input id="deposit" type="number" {...register('deposit')} />
              {errors.deposit && (
                <p className="text-sm text-red-500">
                  {errors.deposit.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDay">Payment Day</Label>
              <Input id="paymentDay" type="number" {...register('paymentDay')} defaultValue={1} />
              {errors.paymentDay && (
                <p className="text-sm text-red-500">
                  {errors.paymentDay.message}
                </p>
              )}
            </div>
          </div>
          {proratedFirstMonth !== null && proratedLastMonth !== null && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Proration Preview</AlertTitle>
              <AlertDescription>
                <p>
                  First month&apos;s prorated rent:{' '}
                  <strong>{formatUGX(proratedFirstMonth)}</strong>
                </p>
                <p>
                  Last month&apos;s prorated rent:{' '}
                  <strong>{formatUGX(proratedLastMonth)}</strong>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="terms">Lease Terms (Optional)</Label>
            <textarea
              id="terms"
              className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter any special terms or conditions for this lease..."
              {...register('terms')}
            />
            <p className="text-xs text-muted-foreground">
              Include any special conditions, restrictions, or additional
              terms for this lease agreement.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
            >
              {isSubmitting || mutation.isPending
                ? 'Saving...'
                : 'Create Lease'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}