import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState, LoadingGrid } from '@/components/states';
import {
  useMembers,
  useMyRole,
  useRemoveMember,
  useUpdateMemberRole,
  type Member,
} from '@/features/business/api';
import { ROLES, isAdminRole } from '@/types/domain';
import { getErrorMessage } from '@/utils/errors';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function MembersPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const id = businessId!;
  const { userId } = useAuth();
  const { data, isLoading, isError, error, refetch } = useMembers(id);
  const updateRole = useUpdateMemberRole(id);
  const removeMember = useRemoveMember(id);
  const myRole = useMyRole(id);
  const canAdmin = isAdminRole(myRole);

  const changeRole = async (memberId: string, role: Member['role']) => {
    try {
      await updateRole.mutateAsync({ memberId, role });
      toast.success('Role updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from this business?`)) return;
    try {
      await removeMember.mutateAsync(memberId);
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="size-4" aria-hidden /> Staff &amp; roles
        </CardTitle>
        <CardDescription>
          Owners and managers can manage staff. Invite-by-email arrives with the customer release.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <LoadingGrid count={2} /> : null}
        {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
        {data?.map((m) => {
          const name = m.profile?.display_name ?? 'Member';
          const isSelf = m.user_id === userId;
          const isOwner = m.role === 'owner';
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} alt="" /> : null}
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {name} {isSelf ? <span className="text-muted-foreground">(you)</span> : null}
                  </p>
                  <p className="text-muted-foreground text-sm">{m.profile?.email ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canAdmin && !isOwner && !isSelf ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => void changeRole(m.id, v as Member['role'])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.filter((r) => r !== 'owner').map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={isOwner ? 'default' : 'secondary'}>{m.role}</Badge>
                )}
                {canAdmin && !isOwner && !isSelf ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${name}`}
                    onClick={() => void remove(m.id, name)}
                  >
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
