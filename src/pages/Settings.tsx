import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, Users, Save, Camera, Loader2, CheckCircle2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCurrentUserProfile, useUpdateProfileWithImage, useDepartmentUsers } from '@/api/hooks/useUsers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationSettings } from '@/components/settings/NotificationSettings';

const getStatusConfig = (status: boolean): { variant: any; icon: any } => {
  return status
    ? { variant: 'success', icon: CheckCircle2 }
    : { variant: 'secondary', icon: CheckCircle2 };
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch current user data
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUserProfile();

  // Fetch department users
  const { data: departmentUsersData, isLoading: isLoadingDepartment } = useDepartmentUsers();

  // Update profile mutation
  const updateProfile = useUpdateProfileWithImage();

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || '');
      setLastName(currentUser.last_name || '');
      setPreviewUrl(currentUser.profile_picture || null);
    }
  }, [currentUser]);

  // Handle profile picture change
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

  // Handle save profile
  const handleSaveProfile = async () => {
    const data: any = {};

    if (firstName !== currentUser?.first_name) data.first_name = firstName;
    if (lastName !== currentUser?.last_name) data.last_name = lastName;
    if (profilePicture) data.profile_picture = profilePicture;

    if (Object.keys(data).length > 0) {
      await updateProfile.mutateAsync(data);
    }
  };

  const hasChanges =
    firstName !== (currentUser?.first_name || '') ||
    lastName !== (currentUser?.last_name || '') ||
    profilePicture !== null;

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-500/10 via-gray-500/10 to-zinc-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-400/30 to-gray-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-zinc-400/30 to-stone-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Settings
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Manage your profile and view your team members
              </p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                    <UserIcon className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingUser ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={previewUrl || undefined} alt={currentUser?.full_name || ''} />
                          <AvatarFallback className="text-2xl">
                            {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
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
                          value={currentUser?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      {/* First Name */}
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>

                      {/* Last Name */}
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>

                      {/* Save Button */}
                      <Button
                        className="w-full"
                        onClick={handleSaveProfile}
                        disabled={!hasChanges || updateProfile.isPending}
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
    </AppLayout>
  );
} 