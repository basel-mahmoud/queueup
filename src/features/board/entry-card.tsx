import { Clock, Phone, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Entry } from '@/features/board/api';
import type { EntryStatus } from '@/types/domain';

function waitedMinutes(createdAt: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
}

interface Action {
  label: string;
  status: EntryStatus;
  variant?: 'default' | 'outline' | 'success' | 'destructive' | 'secondary';
}

/** Next-step actions per status — keeps the staff flow obvious. */
function actionsFor(status: EntryStatus): Action[] {
  switch (status) {
    case 'waiting':
      return [
        { label: 'Call', status: 'called', variant: 'default' },
        { label: 'No-show', status: 'no_show', variant: 'outline' },
      ];
    case 'called':
      return [
        { label: 'Start serving', status: 'serving', variant: 'default' },
        { label: 'No-show', status: 'no_show', variant: 'outline' },
      ];
    case 'serving':
      return [{ label: 'Done', status: 'served', variant: 'success' }];
    default:
      return [];
  }
}

export function EntryCard({
  entry,
  disabled,
  onAction,
}: {
  entry: Entry;
  disabled?: boolean;
  onAction: (status: EntryStatus) => void;
}) {
  const actions = actionsFor(entry.status);
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{entry.customer_name}</p>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Users className="size-3" aria-hidden /> {entry.party_size}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" aria-hidden /> {waitedMinutes(entry.created_at)}m
              </span>
              {entry.customer_phone ? (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" aria-hidden /> {entry.customer_phone}
                </span>
              ) : null}
            </div>
          </div>
          <Badge variant="secondary">#{entry.position}</Badge>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {actions.map((a) => (
              <Button
                key={a.label}
                size="sm"
                variant={a.variant ?? 'default'}
                disabled={disabled}
                onClick={() => onAction(a.status)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
