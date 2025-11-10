/**
 * Quick Create Modal - Fast opportunity creation with essential fields only
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useCreateOpportunity } from '@/api/hooks/useOpportunities';
import { useAuthStore } from '@/stores/authStore';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import type { OpportunityStage } from '@/types/opportunities';
import { STAGE_CONFIG } from '@/types/opportunities';
import { toast } from 'sonner';
import { useState } from 'react';

const quickCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  account: z.number({ required_error: 'Account is required' }),
  owner: z.number({ required_error: 'Owner is required' }),
  stage: z.string().optional(),
  estimated_value: z.string().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
});

type QuickCreateFormData = z.infer<typeof quickCreateSchema>;

const QUICK_STAGES: { value: OpportunityStage; label: string; emoji: string }[] = [
  { value: 'brief', label: STAGE_CONFIG.brief.label, emoji: STAGE_CONFIG.brief.emoji },
  { value: 'qualified', label: STAGE_CONFIG.qualified.label, emoji: STAGE_CONFIG.qualified.emoji },
  { value: 'shortlist', label: STAGE_CONFIG.shortlist.label, emoji: STAGE_CONFIG.shortlist.emoji },
  { value: 'proposal_draft', label: STAGE_CONFIG.proposal_draft.label, emoji: STAGE_CONFIG.proposal_draft.emoji },
];

interface QuickCreateModalProps {
  defaultStage?: OpportunityStage;
}

export function QuickCreateModal({ defaultStage = 'brief' }: QuickCreateModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const { data: departmentUsers } = useDepartmentUsers(user?.department?.id);
  const createMutation = useCreateOpportunity();

  const form = useForm<QuickCreateFormData>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      title: '',
      account: undefined,
      owner: user?.id || undefined,
      stage: defaultStage,
      estimated_value: '',
      expected_close_date: '',
    },
  });

  const onSubmit = async (data: QuickCreateFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        priority: 'medium',
        currency: 'EUR',
      });
      setOpen(false);
      form.reset();
      toast.success('Opportunity created successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create opportunity');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Quick Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Create Opportunity</DialogTitle>
          <DialogDescription>
            Create a new opportunity with essential information. You can add more details later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Nike Summer Campaign 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account *</FormLabel>
                  <FormControl>
                    <EntitySearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search accounts..."
                      entityType="brand"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUICK_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            <span className="flex items-center gap-2">
                              <span>{stage.emoji}</span>
                              <span>{stage.label}</span>
                            </span>
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
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner *</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentUsers?.results?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.full_name}
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
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Value (EUR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Opportunity
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
