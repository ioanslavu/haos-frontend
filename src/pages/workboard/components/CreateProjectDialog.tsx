import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, FileCode2, Sparkles, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useCreateProject, useProjectTemplates, useCreateProjectFromTemplate } from '@/api/hooks/useProjects';
import apiClient from '@/api/client';
import {
  PROJECT_TYPE_CONFIG,
  type ProjectType,
  type ProjectCreatePayload,
} from '@/types/projects';
import { useAuthStore } from '@/stores/authStore';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateMode = 'blank' | 'template';

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const [createMode, setCreateMode] = useState<CreateMode>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { user, isAdmin: isAdminFn } = useAuthStore();
  const isAdmin = isAdminFn();
  const createProject = useCreateProject();
  const createFromTemplate = useCreateProjectFromTemplate();
  const { data: templates } = useProjectTemplates({ is_active: true });

  // Fetch departments from API (for admin users)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/departments/');
      return response.data;
    },
    enabled: isAdmin,
  });

  // Map departments to {id, name} format
  const departments = departmentsData
    ? (Array.isArray(departmentsData) ? departmentsData : departmentsData.results || [])
        .map((d: any) => ({ id: d.id, name: d.name }))
    : [];

  // Get user's department as default
  const defaultDepartment = user?.profile?.department || (departments[0]?.id || undefined);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCreatePayload>({
    defaultValues: {
      name: '',
      description: '',
      project_type: 'custom',
      department: defaultDepartment,
    },
  });

  const selectedDepartment = watch('department');

  const selectedType = watch('project_type');

  const onSubmit = async (data: ProjectCreatePayload) => {
    try {
      if (createMode === 'template' && selectedTemplate) {
        await createFromTemplate.mutateAsync({
          templateId: selectedTemplate,
          data: {
            name: data.name,
            description: data.description,
            // Only send department if admin selected one
            department_id: isAdmin ? data.department : undefined,
            start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          },
        });
      } else {
        // Build payload - only include department for admins
        const payload: any = {
          name: data.name,
          description: data.description,
          project_type: data.project_type,
          start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        };

        // Only include department if admin
        if (isAdmin && data.department) {
          payload.department = data.department;
        }

        await createProject.mutateAsync(payload);
      }

      reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedTemplate(null);
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    reset();
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Create New Project
          </DialogTitle>
        </DialogHeader>

        {/* Create Mode Toggle */}
        <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as CreateMode)}>
          {/* Template mode hidden for now
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="blank" className="rounded-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Blank Project
            </TabsTrigger>
            <TabsTrigger value="template" className="rounded-lg">
              <FileCode2 className="h-4 w-4 mr-2" />
              From Template
            </TabsTrigger>
          </TabsList>
          */}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Template Selection - hidden for now
            <TabsContent value="template" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select
                  value={selectedTemplate?.toString()}
                  onValueChange={(v) => setSelectedTemplate(parseInt(v))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{PROJECT_TYPE_CONFIG[template.project_type as ProjectType]?.icon}</span>
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({template.task_count} tasks)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            */}

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                className="rounded-xl"
                {...register('name', { required: 'Project name is required' })}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project..."
                className="rounded-xl resize-none"
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label>Project Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setValue('project_type', v as ProjectType)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Selector - Admin only */}
            {isAdmin && departments.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Department
                </Label>
                <Select
                  value={selectedDepartment?.toString()}
                  onValueChange={(v) => setValue('department', parseInt(v))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (createMode === 'template' && !selectedTemplate)}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
