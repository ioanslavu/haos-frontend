import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountrySelect } from './CountrySelect';
import { ArtistMultiSelect } from './ArtistMultiSelect';
import { useCreativeArtists } from '@/api/hooks/useCamps';
import { CampStudio, StudioFormData } from '@/types/camps';

const studioFormSchema = z.object({
  name: z.string().min(1, 'Studio name is required'),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  hours: z.coerce.number().positive().optional().nullable(),
  sessions: z.coerce.number().int().positive().optional().nullable(),
  artist_ids: z.array(z.number()).optional(),
});

type StudioFormValues = z.infer<typeof studioFormSchema>;

interface StudioFormProps {
  studio?: CampStudio;
  onSubmit: (data: StudioFormData) => void;
  onCancel: () => void;
}

export function StudioForm({ studio, onSubmit, onCancel }: StudioFormProps) {
  const { data: artists = [] } = useCreativeArtists();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<StudioFormValues>({
    resolver: zodResolver(studioFormSchema),
    defaultValues: {
      name: studio?.name || '',
      location: studio?.location || '',
      city: studio?.city || '',
      country: studio?.country || 'Romania',
      hours: studio?.hours || null,
      sessions: studio?.sessions || null,
      artist_ids: [
        ...(studio?.internal_artists?.map((a) => a.id) || []),
        ...(studio?.external_artists?.map((a) => a.id) || [])
      ],
    },
  });

  const country = watch('country');
  const artist_ids = watch('artist_ids') || [];

  const handleFormSubmit = (data: StudioFormValues) => {
    onSubmit({
      ...data,
      hours: data.hours || null,
      sessions: data.sessions || null,
      internal_artist_ids: data.artist_ids || [],
      external_artist_ids: [],
    });
  };

  return (
    <div className="relative rounded-xl border border-border/40 bg-card/50 backdrop-blur-md shadow-xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-6">
        {/* Studio Name - Full Width */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Studio Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Studio A"
            {...register('name')}
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Location Row - 3 columns */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 space-y-1.5">
            <Label htmlFor="location" className="text-sm">Address</Label>
            <Input
              id="location"
              placeholder="Abbey Road Studios"
              {...register('location')}
            />
          </div>

          <div className="col-span-3 space-y-1.5">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              placeholder="Bucharest"
              {...register('city')}
            />
          </div>

          <div className="col-span-3 space-y-1.5">
            <Label htmlFor="country" className="text-sm">Country</Label>
            <CountrySelect
              value={country}
              onValueChange={(value) => setValue('country', value)}
            />
          </div>
        </div>

        {/* Schedule Row - 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="hours" className="text-sm">Hours</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              placeholder="8.5"
              {...register('hours')}
            />
            {errors.hours && (
              <p className="text-xs text-destructive">{errors.hours.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sessions" className="text-sm">Sessions</Label>
            <Input
              id="sessions"
              type="number"
              placeholder="3"
              {...register('sessions')}
            />
            {errors.sessions && (
              <p className="text-xs text-destructive">{errors.sessions.message}</p>
            )}
          </div>
        </div>

        {/* Artists - Full Width */}
        <div className="space-y-1.5">
          <Label className="text-sm">Artists</Label>
          <ArtistMultiSelect
            artists={artists}
            selectedIds={artist_ids}
            onSelectionChange={(ids) => setValue('artist_ids', ids)}
            placeholder="Select artists..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            size="sm"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Saving...' : studio ? 'Update' : 'Add Studio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
