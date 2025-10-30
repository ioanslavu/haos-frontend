import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  useUserDetail, 
  useUpdateUser,
  useAssignRole,
  useRemoveRoles,
  useLockUser,
  useUnlockUser,
  useUserPermissions,
  useUserAuditLog,
} from '@/api/hooks/useUsers';
import { useUIStore } from '@/stores/uiStore';
import { User, useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  Lock,
  History,
  Settings,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Building,
  Hash,
  Globe,
  Calendar,
  Clock,
  Users,
  Key,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_ROLES } from '@/lib/constants';

// Import tab components
import { OverviewTab } from './components/detail/OverviewTab';
import { RolesPermissionsTab } from './components/detail/RolesPermissionsTab';
import { ContractsPermissionsMatrix } from './components/detail/ContractsPermissionsMatrix';
import { SecurityTab } from './components/detail/SecurityTab';
import { SessionsTab } from './components/detail/SessionsTab';
import { ActivityLogTab } from './components/detail/ActivityLogTab';
import { SettingsTab } from './components/detail/SettingsTab';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const currentUser = useAuthStore((state) => state.user);
  
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if current user is admin and viewing another user's profile
  const isAdmin = currentUser?.roles?.includes('SUPER_ADMIN') || 
                  currentUser?.roles?.includes('SYSTEM_ADMIN');
  // Convert both to strings for comparison since API may return number or string
  const isViewingOtherUser = String(currentUser?.id) !== String(userId);
  
  // Fetch user data
  const { data: user, isLoading, error, refetch } = useUserDetail(userId!);
  const updateUser = useUpdateUser();
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  
  // Edit form state
  const [formData, setFormData] = useState<Partial<User>>({});
  
  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        department: user.department,
        employee_id: user.employee_id,
        timezone: user.timezone,
        language: user.language,
        is_active: user.is_active,
      });
    }
  }, [user]);
  
  const handleSave = async () => {
    if (!userId) return;
    
    try {
      await updateUser.mutateAsync({ userId, data: formData });
      addNotification({
        type: 'success',
        title: 'User Updated',
        description: 'User information has been updated successfully.',
      });
      setEditMode(false);
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update user information.',
      });
    }
  };
  
  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        department: user.department,
        employee_id: user.employee_id,
        timezone: user.timezone,
        language: user.language,
        is_active: user.is_active,
      });
    }
    setEditMode(false);
  };
  
  const handleLockToggle = async () => {
    if (!user || !userId) return;
    
    try {
      if (user.is_locked) {
        await unlockUser.mutateAsync(userId);
        addNotification({
          type: 'success',
          title: 'User Unlocked',
          description: 'User account has been unlocked.',
        });
      } else {
        // For simplicity, using a default reason. In production, show a dialog
        await lockUser.mutateAsync({
          userId,
          reason: 'Administrative action',
          duration_hours: 24,
        });
        addNotification({
          type: 'warning',
          title: 'User Locked',
          description: 'User account has been locked.',
        });
      }
      refetch();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        description: 'Failed to change lock status.',
      });
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }
  
  if (error || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load user details</p>
            <Button onClick={() => navigate('/users')} className="mt-4" variant="outline">
              Back to Users
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  const getRoleBadgeColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (role.includes('ANALYST')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (role.includes('COORDINATOR')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (role === 'ARTIST') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    if (role === 'PUBLISHER') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/users')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant={user.is_locked ? "default" : "destructive"}
                  onClick={handleLockToggle}
                  disabled={lockUser.isPending || unlockUser.isPending}
                  className="gap-2"
                >
                  {user.is_locked ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Lock
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateUser.isPending}
                  className="gap-2"
                >
                  {updateUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* User Header Card */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/80 to-purple-600/80 rounded-2xl flex items-center justify-center text-white text-2xl font-medium shadow-lg">
                  {user.first_name.charAt(0)}
                  {user.last_name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{user.full_name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={
                        user.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {user.is_locked && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Locked
                      </Badge>
                    )}
                    {(user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : [])).map((role) => (
                      <Badge key={role} className={getRoleBadgeColor(role)}>
                        {String(role).replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {user.last_login && (
                  <p className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    Last login: {format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
                <p className="flex items-center gap-1 justify-end mt-1">
                  <Calendar className="h-3 w-3" />
                  Joined: {format(new Date(user.date_joined), 'MMM dd, yyyy')}
                </p>
                {user.employee_id && (
                  <p className="flex items-center gap-1 justify-end mt-1">
                    <Hash className="h-3 w-3" />
                    ID: {user.employee_id}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="roles-permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="contracts-permissions" className="gap-2">
              <Key className="h-4 w-4" />
              Contracts RBAC
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab
              user={user}
              editMode={editMode}
              formData={formData}
              setFormData={setFormData}
            />
          </TabsContent>
          
          <TabsContent value="roles-permissions">
            <RolesPermissionsTab user={user} userId={userId!} />
          </TabsContent>
          <TabsContent value="contracts-permissions">
            <ContractsPermissionsMatrix userId={userId!} />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityTab user={user} userId={userId!} />
          </TabsContent>
          
       
          <TabsContent value="activity">
            <ActivityLogTab userId={userId!} />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab user={user} userId={userId!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
