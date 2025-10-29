import React from 'react';
import { User } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserIcon,
  Mail,
  Building,
  Hash,
  Globe,
  Calendar,
  Clock,
  Phone,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';

interface OverviewTabProps {
  user: User;
  editMode: boolean;
  formData: Partial<User>;
  setFormData: (data: Partial<User>) => void;
}

export function OverviewTab({ user, editMode, formData, setFormData }: OverviewTabProps) {
  const handleInputChange = (field: keyof User, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              {editMode ? (
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium py-2">{user.first_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              {editMode ? (
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                />
              ) : (
                <p className="text-sm font-medium py-2">{user.last_name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {editMode ? (
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              ) : (
                <p className="text-sm font-medium py-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user.email}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              {editMode ? (
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="employee_id"
                    value={formData.employee_id || ''}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    className="pl-10"
                  />
                </div>
              ) : (
                <p className="text-sm font-medium py-2 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {user.employee_id || 'Not set'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              {editMode ? (
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="pl-10"
                  />
                </div>
              ) : (
                <p className="text-sm font-medium py-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {user.department || 'Not assigned'}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="is_active">Account Status</Label>
              {editMode ? (
                <div className="flex items-center space-x-2 py-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="font-normal cursor-pointer">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              ) : (
                <p className="text-sm font-medium py-2">
                  {user.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </p>
              )}
            </div>
            
            {user.groups && user.groups.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label>Groups</Label>
                <div className="flex flex-wrap gap-2 py-2">
                  {user.groups.map((group) => (
                    <span
                      key={group.id}
                      className="px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              {editMode ? (
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium py-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {user.timezone}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              {editMode ? (
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium py-2">{user.language ? user.language.toUpperCase() : '—'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date Joined</Label>
              <p className="text-sm font-medium py-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(user.date_joined), 'MMMM dd, yyyy')}
              </p>
            </div>
            
            {user.last_login && (
              <div className="space-y-2">
                <Label>Last Login</Label>
                <p className="text-sm font-medium py-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(user.last_login), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
            
            {user.created_at && (
              <div className="space-y-2">
                <Label>Created At</Label>
                <p className="text-sm font-medium py-2">
                  {format(new Date(user.created_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
            
            {user.updated_at && (
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <p className="text-sm font-medium py-2">
                  {format(new Date(user.updated_at), 'MMMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
