'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
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
import { toast } from 'sonner';
import { useEffect } from 'react';

const editTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .transform(val => val === '' ? undefined : val)
    .pipe(z.string().email('Invalid email address').optional()),
  phone: z.string().min(1, 'Phone number is required'),
});

type EditTenantFormData = z.infer<typeof editTenantSchema>;

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string | null;
}

export function EditTenantModal({ isOpen, onClose, tenantId }: EditTenantModalProps) {
  const queryClient = useQueryClient();

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: () => tenantsApi.getTenantDetails(tenantId!),
    enabled: !!tenantId && isOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditTenantFormData>({
    resolver: zodResolver(editTenantSchema),
  });

  useEffect(() => {
    if (tenantData?.data?.tenant) {
      const tenant = tenantData.data.tenant;
      reset({
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email || '',
        phone: tenant.phone || '',
      });
    }
  }, [tenantData, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditTenantFormData) => tenantsApi.update(tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
      toast.success('Tenant updated successfully!');
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to update tenant:', error);
      toast.error(`Failed to update tenant: ${error.response?.data?.message || error.message}`);
    },
  });

  const onSubmit = (data: EditTenantFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!tenantId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Tenant Information</DialogTitle>
          <DialogDescription>
            Update tenant contact details and personal information.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading tenant information...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h4 className="font-semibold text-lg">Tenant Information</h4>
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

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? 'Saving...' : 'Update Tenant'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
