import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Archive,
  Filter,
  X,
  FolderKanban,
  Repeat,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useProjects, useProjectStats } from '@/api/hooks/useProjects';
import { ProjectGrid } from './components/ProjectGrid';
import { ProjectList } from './components/ProjectList';
import { ProjectDetailSheet } from './components/ProjectDetailSheet';
import { CreateProjectDialog } from './components/CreateProjectDialog';
import { ArchivedProjectsView } from './components/ArchivedProjectsView';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type Project,
  type ProjectType,
  type ProjectStatus,
  type ProjectFilterParams,
} from '@/types/projects';
import { RecurringTemplateDialog } from '@/components/recurring/RecurringTemplateDialog';

type ViewMode = 'grid' | 'list';
type ViewSection = 'active' | 'archived';

export default function WorkboardPage() {
  const { user } = useAuthStore();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [viewSection, setViewSection] = useState<ViewSection>('active');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Build filter params
  const filterParams: ProjectFilterParams = useMemo(() => {
    const params: ProjectFilterParams = {};
    if (searchTerm) params.search = searchTerm;
    if (filterType !== 'all') params.project_type = filterType;
    if (filterStatus !== 'all') params.status = filterStatus;
    if (filterDepartment !== 'all') params.department = parseInt(filterDepartment);
    return params;
  }, [searchTerm, filterType, filterStatus, filterDepartment]);

  // Fetch projects
  const { data: projects, isLoading, error } = useProjects(filterParams);
  const stats = useProjectStats();

  // Filter and group projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    // Filter by view section
    if (viewSection === 'active') {
      filtered = filtered.filter(p => p.status !== 'archived');
    } else {
      filtered = filtered.filter(p => p.status === 'archived');
    }

    return filtered;
  }, [projects, viewSection]);

  // Group projects by type for display
  const groupedProjects = useMemo(() => {
    const departmentTypes: ProjectType[] = ['song', 'release', 'campaign', 'opportunity'];
    const otherTypes: ProjectType[] = ['ops', 'custom', 'contract', 'distribution_deal'];

    const departmentProjects = filteredProjects.filter(p => departmentTypes.includes(p.project_type));
    const otherProjects = filteredProjects.filter(p => otherTypes.includes(p.project_type));
    const pinnedProjects = filteredProjects.filter(p => p.metadata?.pinned);

    return {
      pinned: pinnedProjects,
      department: departmentProjects,
      other: otherProjects,
    };
  }, [filteredProjects]);

  // Handlers
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterDepartment('all');
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterDepartment !== 'all';

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Glassmorphic Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <FolderKanban className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                    Workboard
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm lg:text-base max-w-md">
                  Manage projects, campaigns, and recurring tasks across all departments
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecurringOpen(true)}
                  className="rounded-xl border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10"
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Recurring
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewSection(viewSection === 'active' ? 'archived' : 'active')}
                  className={cn(
                    "rounded-xl border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10",
                    viewSection === 'archived' && "bg-white/20"
                  )}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {viewSection === 'active' ? 'View Archive' : 'View Active'}
                </Button>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  size="lg"
                  className="rounded-xl shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {viewSection === 'active' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Active"
              value={stats.active}
              color="text-green-600 dark:text-green-400"
              bgColor="from-green-500/10 to-emerald-500/10"
              borderColor="border-green-500/20"
            />
            <StatsCard
              label="On Hold"
              value={stats.on_hold}
              color="text-yellow-600 dark:text-yellow-400"
              bgColor="from-yellow-500/10 to-orange-500/10"
              borderColor="border-yellow-500/20"
            />
            <StatsCard
              label="Completed"
              value={stats.completed}
              color="text-blue-600 dark:text-blue-400"
              bgColor="from-blue-500/10 to-cyan-500/10"
              borderColor="border-blue-500/20"
            />
            <StatsCard
              label="Total Projects"
              value={stats.total}
              color="text-purple-600 dark:text-purple-400"
              bgColor="from-purple-500/10 to-pink-500/10"
              borderColor="border-purple-500/20"
            />
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-background/50 backdrop-blur-sm border-white/10 focus:border-indigo-500/50"
              />
            </div>

            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-11 rounded-xl bg-background/50 backdrop-blur-sm border border-white/10">
                <TabsTrigger value="grid" className="rounded-lg data-[state=active]:bg-white/20">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white/20">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm",
                showFilters && "bg-white/20"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-indigo-500">
                  {[filterType !== 'all', filterStatus !== 'all', filterDepartment !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 animate-in slide-in-from-top-2 duration-200">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as ProjectType | 'all')}>
                <SelectTrigger className="w-40 h-10 rounded-xl bg-background/50 border-white/10">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(PROJECT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ProjectStatus | 'all')}>
                <SelectTrigger className="w-36 h-10 rounded-xl bg-background/50 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(PROJECT_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-10 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {viewSection === 'archived' ? (
          <ArchivedProjectsView
            projects={filteredProjects}
            isLoading={isLoading}
            onProjectClick={handleProjectClick}
          />
        ) : (
          <>
            {isLoading ? (
              <LoadingSkeleton viewMode={viewMode} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to load projects</p>
                <p className="text-sm text-red-500 mt-2">{error.message}</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState hasFilters={hasActiveFilters} onCreateClick={() => setIsCreateOpen(true)} />
            ) : (
              <div className="space-y-8">
                {/* Pinned Projects */}
                {groupedProjects.pinned.length > 0 && (
                  <ProjectSection
                    title="Pinned"
                    icon="📌"
                    projects={groupedProjects.pinned}
                    viewMode={viewMode}
                    onProjectClick={handleProjectClick}
                  />
                )}

                {/* Department Projects */}
                {groupedProjects.department.length > 0 && (
                  <ProjectSection
                    title="Songs, Releases & Campaigns"
                    icon="🎵"
                    projects={groupedProjects.department}
                    viewMode={viewMode}
                    onProjectClick={handleProjectClick}
                  />
                )}

                {/* Other Projects */}
                {groupedProjects.other.length > 0 && (
                  <ProjectSection
                    title="Operations & General"
                    icon="⚙️"
                    projects={groupedProjects.other}
                    viewMode={viewMode}
                    onProjectClick={handleProjectClick}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals and Sheets */}
      <ProjectDetailSheet
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedProject(null);
        }}
      />

      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <RecurringTemplateDialog
        open={isRecurringOpen}
        onOpenChange={setIsRecurringOpen}
      />
    </AppLayout>
  );
}

