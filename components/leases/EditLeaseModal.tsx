'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
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
import { Lease } from '@/types';
import { toast } from 'sonner';

const editLeaseSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  paymentDay: z.coerce.number().int().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31').default(1),
  status: z.enum(['draft', 'active', 'expiring', 'expired', 'terminated']),
  terms: z.string().optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type EditLeaseFormData = z.infer<typeof editLeaseSchema>;

interface EditLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: Lease | null;
}

export function EditLeaseModal({ isOpen, onClose, lease }: EditLeaseModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditLeaseFormData>({
    resolver: zodResolver(editLeaseSchema),
  });

  useEffect(() => {
    if (lease) {
      reset({
        ...lease,
        startDate: new Date(lease.startDate).toISOString().split('T')[0],
        endDate: new Date(lease.endDate).toISOString().split('T')[0],
        monthlyRent: parseFloat(lease.monthlyRent as any),
        deposit: parseFloat(lease.deposit as any),
        paymentDay: (lease as any).paymentDay || 1,
      });
    }
  }, [lease, reset]);

  const mutation = useMutation({
    mutationFn: (updatedLease: EditLeaseFormData) =>
      leasesApi.update(lease!.id, updatedLease),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      toast.success('Lease updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to update lease:', error);
      toast.error(`Failed to update lease: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data: EditLeaseFormData) => {
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
          <DialogTitle>Edit Lease</DialogTitle>
          <DialogDescription>
            Update the details for the lease agreement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label htmlFor="paymentDay">Payment Day</Label>
              <Input id="paymentDay" type="number" {...register('paymentDay')} />
              {errors.paymentDay && <p className="text-sm text-red-500">{errors.paymentDay.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Lease Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}