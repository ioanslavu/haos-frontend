import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUserProfile, useUpdateCurrentUser } from '@/api/hooks/useUsers';
import { 
  User, Shield, Bell, Globe, MapPin, Building, Calendar, 
  Clock, Save, Loader2, Mail, Phone, Hash, Users, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useCurrentUserSessions, useRevokeSession, useRevokeAllSessions } from '@/api/hooks/useSessions';
import { SessionManagementPanel } from '@/components/sessions/SessionManagementPanel';

// Timezone options
const timezones = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

// Language options
const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

export default function Profile() {
  const { data: user, isLoading, error } = useCurrentUserProfile();
  const updateUser = useUpdateCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    timezone: '',
    language: '',
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    weekly_digest: true,
    instant_alerts: true,
  });

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        department: user.department || '',
        timezone: user.timezone || 'America/Los_Angeles',
        language: user.language || 'en',
      });
      
      if (user.notification_preferences) {
        setNotificationPreferences({
          ...notificationPreferences,
          ...user.notification_preferences,
        });
      }
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    updateUser.mutate(formData);
  };

  const handleSaveNotifications = () => {
    updateUser.mutate({
      notification_preferences: notificationPreferences,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-96 md:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground">Failed to load profile data</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    if (role.includes('ADMIN')) return 'bg-red-100 text-red-800';
    if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-800';
    if (role.includes('ANALYST')) return 'bg-green-100 text-green-800';
    if (role.includes('COORDINATOR')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">My Profile</h1>
            <p className="text-muted-foreground text-base">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - User Overview */}
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/80 to-purple-600/80 rounded-2xl flex items-center justify-center text-white text-xl font-medium shadow-lg">
                    {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Role</p>
                  {user.roles.map(role => (
                    <Badge key={role} className={getRoleBadgeColor(role)}>
                      {role.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
                
                {user.department && (
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                )}
                
                {user.employee_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{user.employee_id}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {user.is_locked && (
                      <Badge className="bg-red-100 text-red-800">Locked</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {format(new Date(user.date_joined), 'MMM dd, yyyy')}
                  </p>
                </div>
                
                {user.last_login && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium">
                      {format(new Date(user.last_login), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Permissions Overview */}
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions
                </CardTitle>
                <CardDescription>
                  Your current access levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.can_manage_finances && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Finance Management</span>
                    <Badge className="bg-green-100 text-green-800">Granted</Badge>
                  </div>
                )}
                {user.can_manage_contracts && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contract Management</span>
                    <Badge className="bg-green-100 text-green-800">Granted</Badge>
                  </div>
                )}
                {user.can_manage_catalog && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Catalog Management</span>
                    <Badge className="bg-green-100 text-green-800">Granted</Badge>
                  </div>
                )}
                {!user.can_manage_finances && !user.can_manage_contracts && !user.can_manage_catalog && (
                  <p className="text-sm text-muted-foreground">
                    Contact your administrator for additional permissions
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings Tabs */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Personal Information</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed. Contact IT support if needed.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          placeholder="e.g., Production, Legal, Finance"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select 
                          value={formData.timezone} 
                          onValueChange={(value) => handleInputChange('timezone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map(tz => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <Select 
                          value={formData.language} 
                          onValueChange={(value) => handleInputChange('language', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateUser.isPending}
                      className="w-full"
                    >
                      {updateUser.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive important updates via email
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationPreferences.email_notifications}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('email_notifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Get instant notifications in your browser
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={notificationPreferences.push_notifications}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('push_notifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications">SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive critical alerts via SMS
                          </p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notificationPreferences.sms_notifications}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('sms_notifications', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="weekly-digest">Weekly Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Get a weekly summary of your activity
                          </p>
                        </div>
                        <Switch
                          id="weekly-digest"
                          checked={notificationPreferences.weekly_digest}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('weekly_digest', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="instant-alerts">Instant Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified immediately for critical events
                          </p>
                        </div>
                        <Switch
                          id="instant-alerts"
                          checked={notificationPreferences.instant_alerts}
                          onCheckedChange={(checked) => 
                            handleNotificationChange('instant_alerts', checked)
                          }
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveNotifications}
                      disabled={updateUser.isPending}
                      className="w-full"
                    >
                      {updateUser.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Authentication Info - Read Only */}
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Authentication
                    </CardTitle>
                    <CardDescription>
                      Your authentication method and security status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Authentication Method</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge>Google SSO</Badge>
                        <span className="text-sm text-muted-foreground">
                          Domain: @hahahaproduction.com
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Session Status</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Active session with sliding expiration (30 days)
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Password management is disabled. Authentication is handled exclusively 
                        through Google SSO for enhanced security.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <SessionsContent />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Separate component for Sessions to manage its own hooks
function SessionsContent() {
  const { data: sessionsData, isLoading, error } = useCurrentUserSessions();
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();

  const handleRevokeSession = (sessionKey: string) => {
    revokeSession.mutate(sessionKey);
  };

  const handleRevokeAllSessions = () => {
    revokeAllSessions.mutate();
  };

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Unable to load sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load your active sessions. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active sessions across all devices. Sessions expire automatically after 30 days of inactivity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionsData ? (
          <SessionManagementPanel
            sessions={sessionsData.sessions}
            maxSessions={sessionsData.max_allowed || 5}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
            isRevokingSingle={revokeSession.isPending}
            isRevokingAll={revokeAllSessions.isPending}
            isLoading={false}
            error={null}
            isAdmin={false}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No session data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}