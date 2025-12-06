'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';

const addUnitSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms must be non-negative'),
  bathrooms: z.coerce.number().min(0, 'Bathrooms must be non-negative'),
  squareFeet: z.coerce.number().int().positive('Square feet must be positive').optional(),
  description: z.string().optional(),
});

const bulkAddUnitSchema = z.object({
  propertyId: z.string().uuid('Please select a property'),
  units: z.array(z.object({
    unitNumber: z.string().min(1, 'Required'),
    bedrooms: z.coerce.number().int().min(0, 'Min 0'),
    bathrooms: z.coerce.number().min(0, 'Min 0'),
    squareFeet: z.coerce.number().int().positive('Positive').optional(),
    description: z.string().optional(),
  })).min(1, 'At least one unit is required'),
});

type AddUnitFormData = z.infer<typeof addUnitSchema>;
type BulkAddUnitFormData = z.infer<typeof bulkAddUnitSchema>;

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUnitModal({ isOpen, onClose }: AddUnitModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('single');

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: () => propertiesApi.getAll(),
    enabled: !!user,
  });
  const properties: Property[] = propertiesData?.data || [];

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Unit</DialogTitle>
          <DialogDescription>
            Add a single unit or multiple units at once.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Unit</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <SingleUnitForm
              properties={properties}
              loading={propertiesLoading}
              onSuccess={handleClose}
              userId={user?.id}
            />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkUnitForm
              properties={properties}
              loading={propertiesLoading}
              onSuccess={handleClose}
              userId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SingleUnitForm({ properties, loading, onSuccess, userId }: { properties: Property[], loading: boolean, onSuccess: () => void, userId?: string }) {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success('Unit added successfully!');
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add unit:', error);
      toast.error('Failed to add unit.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="propertyId">Property</Label>
        <Controller
          name="propertyId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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
        <Input id="unitNumber" {...register('unitNumber')} placeholder="e.g. 101, A1" />
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
        <Label htmlFor="squareFeet">Square Feet (Optional)</Label>
        <Input id="squareFeet" type="number" {...register('squareFeet')} />
        {errors.squareFeet && <p className="text-sm text-red-500">{errors.squareFeet.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input id="description" {...register('description')} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
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
  );
}

function BulkUnitForm({ properties, loading, onSuccess, userId }: { properties: Property[], loading: boolean, onSuccess: () => void, userId?: string }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BulkAddUnitFormData>({
    resolver: zodResolver(bulkAddUnitSchema),
    defaultValues: {
      units: [{ unitNumber: '', bedrooms: 1, bathrooms: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units"
  });

  const mutation = useMutation({
    mutationFn: (data: BulkAddUnitFormData) => unitsApi.createBulk(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['units', userId] });
      toast.success(`Successfully added ${response.data.created.length} units.`);
      if (response.data.failed.length > 0) {
        toast.warning(`${response.data.failed.length} units were skipped (duplicates).`);
      }
      reset();
      onSuccess();
    },
    onError: (error) => {
      console.error('Failed to add units:', error);
      toast.error('Failed to add units.');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="bulkPropertyId">Property</Label>
        <Controller
          name="propertyId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
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
        <div className="flex justify-between items-center">
          <Label>Units List</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ unitNumber: '', bedrooms: 1, bathrooms: 1 })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Row
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Unit #</th>
                <th className="p-2 text-left">Bed</th>
                <th className="p-2 text-left">Bath</th>
                <th className="p-2 text-left">Sq Ft</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="p-2">
                    <Input
                      {...register(`units.${index}.unitNumber`)}
                      placeholder="e.g. 101"
                      className={errors.units?.[index]?.unitNumber ? "border-red-500" : ""}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      {...register(`units.${index}.bedrooms`)}
                      className="w-16"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.5"
                      {...register(`units.${index}.bathrooms`)}
                      className="w-16"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      {...register(`units.${index}.squareFeet`)}
                      placeholder="Opt"
                      className="w-20"
                    />
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Click "Add Row" to add another unit. Duplicate unit numbers for the same property will be skipped.
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add All Units'}
        </Button>
      </DialogFooter>
    </form>
  );
}