'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitsApi } from '@/lib/api';
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
import { Unit } from '@/types';
import { toast } from 'sonner';

const editUnitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be non-negative'),
  squareFeet: z.coerce.number().int().positive('Square feet must be positive').optional(),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  isAvailable: z.boolean(),
  description: z.string().optional(),
});

type EditUnitFormData = z.infer<typeof editUnitSchema>;

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
}

export function EditUnitModal({ isOpen, onClose, unit }: EditUnitModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUnitFormData>({
    resolver: zodResolver(editUnitSchema),
  });
  
  useEffect(() => {
    if (unit) {
      reset({
          ...unit,
          bathrooms: parseFloat(unit.bathrooms as any),
          monthlyRent: parseFloat(unit.monthlyRent as any),
          deposit: parseFloat(unit.deposit as any),
      });
    }
  }, [unit, reset]);


  const mutation = useMutation({
    mutationFn: (updatedUnit: EditUnitFormData) =>
      unitsApi.update(unit!.id, updatedUnit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['property-details', unit?.propertyId] });
      toast.success('Unit updated successfully!');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to update unit:', error);
      toast.error('Failed to update unit.');
    },
  });

  const onSubmit = (data: EditUnitFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Unit {unit?.unitNumber}</DialogTitle>
          <DialogDescription>
            Update the details for this unit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit Number</Label>
            <Input id="unitNumber" {...register('unitNumber')} />
            {errors.unitNumber && <p className="text-sm text-red-500">{errors.unitNumber.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" {...register('bedrooms')} />
              {errors.bedrooms && <p className="text-sm text-red-500">{errors.bedrooms.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" step="0.5" {...register('bathrooms')} />
              {errors.bathrooms && <p className="text-sm text-red-500">{errors.bathrooms.message}</p>}
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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