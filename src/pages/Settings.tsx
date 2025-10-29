import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Bell, Palette, Database, Globe, CreditCard, Key, Users, Building, Mail, Phone, MapPin, Save, Eye, EyeOff, Trash2, Plus, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCompanySettings, useUpdateCompanySettings } from '@/api/hooks/useSettings';
import { toast } from 'sonner';

// Mock data for user settings
const userSettings = {
  profile: {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@studioflow.com",
    phone: "+1 (555) 123-4567",
    role: "Studio Admin",
    avatar: "JS",
    department: "Production",
    location: "Los Angeles, CA",
    timezone: "America/Los_Angeles",
    language: "English"
  },
  preferences: {
    theme: "light",
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: "public",
      activityFeed: true,
      analytics: true
    }
  },
  security: {
    twoFactorEnabled: true,
    lastPasswordChange: "2024-01-01",
    loginHistory: [
      { date: "2024-01-15", location: "Los Angeles, CA", device: "Chrome on MacBook Pro" },
      { date: "2024-01-14", location: "Los Angeles, CA", device: "Chrome on MacBook Pro" },
      { date: "2024-01-13", location: "New York, NY", device: "Safari on iPhone" }
    ]
  }
};

// Mock data for system settings
const systemSettings = {
  studio: {
    name: "StudioFlow Records",
    address: "123 Music Row, Los Angeles, CA 90210",
    phone: "+1 (555) 987-6543",
    email: "info@studioflow.com",
    website: "https://studioflow.com",
    timezone: "America/Los_Angeles",
    currency: "USD",
    language: "English"
  },
  integrations: [
    {
      name: "Spotify",
      status: "Connected",
      lastSync: "2024-01-15T10:30:00",
      type: "Music Platform"
    },
    {
      name: "Apple Music",
      status: "Connected",
      lastSync: "2024-01-15T09:15:00",
      type: "Music Platform"
    },
    {
      name: "Pro Tools",
      status: "Connected",
      lastSync: "2024-01-15T08:45:00",
      type: "DAW"
    },
    {
      name: "Logic Pro",
      status: "Disconnected",
      lastSync: "2024-01-10T14:20:00",
      type: "DAW"
    }
  ],
  backup: {
    lastBackup: "2024-01-15T02:00:00",
    nextBackup: "2024-01-16T02:00:00",
    frequency: "Daily",
    retention: "30 days",
    location: "AWS S3"
  }
};

