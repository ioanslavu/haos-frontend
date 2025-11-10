/**
 * Add Artist Modal for Opportunities
 * Allows adding artists with fees and contract details
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useCreateOpportunityArtist } from '@/api/hooks/useOpportunities';
import { toast } from 'sonner';

const artistSchema = z.object({
  artist: z.number({ required_error: 'Artist is required' }),
  role: z.enum(['main', 'featured', 'guest', 'ensemble']),
  proposed_fee: z.string().optional(),
  confirmed_fee: z.string().optional(),
  contract_status: z.enum(['pending', 'sent', 'signed', 'active']),
  notes: z.string().optional(),
});

type ArtistFormData = z.infer<typeof artistSchema>;

const ROLES = [
  { value: 'main', label: 'Main Artist' },
  { value: 'featured', label: 'Featured' },
  { value: 'guest', label: 'Guest' },
  { value: 'ensemble', label: 'Ensemble' },
];

const CONTRACT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
];

interface OpportunityArtistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: number;
}

export function OpportunityArtistModal({ open, onOpenChange, opportunityId }: OpportunityArtistModalProps) {
  const createMutation = useCreateOpportunityArtist();

  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      artist: undefined,
      role: 'main',
      proposed_fee: '',
      confirmed_fee: '',
      contract_status: 'pending',
      notes: '',
    },
  });

  const onSubmit = async (data: ArtistFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        opportunity: opportunityId,
        artist_id: data.artist, // Map to artist_id for API
      });
      onOpenChange(false);
      form.reset();
      toast.success('Artist added successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add artist');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Artist</DialogTitle>
          <DialogDescription>
            Add an artist to this opportunity with fee and contract details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist *</FormLabel>
                  <FormControl>
                    <EntitySearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search artists..."
                      entityType="artist"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACT_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="proposed_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Initial fee proposal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmed_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmed Fee</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Final agreed fee
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this artist's involvement..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Artist
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