// Stats Card Component
function StatsCard({
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 backdrop-blur-sm border",
        `bg-gradient-to-br ${bgColor}`,
        borderColor
      )}
    >
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
      </div>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 blur-xl" />
    </div>
  );
}

// Project Section Component
function ProjectSection({
  title,
  icon,
  projects,
  viewMode,
  onProjectClick,
}: {
  title: string;
  icon: string;
  projects: Project[];
  viewMode: ViewMode;
  onProjectClick: (project: Project) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-lg font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <span>{icon}</span>
        <span>{title}</span>
        <Badge variant="secondary" className="ml-2">
          {projects.length}
        </Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {viewMode === 'grid' ? (
            <ProjectGrid projects={projects} onProjectClick={onProjectClick} />
          ) : (
            <ProjectList projects={projects} onProjectClick={onProjectClick} />
          )}
        </div>
      )}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

// Empty State
function EmptyState({
  hasFilters,
  onCreateClick,
}: {
  hasFilters: boolean;
  onCreateClick: () => void;
}) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4">
        <FolderKanban className="h-8 w-8 text-indigo-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? 'No projects match your filters' : 'No projects yet'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {hasFilters
          ? 'Try adjusting your filters to find what you\'re looking for'
          : 'Create your first project to start organizing your work'}
      </p>
      {!hasFilters && (
        <Button onClick={onCreateClick} className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      )}
    </div>
  );
}
