import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUserProfile, useDepartmentUsers, useUpdateProfileWithImage } from '@/api/hooks/useUsers';
import {
  User, Save, Loader2, Users, CheckCircle2, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const getStatusConfig = (status: boolean): { variant: any; icon: any } => {
  return status
    ? { variant: 'success', icon: CheckCircle2 }
    : { variant: 'secondary', icon: CheckCircle2 };
};

export default function Profile() {
  const { data: user, isLoading, error } = useCurrentUserProfile();
  const updateProfile = useUpdateProfileWithImage();
  const { data: departmentUsersData, isLoading: isLoadingDepartment } = useDepartmentUsers();
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize form data when user data loads
  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
      setPreviewUrl(user.profile_picture || null);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    const data: any = {};

    if (formData.first_name !== user?.first_name) data.first_name = formData.first_name;
    if (formData.last_name !== user?.last_name) data.last_name = formData.last_name;
    if (profilePicture) data.profile_picture = profilePicture;

    if (Object.keys(data).length > 0) {
      await updateProfile.mutateAsync(data);
      setProfilePicture(null); // Reset after save
    }
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
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map(role => (
                      <Badge key={role} className={getRoleBadgeColor(role)}>
                        {role.replace(/_/g, ' ')}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned</p>
                  )}
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
                
                {user.date_joined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {format(new Date(user.date_joined), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}

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
          </div>

          {/* Right Column - Settings Tabs */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-14 shadow-lg">
                <TabsTrigger
                  value="profile"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {/* Profile Picture */}
                          <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src={previewUrl || undefined} alt={user?.full_name || ''} />
                              <AvatarFallback className="text-2xl">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="hidden"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Change Photo
                            </Button>
                          </div>

                          {/* Email (disabled) */}
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="bg-muted"
                            />
                          </div>

                          {/* First Name */}
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.first_name}
                              onChange={(e) => handleInputChange('first_name', e.target.value)}
                            />
                          </div>

                          {/* Last Name */}
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.last_name}
                              onChange={(e) => handleInputChange('last_name', e.target.value)}
                            />
                          </div>

                          {/* Save Button */}
                          <Button
                            className="w-full"
                            onClick={handleSaveProfile}
                            disabled={!formData.first_name || !formData.last_name || updateProfile.isPending}
                          >
                            {updateProfile.isPending ? (
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
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Team Members
                      </CardTitle>
                      <CardDescription>
                        Members from your department
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingDepartment ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : departmentUsersData?.results && departmentUsersData.results.length > 0 ? (
                        <div className="space-y-3">
                          {departmentUsersData.results.map((member) => {
                            const statusConfig = getStatusConfig(member.is_active);
                            return (
                              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.profile_picture || undefined} alt={member.full_name} />
                                    <AvatarFallback className="text-sm">
                                      {member.first_name?.[0]}{member.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{member.full_name}</div>
                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                  </div>
                                </div>
                                <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                                  {member.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No team members found in your department
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <NotificationSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}