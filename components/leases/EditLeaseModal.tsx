'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leasesApi, tenantsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lease } from '@/types';
import { toast } from 'sonner';

const editLeaseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string()
    .transform(val => val === '' ? undefined : val)
    .pipe(z.string().email('Invalid email address').optional()),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  paymentDay: z.coerce.number().int().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31').default(1),
  status: z.enum(['draft', 'active', 'expiring', 'expired', 'terminated']),
  terms: z.string().optional(),
}).refine((data) => {
  if (!data.endDate) return true;
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
        firstName: lease.tenant?.firstName || '',
        lastName: lease.tenant?.lastName || '',
        phone: lease.tenant?.phone || '',
        email: lease.tenant?.email || '',
        startDate: new Date(lease.startDate).toISOString().split('T')[0],
        endDate: lease.endDate ? new Date(lease.endDate).toISOString().split('T')[0] : '',
        monthlyRent: parseFloat(lease.monthlyRent as any),
        deposit: parseFloat(lease.deposit as any),
        paymentDay: lease.paymentDay || 1,
        status: lease.status,
        terms: lease.terms || '',
      });
    }
  }, [lease, reset]);

  const mutation = useMutation({
    mutationFn: async (data: EditLeaseFormData) => {
      const { firstName, lastName, phone, email, ...leaseFields } = data;

      const leaseData = {
        ...leaseFields,
        startDate: new Date(leaseFields.startDate).toISOString(),
        endDate: leaseFields.endDate ? new Date(leaseFields.endDate).toISOString() : undefined,
        deposit: Number(leaseFields.deposit),
        terms: leaseFields.terms || undefined,
      };

      const tenantData = { firstName, lastName, phone, email };

      await Promise.all([
        leasesApi.update(lease!.id, leaseData),
        tenantsApi.update(lease!.tenantId, tenantData),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lease-details'] });
      toast.success('Lease and tenant updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to update:', error);
      toast.error(`Failed to update: ${error.response?.data?.message || error.message}`);
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
          <DialogTitle>Edit Tenant Information</DialogTitle>
          <DialogDescription>
            Update lease details and tenant information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <h4 className="font-semibold text-lg pt-2">Lease Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Lease Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} disabled />
              {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Lease End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} disabled />
              {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent (UGX)</Label>
              <Input id="monthlyRent" type="number" {...register('monthlyRent')} disabled />
              {errors.monthlyRent && <p className="text-sm text-red-500">{errors.monthlyRent.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (UGX)</Label>
              <Input id="deposit" type="number" {...register('deposit')} />
              {errors.deposit && <p className="text-sm text-red-500">{errors.deposit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDay">Payment Day</Label>
              <Input id="paymentDay" type="number" {...register('paymentDay')} disabled />
              {errors.paymentDay && <p className="text-sm text-red-500">{errors.paymentDay.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Lease Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
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
              <Button type="button" className='bg-red-500'>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
