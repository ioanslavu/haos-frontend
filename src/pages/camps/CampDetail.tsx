import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Copy,
  Edit,
  FileText,
  Plus,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudioCard } from '@/components/camps/StudioCard';
import { StudioForm } from '@/components/camps/StudioForm';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  useCampDetail,
  useUpdateCamp,
  useDuplicateCamp,
  useExportCampPDF,
} from '@/api/hooks/useCamps';
import { CampStudio, StudioFormData } from '@/types/camps';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const campEditSchema = z.object({
  name: z.string().min(1, 'Camp name is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
});

type CampEditValues = z.infer<typeof campEditSchema>;

export default function CampDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = parseInt(id || '0');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [studioSearch, setStudioSearch] = useState('');
  const [showAddStudio, setShowAddStudio] = useState(false);
  const [editingStudioId, setEditingStudioId] = useState<number | null>(null);

  const { data: camp, isLoading } = useCampDetail(campId);
  const updateCamp = useUpdateCamp();
  const duplicateCamp = useDuplicateCamp();
  const exportPDF = useExportCampPDF();

  const form = useForm<CampEditValues>({
    resolver: zodResolver(campEditSchema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      status: 'draft',
    },
  });

  // Load camp data into form
  useEffect(() => {
    if (camp) {
      form.reset({
        name: camp.name,
        start_date: camp.start_date || '',
        end_date: camp.end_date || '',
        status: camp.status,
      });
    }
  }, [camp, form]);

  // Check if we should open edit dialog from URL params
  useEffect(() => {
    if (searchParams.get('edit') === 'true' && camp) {
      setEditDialogOpen(true);
    }
  }, [searchParams, camp]);

  const studios = camp?.studios || [];
  const filteredStudios = studios.filter((studio) =>
    studio.name.toLowerCase().includes(studioSearch.toLowerCase())
  );

  const handleEditCamp = async (values: CampEditValues) => {
    try {
      await updateCamp.mutateAsync({
        id: campId,
        data: {
          name: values.name,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          status: values.status,
        },
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update camp:', error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await duplicateCamp.mutateAsync(campId);
      if (response?.data?.id) {
        navigate(`/camps/${response.data.id}`);
      }
    } catch (error) {
      console.error('Failed to duplicate camp:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportPDF.mutateAsync(campId);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleAddStudio = async (data: StudioFormData) => {
    try {
      const updatedStudios = [
        ...studios,
        {
          ...data,
          order: studios.length,
        },
      ];

      await updateCamp.mutateAsync({
        id: campId,
        data: {
          studios: updatedStudios,
        },
      });

      setShowAddStudio(false);
      toast.success('Studio added successfully');
    } catch (error) {
      console.error('Failed to add studio:', error);
      toast.error('Failed to add studio');
    }
  };

  const handleUpdateStudio = async (data: StudioFormData) => {
    if (editingStudioId === null) return;

    try {
      const updatedStudios = studios.map((studio) =>
        studio.id === editingStudioId
          ? {
              ...studio,
              ...data,
            }
          : studio
      );

      await updateCamp.mutateAsync({
        id: campId,
        data: {
          studios: updatedStudios,
        },
      });

      setEditingStudioId(null);
      toast.success('Studio updated successfully');
    } catch (error) {
      console.error('Failed to update studio:', error);
      toast.error('Failed to update studio');
    }
  };

  const handleDeleteStudio = async (studioId: number) => {
    try {
      const updatedStudios = studios.filter((studio) => studio.id !== studioId);

      await updateCamp.mutateAsync({
        id: campId,
        data: {
          studios: updatedStudios,
        },
      });

      toast.success('Studio deleted successfully');
    } catch (error) {
      console.error('Failed to delete studio:', error);
      toast.error('Failed to delete studio');
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set';
    if (startDate && !endDate) return `From ${format(new Date(startDate), 'MMM d, yyyy')}`;
    if (!startDate && endDate) return `Until ${format(new Date(endDate), 'MMM d, yyyy')}`;
    return `${format(new Date(startDate!), 'MMM d, yyyy')} - ${format(new Date(endDate!), 'MMM d, yyyy')}`;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8 pb-8">
          <Skeleton className="h-12 w-32" />
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-64 rounded-xl" />
                <Skeleton className="h-4 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-1/2 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!camp) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Camp not found</h2>
            <p className="text-muted-foreground mb-4">
              The camp you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/camps')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Camps
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/camps')}
          className="gap-2 hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Camps
        </Button>

        {/* Camp Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold tracking-tight">{camp.name}</h1>
                  <Badge className={cn('text-xs', statusColors[camp.status])}>
                    {statusLabels[camp.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  {formatDateRange(camp.start_date, camp.end_date)}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="outline" size="sm" onClick={handleDuplicate} className="rounded-xl border-white/10 hover:bg-white/20">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)} className="rounded-xl border-white/10 hover:bg-white/20">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="rounded-xl border-white/10 hover:bg-white/20">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Studios Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Studios</h2>
          </div>

          {/* Search Bar with Add Button */}
          {!showAddStudio && filteredStudios.length > 0 && (
            <div className="flex gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search studios..."
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-white/10"
                />
                {studioSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setStudioSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={() => setShowAddStudio(true)}
                className="h-12 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Studio
              </Button>
            </div>
          )}

          {/* Add Button Only (when no studios) */}
          {!showAddStudio && filteredStudios.length === 0 && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setShowAddStudio(true)}
                className="h-12 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Studio
              </Button>
            </div>
          )}

          {/* Cancel Button (when adding studio) */}
          {showAddStudio && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setShowAddStudio(false)}
                variant="secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Add Studio Form */}
          {showAddStudio && (
            <div className="mb-6">
              <StudioForm
                onSubmit={handleAddStudio}
                onCancel={() => setShowAddStudio(false)}
              />
            </div>
          )}

          {/* Studios List */}
          {filteredStudios.length === 0 ? (
            <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    {studioSearch ? 'No studios found' : 'No studios yet'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {studioSearch
                      ? 'Try adjusting your search query.'
                      : 'Add studios to track recording sessions and artist information.'}
                  </p>
                  {!studioSearch && (
                    <Button onClick={() => setShowAddStudio(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Studio
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStudios.map((studio) => (
                <div key={studio.id}>
                  {editingStudioId === studio.id ? (
                    <StudioForm
                      studio={studio}
                      onSubmit={handleUpdateStudio}
                      onCancel={() => setEditingStudioId(null)}
                    />
                  ) : (
                    <StudioCard
                      studio={studio}
                      onEdit={() => setEditingStudioId(studio.id)}
                      onDelete={() => handleDeleteStudio(studio.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Camp Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Camp</DialogTitle>
              <DialogDescription>
                Update the camp information below.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEditCamp)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Camp Name <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Summer Camp 2024" />
                      </FormControl>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={updateCamp.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCamp.isPending}>
                    {updateCamp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
