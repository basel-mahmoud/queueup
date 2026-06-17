import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { businessCreateSchema, type BusinessCreateInput } from '@/lib/schemas';
import { useCreateBusiness } from '@/features/business/api';
import { getErrorMessage } from '@/utils/errors';

export function CreateBusinessDialog({ triggerLabel = 'New business' }: { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const createBusiness = useCreateBusiness();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BusinessCreateInput>({
    resolver: zodResolver(businessCreateSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const business = await createBusiness.mutateAsync(values);
      toast.success('Business created');
      setOpen(false);
      reset();
      navigate(`/app/b/${business.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Create a business</DialogTitle>
            <DialogDescription>
              You’ll be the owner. Add queues and invite staff next.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input id="name" placeholder="Snip & Style Barbers" {...register('name')} />
              {errors.name ? (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Walk-in friendly neighborhood barbershop."
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create business'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