// Mock data for team members
const teamMembers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@studioflow.com",
    role: "Studio Admin",
    status: "Active",
    lastLogin: "2024-01-15T10:30:00",
    avatar: "JS"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@studioflow.com",
    role: "Legal Manager",
    status: "Active",
    lastLogin: "2024-01-15T09:15:00",
    avatar: "SJ"
  },
  {
    id: 3,
    name: "Mike Wilson",
    email: "mike.wilson@studioflow.com",
    role: "Studio Engineer",
    status: "Active",
    lastLogin: "2024-01-15T08:45:00",
    avatar: "MW"
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "lisa.chen@studioflow.com",
    role: "Catalog Manager",
    status: "Inactive",
    lastLogin: "2024-01-10T14:20:00",
    avatar: "LC"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Inactive':
      return 'bg-gray-100 text-gray-800';
    case 'Connected':
      return 'bg-green-100 text-green-800';
    case 'Disconnected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Company Settings hooks
  const { data: companySettings, isLoading: isLoadingCompany } = useCompanySettings();
  const updateCompanySettings = useUpdateCompanySettings();

  // Company settings form state
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('EUR');
  const [hasCompanyChanges, setHasCompanyChanges] = useState(false);

  // Initialize company settings form
  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings.company_name || '');
      setLegalName(companySettings.legal_name || '');
      setRegistrationNumber(companySettings.registration_number || '');
      setVatNumber(companySettings.vat_number || '');
      setCompanyEmail(companySettings.email || '');
      setCompanyPhone(companySettings.phone || '');
      setCompanyWebsite(companySettings.website || '');
      setAddress(companySettings.address || '');
      setCity(companySettings.city || '');
      setState(companySettings.state || '');
      setZipCode(companySettings.zip_code || '');
      setCountry(companySettings.country || '');
      setBankName(companySettings.bank_name || '');
      setBankAccount(companySettings.bank_account || '');
      setBankSwift(companySettings.bank_swift || '');
      setTimezone(companySettings.timezone || 'UTC');
      setCurrency(companySettings.currency || 'EUR');
    }
  }, [companySettings]);

  const handleCompanyFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasCompanyChanges(true);
  };

  const handleSaveCompanySettings = async () => {
    try {
      await updateCompanySettings.mutateAsync({
        company_name: companyName,
        legal_name: legalName,
        registration_number: registrationNumber,
        vat_number: vatNumber,
        email: companyEmail,
        phone: companyPhone,
        website: companyWebsite,
        address,
        city,
        state,
        zip_code: zipCode,
        country,
        bank_name: bankName,
        bank_account: bankAccount,
        bank_swift: bankSwift,
        timezone,
        currency,
      });
      setHasCompanyChanges(false);
    } catch (error) {
      console.error('Failed to save company settings:', error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account, preferences, and system configuration</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
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
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={userSettings.profile.firstName} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={userSettings.profile.lastName} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={userSettings.profile.email} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={userSettings.profile.phone} />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue={userSettings.profile.department} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue={userSettings.profile.location} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue={userSettings.profile.timezone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue={userSettings.profile.language}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Team Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Members
                    </CardTitle>
                    <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription>
                            Invite a new team member to join your studio
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="newFirstName">First Name</Label>
                              <Input id="newFirstName" />
                            </div>
                            <div>
                              <Label htmlFor="newLastName">Last Name</Label>
                              <Input id="newLastName" />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="newEmail">Email</Label>
                            <Input id="newEmail" type="email" />
                          </div>
                          <div>
                            <Label htmlFor="newRole">Role</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="studio-admin">Studio Admin</SelectItem>
                                <SelectItem value="legal-manager">Legal Manager</SelectItem>
                                <SelectItem value="studio-engineer">Studio Engineer</SelectItem>
                                <SelectItem value="catalog-manager">Catalog Manager</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                          <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setShowAddMemberDialog(false)}>
                            Add Member
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select defaultValue={userSettings.preferences.theme}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked={userSettings.preferences.notifications.email} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
                    </div>
                    <Switch id="push-notifications" defaultChecked={userSettings.preferences.notifications.push} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS notifications</p>
                    </div>
                    <Switch id="sms-notifications" defaultChecked={userSettings.preferences.notifications.sms} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Password & Security
                  </CardTitle>
                  <CardDescription>
                    Update your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="current-password" 
                        type={passwordVisible ? "text" : "password"}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch id="two-factor" defaultChecked={userSettings.security.twoFactorEnabled} />
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              {/* Login History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Login History
                  </CardTitle>
                  <CardDescription>
                    Recent login activity on your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userSettings.security.loginHistory.map((login, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{login.device}</div>
                          <div className="text-sm text-muted-foreground">{login.location}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(login.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Update your company details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCompany ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="company-name">Company Name *</Label>
                            <Input
                              id="company-name"
                              value={companyName}
                              onChange={(e) => handleCompanyFieldChange(setCompanyName, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="legal-name">Legal Name</Label>
                            <Input
                              id="legal-name"
                              value={legalName}
                              onChange={(e) => handleCompanyFieldChange(setLegalName, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="reg-number">Registration Number</Label>
                            <Input
                              id="reg-number"
                              value={registrationNumber}
                              onChange={(e) => handleCompanyFieldChange(setRegistrationNumber, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="vat-number">VAT Number</Label>
                            <Input
                              id="vat-number"
                              value={vatNumber}
                              onChange={(e) => handleCompanyFieldChange(setVatNumber, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Contact Information</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="company-email">Email</Label>
                            <Input
                              id="company-email"
                              type="email"
                              value={companyEmail}
                              onChange={(e) => handleCompanyFieldChange(setCompanyEmail, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="company-phone">Phone</Label>
                            <Input
                              id="company-phone"
                              value={companyPhone}
                              onChange={(e) => handleCompanyFieldChange(setCompanyPhone, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="company-website">Website</Label>
                            <Input
                              id="company-website"
                              value={companyWebsite}
                              onChange={(e) => handleCompanyFieldChange(setCompanyWebsite, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Address</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="address">Street Address</Label>
                            <Input
                              id="address"
                              value={address}
                              onChange={(e) => handleCompanyFieldChange(setAddress, e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={city}
                                onChange={(e) => handleCompanyFieldChange(setCity, e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State/Province</Label>
                              <Input
                                id="state"
                                value={state}
                                onChange={(e) => handleCompanyFieldChange(setState, e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="zip">ZIP/Postal Code</Label>
                              <Input
                                id="zip"
                                value={zipCode}
                                onChange={(e) => handleCompanyFieldChange(setZipCode, e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="country">Country</Label>
                              <Input
                                id="country"
                                value={country}
                                onChange={(e) => handleCompanyFieldChange(setCountry, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Bank Details</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="bank-name">Bank Name</Label>
                            <Input
                              id="bank-name"
                              value={bankName}
                              onChange={(e) => handleCompanyFieldChange(setBankName, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="bank-account">Account Number / IBAN</Label>
                            <Input
                              id="bank-account"
                              value={bankAccount}
                              onChange={(e) => handleCompanyFieldChange(setBankAccount, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="bank-swift">SWIFT/BIC Code</Label>
                            <Input
                              id="bank-swift"
                              value={bankSwift}
                              onChange={(e) => handleCompanyFieldChange(setBankSwift, e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* System Settings */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">System Settings</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="timezone">Timezone</Label>
                            <Input
                              id="timezone"
                              value={timezone}
                              onChange={(e) => handleCompanyFieldChange(setTimezone, e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                              id="currency"
                              value={currency}
                              onChange={(e) => handleCompanyFieldChange(setCurrency, e.target.value)}
                              maxLength={3}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleSaveCompanySettings}
                        disabled={!hasCompanyChanges || updateCompanySettings.isPending}
                      >
                        {updateCompanySettings.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Company Settings
                          </>
                        )}
                      </Button>

                      {companySettings?.updated_at && (
                        <div className="text-sm text-muted-foreground text-right">
                          Last updated: {new Date(companySettings.updated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Integrations
                  </CardTitle>
                  <CardDescription>
                    Manage your connected services and applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemSettings.integrations.map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">{integration.type}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup & Recovery
                </CardTitle>
                <CardDescription>
                  Manage your data backup and recovery settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Last Backup</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(systemSettings.backup.lastBackup).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label>Next Backup</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(systemSettings.backup.nextBackup).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label>Backup Location</Label>
                    <div className="text-sm text-muted-foreground">
                      {systemSettings.backup.location}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Run Manual Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 