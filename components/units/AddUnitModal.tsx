'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { propertiesApi, unitsApi } from '@/lib/api';
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
import { Property } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const addUnitSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be non-negative'),
  squareFeet: z.coerce.number().int().positive('Square feet must be positive').optional(),
  monthlyRent: z.coerce.number().positive('Monthly rent must be positive'),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  description: z.string().optional(),
});

type AddUnitFormData = z.infer<typeof addUnitSchema>;

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUnitModal({ isOpen, onClose }: AddUnitModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });
  const properties: Property[] = propertiesData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddUnitFormData>({
    resolver: zodResolver(addUnitSchema),
  });

  const mutation = useMutation({
    mutationFn: (newUnit: AddUnitFormData) => unitsApi.create(newUnit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', user?.id] });
      toast.success('Unit added successfully!');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to add unit:', error);
      toast.error('Failed to add unit.');
    },
  });

  const onSubmit = (data: AddUnitFormData) => {
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
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new unit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyId">Property</Label>
            <Controller
              name="propertyId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={propertiesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.propertyId && <p className="text-sm text-red-500">{errors.propertyId.message}</p>}
          </div>

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

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}