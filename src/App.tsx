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
const Analytics = lazy(() => import("./pages/Analytics"));
const CRM = lazy(() => import("./pages/CRM"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Studio = lazy(() => import("./pages/Studio"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskManagement = lazy(() => import("./pages/TaskManagement"));

// Digital pages (lazy loaded)
const DigitalOverview = lazy(() => import("./pages/digital/OverviewPage"));
const DigitalCampaigns = lazy(() => import("./pages/digital/CampaignsPage"));
const DigitalCampaignDetail = lazy(() => import("./pages/digital/CampaignDetailPage"));
const DigitalCampaignFormPage = lazy(() => import("./pages/digital/DigitalCampaignFormPage"));
const DigitalServices = lazy(() => import("./pages/digital/ServicesPage"));
const DigitalFinancial = lazy(() => import("./pages/digital/FinancialPage"));
const DigitalTasks = lazy(() => import("./pages/digital/TasksPage"));
const DigitalReporting = lazy(() => import("./pages/digital/ReportingPage"));
const Settings = lazy(() => import("./pages/Settings"));
const CompanySettings = lazy(() => import("./pages/CompanySettings"));
const Profile = lazy(() => import("./pages/profile/Index"));
const Users = lazy(() => import("./pages/users/Index"));
const UserDetail = lazy(() => import("./pages/users/UserDetail"));
const UsersManagement = lazy(() => import("./pages/users/UsersManagement"));
const DepartmentRequests = lazy(() => import("./pages/users/DepartmentRequests"));
const Roles = lazy(() => import("./pages/roles/Index"));
const RoleDetail = lazy(() => import("./pages/roles/RoleDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Catalog pages (lazy loaded)
const Works = lazy(() => import("./pages/catalog/Works"));
const WorkCreate = lazy(() => import("./pages/catalog/WorkCreate"));
const WorkEdit = lazy(() => import("./pages/catalog/WorkEdit"));
const WorkDetail = lazy(() => import("./pages/catalog/WorkDetail"));
const WorkContractGeneration = lazy(() => import("./pages/catalog/WorkContractGeneration"));
const Recordings = lazy(() => import("./pages/catalog/Recordings"));
const RecordingCreate = lazy(() => import("./pages/catalog/RecordingCreate"));
const RecordingDetail = lazy(() => import("./pages/catalog/RecordingDetail"));
const RecordingContractGeneration = lazy(() => import("./pages/catalog/RecordingContractGeneration"));
const CoProdContractGeneration = lazy(() => import("./pages/catalog/CoProdContractGeneration"));
const Releases = lazy(() => import("./pages/catalog/Releases"));

// Entity pages
const Entities = lazy(() => import("./pages/Entities"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));

// Activity pages
const ActivitiesPage = lazy(() => import("./pages/activities/ActivitiesPage"));

// CRM pages
const CampaignFormPage = lazy(() => import("./pages/crm/CampaignFormPage"));

// Admin pages
const EntityRequestsPage = lazy(() => import("./pages/admin/EntityRequestsPage"));

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
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/crm" element={
              <ProtectedRoute>
                <CRM />
              </ProtectedRoute>
            } />
            <Route path="/crm/campaigns/create" element={
              <ProtectedRoute>
                <CampaignFormPage />
              </ProtectedRoute>
            } />
            <Route path="/crm/campaigns/:id/edit" element={
              <ProtectedRoute>
                <CampaignFormPage />
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
            <Route path="/catalog" element={
              <ProtectedRoute>
                <Catalog />
              </ProtectedRoute>
            } />
            <Route path="/catalog/works" element={
              <ProtectedRoute>
                <Works />
              </ProtectedRoute>
            } />
            <Route path="/catalog/works/create" element={
              <ProtectedRoute>
                <WorkCreate />
              </ProtectedRoute>
            } />
            <Route path="/catalog/works/:id/edit" element={
              <ProtectedRoute>
                <WorkEdit />
              </ProtectedRoute>
            } />
            <Route path="/catalog/works/:id" element={
              <ProtectedRoute>
                <WorkDetail />
              </ProtectedRoute>
            } />
            <Route path="/catalog/works/:id/generate-contract" element={
              <ProtectedRoute>
                <WorkContractGeneration />
              </ProtectedRoute>
            } />
            <Route path="/catalog/recordings" element={
              <ProtectedRoute>
                <Recordings />
              </ProtectedRoute>
            } />
            <Route path="/catalog/recordings/create" element={
              <ProtectedRoute>
                <RecordingCreate />
              </ProtectedRoute>
            } />
            <Route path="/catalog/recordings/:id" element={
              <ProtectedRoute>
                <RecordingDetail />
              </ProtectedRoute>
            } />
            <Route path="/catalog/recordings/:id/generate-contract" element={
              <ProtectedRoute>
                <RecordingContractGeneration />
              </ProtectedRoute>
            } />
            <Route path="/catalog/recordings/:id/generate-coprod-contract" element={
              <ProtectedRoute>
                <CoProdContractGeneration />
              </ProtectedRoute>
            } />
            <Route path="/catalog/releases" element={
              <ProtectedRoute>
                <Releases />
              </ProtectedRoute>
            } />
            <Route path="/studio" element={
              <ProtectedRoute>
                <Studio />
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/task-management" element={
              <ProtectedRoute>
                <TaskManagement />
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
            <Route path="/digital/clients" element={<Navigate to="/crm/entities" replace />} />
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
            <Route path="/digital/services" element={
              <ProtectedRoute>
                <DigitalServices />
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
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
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
            </Route>

            {/* Department Requests - Admin and Manager only */}
            <Route element={<ManagerRoute />}>
              <Route path="/department-requests" element={<DepartmentRequests />} />
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