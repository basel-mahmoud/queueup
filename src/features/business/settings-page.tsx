import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/states';
import { QrPanel } from '@/features/business/qr-panel';
import { useBusiness, useMyRole, useUpdateBusiness } from '@/features/business/api';
import { businessUpdateSchema, type BusinessUpdateInput } from '@/lib/schemas';
import { isAdminRole } from '@/types/domain';
import { getErrorMessage } from '@/utils/errors';

export function SettingsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const id = businessId!;
  const { data: business, isLoading, isError, error, refetch } = useBusiness(id);
  const updateBusiness = useUpdateBusiness(id);
  const role = useMyRole(id);
  const canAdmin = isAdminRole(role);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessUpdateInput>({
    resolver: zodResolver(businessUpdateSchema),
  });

  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        description: business.description ?? '',
        slug: business.slug,
      });
    }
  }, [business, reset]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!business) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateBusiness.mutateAsync(values);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  });

  const toggleActive = async () => {
    try {
      await updateBusiness.mutateAsync({ is_active: !business.is_active });
      toast.success(business.is_active ? 'Business archived' : 'Business reactivated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>
            {canAdmin ? 'Update your storefront info.' : 'Only admins can edit these.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="s-name">Name</Label>
              <Input id="s-name" disabled={!canAdmin} {...register('name')} />
              {errors.name ? (
                <p className="text-destructive text-sm">{errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-slug">Public slug</Label>
              <Input id="s-slug" disabled={!canAdmin} {...register('slug')} />
              <p className="text-muted-foreground text-xs">Used in your link: /q/your-slug</p>
              {errors.slug ? (
                <p className="text-destructive text-sm">{errors.slug.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea id="s-desc" disabled={!canAdmin} {...register('description')} />
              {errors.description ? (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              ) : null}
            </div>
            {canAdmin ? (
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <QrPanel slug={business.slug} />

        {canAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Archiving hides the public join page and closes the storefront.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant={business.is_active ? 'success' : 'secondary'}>
                {business.is_active ? 'Active' : 'Archived'}
              </Badge>
              <Button
                variant={business.is_active ? 'outline' : 'default'}
                onClick={() => void toggleActive()}
              >
                {business.is_active ? 'Archive' : 'Reactivate'}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
