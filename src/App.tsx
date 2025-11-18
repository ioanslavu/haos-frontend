import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette, CommandPaletteProvider } from "@/components/command-palette";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Auth pages (keep these eager since they're entry points)
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import AuthError from "./pages/auth/AuthError";
import Onboarding from "./pages/auth/Onboarding";
import DepartmentSelection from "./pages/auth/DepartmentSelection";

// Route guards
import AdminRoute from "./components/auth/AdminRoute";
import ManagerRoute from "./components/auth/ManagerRoute";

// Dashboard (keep eager for fast initial load)
import Dashboard from "./pages/dashboard/Index";

// Lazy load heavy pages for better performance
const Contracts = lazy(() => import("./pages/Contracts"));
const ContractGeneration = lazy(() => import("./pages/ContractGeneration"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateDetail = lazy(() => import("./pages/TemplateDetail"));
const ImportTemplate = lazy(() => import("./pages/ImportTemplate"));
const TaskManagement = lazy(() => import("./pages/TaskManagement"));
const WorkboardPage = lazy(() => import("./pages/workboard"));
const ProjectDetailPage = lazy(() => import("./pages/workboard/ProjectDetailPage"));

// Digital pages (lazy loaded)
const DigitalOverview = lazy(() => import("./pages/digital/OverviewPage"));
const DigitalCampaigns = lazy(() => import("./pages/digital/CampaignsPage"));
const DigitalCampaignDetail = lazy(() => import("./pages/digital/CampaignDetailPage"));
const DigitalCampaignFormPage = lazy(() => import("./pages/digital/DigitalCampaignFormPage"));
const DigitalDistributions = lazy(() => import("./pages/digital/DistributionsPage"));
const DigitalDistributionDetail = lazy(() => import("./pages/digital/DistributionDetailPage"));
const DigitalDistributionForm = lazy(() => import("./pages/digital/DistributionFormPage"));
const DigitalFinancial = lazy(() => import("./pages/digital/FinancialPage"));
const DigitalTasks = lazy(() => import("./pages/digital/TasksPage"));
const DigitalReporting = lazy(() => import("./pages/digital/ReportingPage"));
const Settings = lazy(() => import("./pages/Settings"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const AlertSettingsPage = lazy(() => import("./pages/settings/AlertSettingsPage"));
const Profile = lazy(() => import("./pages/profile/Index"));
const Users = lazy(() => import("./pages/users/Index"));
const UserDetail = lazy(() => import("./pages/users/UserDetail"));
const UsersManagement = lazy(() => import("./pages/users/UsersManagement"));
const DepartmentRequests = lazy(() => import("./pages/users/DepartmentRequests"));
const Roles = lazy(() => import("./pages/roles/Index"));
const RoleDetail = lazy(() => import("./pages/roles/RoleDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Entity pages
const Entities = lazy(() => import("./pages/Entities"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));

// Activity pages
const ActivitiesPage = lazy(() => import("./pages/activities/ActivitiesPage"));

// Camps pages
const CampsList = lazy(() => import("./pages/camps/CampsList"));
const CampDetail = lazy(() => import("./pages/camps/CampDetail"));

// Teams pages
const TeamsPage = lazy(() => import("./pages/teams/TeamsPage"));

// Opportunities pages (unified artist sales system)
const OpportunitiesKanban = lazy(() => import("./pages/opportunities/OpportunitiesKanban"));
const OpportunityDetail = lazy(() => import("./pages/opportunities/OpportunityDetail"));
const OpportunityForm = lazy(() => import("./pages/opportunities/OpportunityForm"));
const DeliverablePacksAdmin = lazy(() => import("./pages/opportunities/DeliverablePacksAdmin"));
const UsageTermsAdmin = lazy(() => import("./pages/opportunities/UsageTermsAdmin"));

// Admin pages
const EntityRequestsPage = lazy(() => import("./pages/admin/EntityRequestsPage"));
const ChecklistTemplatesPage = lazy(() => import("./pages/admin/ChecklistTemplatesPage"));
const ChecklistTemplateEditor = lazy(() => import("./pages/admin/ChecklistTemplateEditor"));

// Task pages
const TaskReviewDashboard = lazy(() => import("./pages/tasks/TaskReviewDashboard"));

// Song Workflow pages
const SongListPage = lazy(() => import("./pages/songs/SongListPage"));
const SongDetailPage = lazy(() => import("./pages/songs/SongDetailPage"));
const SongCreatePage = lazy(() => import("./pages/songs/SongCreatePage"));
const MyQueuePage = lazy(() => import("./pages/songs/MyQueuePage"));
const SongWorkCreate = lazy(() => import("./pages/songs/SongWorkCreate"));
const SongWorkEdit = lazy(() => import("./pages/songs/SongWorkEdit"));
const SongWorkDetail = lazy(() => import("./pages/songs/SongWorkDetail"));

// Notes pages
const NotesPage = lazy(() => import("./pages/notes/Index"));

// Marketing pages
const MarketingTeam = lazy(() => import("./pages/marketing/MarketingTeam"));

const App = () => (
  <ErrorBoundary>
    <QueryProvider>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <CommandPaletteProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <CommandPalette />
              <Suspense fallback={<PageLoader />}>
              <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/error" element={<AuthError />} />

            {/* Onboarding routes - Accessible to authenticated users only */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/department-selection" element={
              <ProtectedRoute>
                <DepartmentSelection />
              </ProtectedRoute>
            } />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/contracts" element={
              <ProtectedRoute>
                <Contracts />
              </ProtectedRoute>
            } />
            <Route path="/entity/:id/generate-contract" element={
              <ProtectedRoute>
                <ContractGeneration />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            } />
            <Route path="/templates/:id" element={
              <ProtectedRoute>
                <TemplateDetail />
              </ProtectedRoute>
            } />
            <Route path="/templates/import" element={
              <ProtectedRoute>
                <ImportTemplate />
              </ProtectedRoute>
            } />
            {/* Camps routes */}
            <Route path="/camps" element={
              <ProtectedRoute>
                <CampsList />
              </ProtectedRoute>
            } />
            <Route path="/camps/:id" element={
              <ProtectedRoute>
                <CampDetail />
              </ProtectedRoute>
            } />

            {/* Teams route */}
            <Route path="/teams" element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            } />

            {/* Opportunities routes (unified artist sales system) */}
            <Route path="/opportunities" element={
              <ProtectedRoute>
                <OpportunitiesKanban />
              </ProtectedRoute>
            } />
            <Route path="/opportunities/new" element={
              <ProtectedRoute>
                <OpportunityForm />
              </ProtectedRoute>
            } />
            <Route path="/opportunities/:id" element={
              <ProtectedRoute>
                <OpportunityDetail />
              </ProtectedRoute>
            } />
            <Route path="/opportunities/:id/edit" element={
              <ProtectedRoute>
                <OpportunityForm />
              </ProtectedRoute>
            } />
            <Route path="/artist-sales/admin/deliverable-packs" element={
              <ProtectedRoute>
                <DeliverablePacksAdmin />
              </ProtectedRoute>
            } />
            <Route path="/artist-sales/admin/usage-terms" element={
              <ProtectedRoute>
                <UsageTermsAdmin />
              </ProtectedRoute>
            } />

            <Route path="/entities" element={
              <ProtectedRoute>
                <Entities />
              </ProtectedRoute>
            } />
            <Route path="/entities/:role" element={
              <ProtectedRoute>
                <Entities />
              </ProtectedRoute>
            } />
            <Route path="/entity/:id" element={
              <ProtectedRoute>
                <EntityDetail />
              </ProtectedRoute>
            } />
            <Route path="/activities" element={
              <ProtectedRoute>
                <ActivitiesPage />
              </ProtectedRoute>
            } />
            <Route path="/task-management" element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            } />
            <Route path="/workboard" element={
              <ProtectedRoute>
                <WorkboardPage />
              </ProtectedRoute>
            } />
            <Route path="/workboard/:id" element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            } />
            {/* Song Workflow routes */}
            <Route path="/songs" element={
              <ProtectedRoute>
                <SongListPage />
              </ProtectedRoute>
            } />
            <Route path="/songs/create" element={
              <ProtectedRoute>
                <SongCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/songs/my-queue" element={
              <ProtectedRoute>
                <MyQueuePage />
              </ProtectedRoute>
            } />
            <Route path="/songs/:id" element={
              <ProtectedRoute>
                <SongDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/songs/:id/work/create" element={
              <ProtectedRoute>
                <SongWorkCreate />
              </ProtectedRoute>
            } />
            <Route path="/songs/:id/work/edit" element={
              <ProtectedRoute>
                <SongWorkEdit />
              </ProtectedRoute>
            } />
            <Route path="/songs/:id/work" element={
              <ProtectedRoute>
                <SongWorkDetail />
              </ProtectedRoute>
            } />
            {/* Redirect old digital-dashboard route to new structure */}
            <Route path="/digital-dashboard" element={
              <ProtectedRoute>
                <Navigate to="/digital/overview" replace />
              </ProtectedRoute>
            } />
            <Route path="/digital/overview" element={
              <ProtectedRoute>
                <DigitalOverview />
              </ProtectedRoute>
            } />
            {/* Redirect old clients page to entities */}
            <Route path="/digital/clients" element={<Navigate to="/entities" replace />} />
            <Route path="/digital/campaigns" element={
              <ProtectedRoute>
                <DigitalCampaigns />
              </ProtectedRoute>
            } />
            <Route path="/digital/campaigns/create" element={
              <ProtectedRoute>
                <DigitalCampaignFormPage />
              </ProtectedRoute>
            } />
            <Route path="/digital/campaigns/:id/edit" element={
              <ProtectedRoute>
                <DigitalCampaignFormPage />
              </ProtectedRoute>
            } />
            <Route path="/digital/campaigns/:id" element={
              <ProtectedRoute>
                <DigitalCampaignDetail />
              </ProtectedRoute>
            } />
            <Route path="/digital/distributions" element={
              <ProtectedRoute>
                <DigitalDistributions />
              </ProtectedRoute>
            } />
            <Route path="/digital/distributions/new" element={
              <ProtectedRoute>
                <DigitalDistributionForm />
              </ProtectedRoute>
            } />
            <Route path="/digital/distributions/:id/edit" element={
              <ProtectedRoute>
                <DigitalDistributionForm />
              </ProtectedRoute>
            } />
            <Route path="/digital/distributions/:id" element={
              <ProtectedRoute>
                <DigitalDistributionDetail />
              </ProtectedRoute>
            } />
            <Route path="/digital/financial" element={
              <ProtectedRoute>
                <DigitalFinancial />
              </ProtectedRoute>
            } />
            <Route path="/digital/tasks" element={
              <ProtectedRoute>
                <DigitalTasks />
              </ProtectedRoute>
            } />
            <Route path="/digital/reporting" element={
              <ProtectedRoute>
                <DigitalReporting />
              </ProtectedRoute>
            } />
            {/* Marketing routes */}
            <Route path="/marketing/team" element={
              <ProtectedRoute>
                <MarketingTeam />
              </ProtectedRoute>
            } />
            <Route path="/notes" element={
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/settings/alerts" element={
              <ProtectedRoute requireAdmin={true}>
                <AlertSettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/company-settings" element={
              <ProtectedRoute>
                <CompanySettings />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/users/:userId" element={
              <ProtectedRoute>
                <UserDetail />
              </ProtectedRoute>
            } />
            <Route path="/roles" element={
              <ProtectedRoute requireAdmin={true}>
                <Roles />
              </ProtectedRoute>
            } />
            <Route path="/roles/:roleId" element={
              <ProtectedRoute requireAdmin={true}>
                <RoleDetail />
              </ProtectedRoute>
            } />

            {/* User Management routes - Admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/users/management" element={<UsersManagement />} />
              <Route path="/admin/entity-requests" element={<EntityRequestsPage />} />
              <Route path="/admin/checklist-templates" element={<ChecklistTemplatesPage />} />
              <Route path="/admin/checklist-templates/:id" element={<ChecklistTemplateEditor />} />
            </Route>

            {/* Department Requests - Admin and Manager only */}
            <Route element={<ManagerRoute />}>
              <Route path="/department-requests" element={<DepartmentRequests />} />
              <Route path="/tasks/review" element={<TaskReviewDashboard />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </BrowserRouter>
            </CommandPaletteProvider>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider>
  </ErrorBoundary>
);

export default App;