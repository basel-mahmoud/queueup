import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { joinQueueSchema, type JoinQueueInput } from '@/lib/schemas';
import { getErrorMessage, isRateLimitError } from '@/utils/errors';
import { useJoinQueue, type PublicQueue } from '@/features/customer/api';

export function tokenStorageKey(slug: string): string {
  return `queueup:token:${slug}`;
}

export function JoinForm({
  slug,
  queues,
  onJoined,
}: {
  slug: string;
  queues: PublicQueue[];
  onJoined: (token: string) => void;
}) {
  const join = useJoinQueue();
  const firstQueueId = queues[0]?.id ?? '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JoinQueueInput>({
    resolver: zodResolver(joinQueueSchema),
    defaultValues: { queue_id: firstQueueId, customer_name: '', party_size: 1, phone: '' },
  });

  const selectedQueue = watch('queue_id');

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await join.mutateAsync(values);
      localStorage.setItem(tokenStorageKey(slug), result.join_token);
      onJoined(result.join_token);
    } catch (err) {
      toast.error(
        isRateLimitError(err)
          ? 'You’re going a bit fast — please try again shortly.'
          : getErrorMessage(err),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {queues.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="q">Which line?</Label>
          <Select value={selectedQueue} onValueChange={(v) => setValue('queue_id', v)}>
            <SelectTrigger id="q">
              <SelectValue placeholder="Choose a queue" />
            </SelectTrigger>
            <SelectContent>
              {queues.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" autoComplete="name" {...register('customer_name')} />
        {errors.customer_name ? (
          <p className="text-destructive text-sm">{errors.customer_name.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="party">Party size</Label>
          <Input
            id="party"
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
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register('phone')} />
          {errors.phone ? <p className="text-destructive text-sm">{errors.phone.message}</p> : null}
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !selectedQueue}>
        {isSubmitting ? 'Joining…' : 'Join the line'}
      </Button>
    </form>
  );
}
