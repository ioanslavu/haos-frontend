import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/command-palette";

// Auth pages
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/auth/AuthCallback";
import AuthError from "./pages/auth/AuthError";
import Onboarding from "./pages/auth/Onboarding";
import DepartmentSelection from "./pages/auth/DepartmentSelection";

// Route guards
import AdminRoute from "./components/auth/AdminRoute";
import ManagerRoute from "./components/auth/ManagerRoute";

// Protected pages
import Dashboard from "./pages/dashboard/Index";
import Contracts from "./pages/Contracts";
import ContractGeneration from "./pages/ContractGeneration";
import Templates from "./pages/Templates";
import TemplateDetail from "./pages/TemplateDetail";
import ImportTemplate from "./pages/ImportTemplate";
import Analytics from "./pages/Analytics";
import CRM from "./pages/CRM";
import Catalog from "./pages/Catalog";
import Studio from "./pages/Studio";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import CompanySettings from "./pages/CompanySettings";
import Profile from "./pages/profile/Index";
import Users from "./pages/users/Index";
import UserDetail from "./pages/users/UserDetail";
import UsersManagement from "./pages/users/UsersManagement";
import DepartmentRequests from "./pages/users/DepartmentRequests";
import Roles from "./pages/roles/Index";
import RoleDetail from "./pages/roles/RoleDetail";
import NotFound from "./pages/NotFound";

// Catalog pages
import Works from "./pages/catalog/Works";
import WorkCreate from "./pages/catalog/WorkCreate";
import WorkEdit from "./pages/catalog/WorkEdit";
import WorkDetail from "./pages/catalog/WorkDetail";
import WorkContractGeneration from "./pages/catalog/WorkContractGeneration";
import Recordings from "./pages/catalog/Recordings";
import RecordingCreate from "./pages/catalog/RecordingCreate";
import RecordingDetail from "./pages/catalog/RecordingDetail";
import RecordingContractGeneration from "./pages/catalog/RecordingContractGeneration";
import CoProdContractGeneration from "./pages/catalog/CoProdContractGeneration";
import Releases from "./pages/catalog/Releases";

// Entity pages
import Entities from "./pages/Entities";
import EntityDetail from "./pages/EntityDetail";

const App = () => (
  <ErrorBoundary>
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* <CommandPalette /> */}
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
            </Route>

            {/* Department Requests - Admin and Manager only */}
            <Route element={<ManagerRoute />}>
              <Route path="/department-requests" element={<DepartmentRequests />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryProvider>
  </ErrorBoundary>
);

export default App;