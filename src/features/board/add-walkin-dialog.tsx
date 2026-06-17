import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addWalkInSchema, type AddWalkInInput } from '@/lib/schemas';
import { useAddWalkIn } from '@/features/board/api';
import { getErrorMessage } from '@/utils/errors';

export function AddWalkInDialog({ queueId, businessId }: { queueId: string; businessId: string }) {
  const [open, setOpen] = useState(false);
  const addWalkIn = useAddWalkIn(queueId, businessId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddWalkInInput>({
    resolver: zodResolver(addWalkInSchema),
    defaultValues: { queue_id: queueId, customer_name: '', party_size: 1, phone: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await addWalkIn.mutateAsync(values);
      toast.success('Added to the line');
      reset({ queue_id: queueId, customer_name: '', party_size: 1, phone: '' });
      setOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus aria-hidden /> Add walk-in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Add a walk-in</DialogTitle>
            <DialogDescription>Manually add a customer to the end of the line.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="w-name">Customer name</Label>
              <Input id="w-name" {...register('customer_name')} />
              {errors.customer_name ? (
                <p className="text-destructive text-sm">{errors.customer_name.message}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="w-party">Party size</Label>
                <Input
                  id="w-party"
                  type="number"
                  min={1}
                  max={20}
                  {...register('party_size', { valueAsNumber: true })}
                />
                {errors.party_size ? (
                  <p className="text-destructive text-sm">{errors.party_size.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="w-phone">Phone (optional)</Label>
                <Input id="w-phone" type="tel" {...register('phone')} />
                {errors.phone ? (
                  <p className="text-destructive text-sm">{errors.phone.message}</p>
                ) : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add to line'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
