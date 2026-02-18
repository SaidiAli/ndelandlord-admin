'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { capitalize } from 'lodash';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { propertyTypes } from '@/types';

const addPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().optional(),
  type: z.enum(propertyTypes).optional(),
  numberOfUnits: z.number().int().optional(),
});


type AddPropertyFormData = z.infer<typeof addPropertySchema>;

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPropertyModal({ isOpen, onClose }: AddPropertyModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<AddPropertyFormData>({
    resolver: zodResolver(addPropertySchema),
  });

  const mutation = useMutation({
    mutationFn: (newProperty: AddPropertyFormData) => propertiesApi.create(newProperty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', user?.id] });
      toast.success('Property added successfully!');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to add property:', error);
      toast.error('Failed to add property.');
    },
  });

  const onSubmit = (data: AddPropertyFormData) => {
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
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new property to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
          </div>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code <span className="text-gray-500 text-xs">(Optional)</span></Label>
            <Input id="postalCode" {...register('postalCode')} />
            {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type Of Property <span className="text-gray-500 text-xs">(Optional)</span></Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {capitalize(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="numberOfUnits">Number of Units <span className="text-gray-500 text-xs">(Optional)</span></Label>
            <Input id="numberOfUnits" {...register('numberOfUnits', { valueAsNumber: true })} type="number" min={0} />
            {errors.numberOfUnits && <p className="text-sm text-red-500">{errors.numberOfUnits.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}