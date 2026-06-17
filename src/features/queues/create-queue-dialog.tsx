import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Label } from '@/components/ui/label';
import { queueCreateSchema, type QueueCreateInput } from '@/lib/schemas';
import { DEFAULT_AVG_SERVICE_MINUTES } from '@/lib/constants';
import { useCreateQueue } from '@/features/queues/api';
import { getErrorMessage } from '@/utils/errors';

export function CreateQueueDialog({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const createQueue = useCreateQueue(businessId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QueueCreateInput>({
    resolver: zodResolver(queueCreateSchema),
    defaultValues: { name: '', avg_service_minutes: DEFAULT_AVG_SERVICE_MINUTES },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createQueue.mutateAsync(values);
      toast.success('Queue created');
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden /> New queue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Create a queue</DialogTitle>
            <DialogDescription>
              Give it a name and a rough service time to estimate waits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="queue-name">Queue name</Label>
              <Input id="queue-name" placeholder="Haircut" {...register('name')} />
              {errors.name ? (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avg">Average service time (minutes)</Label>
              <Input
                id="avg"
                type="number"
                min={1}
                max={480}
                {...register('avg_service_minutes', { valueAsNumber: true })}
              />
              {errors.avg_service_minutes ? (
                <p className="text-destructive text-sm">{errors.avg_service_minutes.message}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create queue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
