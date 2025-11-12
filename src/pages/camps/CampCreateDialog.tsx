import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateCamp } from '@/api/hooks/useCamps';

const campFormSchema = z.object({
  name: z.string().min(1, 'Camp name is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine((data) => {
  // Validate end_date >= start_date if both provided
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

type CampFormValues = z.infer<typeof campFormSchema>;

interface CampCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampCreateDialog({ open, onOpenChange }: CampCreateDialogProps) {
  const navigate = useNavigate();
  const createCamp = useCreateCamp();

  const form = useForm<CampFormValues>({
    resolver: zodResolver(campFormSchema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
    },
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (values: CampFormValues) => {
    try {
      const payload = {
        name: values.name,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        status: 'draft' as const,
      };

      const response = await createCamp.mutateAsync(payload);

      form.reset();
      onOpenChange(false);

      // Navigate to camp detail page
      if (response?.data?.id) {
        navigate(`/camps/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create camp:', error);
    }
  };

  const isSubmitting = createCamp.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Camp</DialogTitle>
          <DialogDescription>
            Enter the basic information for the new camp. You can add studios and details later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Camp Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Summer Camp 2024"
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this camp
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Camp
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
