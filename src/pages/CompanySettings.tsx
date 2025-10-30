import React, { useState, useEffect } from 'react';
import { Loader2, Save, Building2, Mail, Phone, Globe, MapPin, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import { useCompanySettings, useUpdateCompanySettings } from '@/api/hooks/useSettings';

export default function CompanySettings() {
  const { data: companySettings, isLoading, error } = useCompanySettings();
  const updateCompanySettings = useUpdateCompanySettings();

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cif, setCif] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [language, setLanguage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when settings load
  useEffect(() => {
    if (companySettings) {
      setCompanyName(companySettings.company_name || '');
      setLegalName(companySettings.legal_name || '');
      setAdminName(companySettings.admin_name || '');
      setAdminRole(companySettings.admin_role || '');
      setRegistrationNumber(companySettings.registration_number || '');
      setCif(companySettings.cif || '');
      setVatNumber(companySettings.vat_number || '');
      setEmail(companySettings.email || '');
      setPhone(companySettings.phone || '');
      setWebsite(companySettings.website || '');
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
      setLanguage(companySettings.language || 'en');
    }
  }, [companySettings]);

  const handleSave = async () => {
    try {
      await updateCompanySettings.mutateAsync({
        company_name: companyName,
        legal_name: legalName,
        admin_name: adminName,
        admin_role: adminRole,
        registration_number: registrationNumber,
        cif,
        vat_number: vatNumber,
        email,
        phone,
        website,
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
        language,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load company settings. Please try again.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-400/30 to-lime-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text flex items-center gap-3">
                <Building2 className="h-10 w-10" />
                Company Settings
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Manage your company information and system preferences
              </p>
            </div>
            <Button onClick={handleSave} disabled={!hasChanges || updateCompanySettings.isPending} className="shadow-lg">
              {updateCompanySettings.isPending ? (
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
          </div>
        </div>

        {/* Basic Information */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Basic Information</CardTitle>
            </div>
            <CardDescription>Your company's primary information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => handleFieldChange(setCompanyName, e.target.value)}
                  placeholder="Trading name"
                />
              </div>
              <div>
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={legalName}
                  onChange={(e) => handleFieldChange(setLegalName, e.target.value)}
                  placeholder="Official registered name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin_name">Administrator Name</Label>
                <Input
                  id="admin_name"
                  value={adminName}
                  onChange={(e) => handleFieldChange(setAdminName, e.target.value)}
                  placeholder="Full name"
                />
                <p className="text-xs text-muted-foreground mt-1">Company representative/administrator</p>
              </div>
              <div>
                <Label htmlFor="admin_role">Administrator Role</Label>
                <Input
                  id="admin_role"
                  value={adminRole}
                  onChange={(e) => handleFieldChange(setAdminRole, e.target.value)}
                  placeholder="Administrator"
                />
                <p className="text-xs text-muted-foreground mt-1">Role or title (e.g., Administrator, Director General)</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="registration_number">Registration Number (Nr. Înregistrare)</Label>
                <Input
                  id="registration_number"
                  value={registrationNumber}
                  onChange={(e) => handleFieldChange(setRegistrationNumber, e.target.value)}
                  placeholder="J40/12345/2020"
                />
                <p className="text-xs text-muted-foreground mt-1">Trade Registry number</p>
              </div>
              <div>
                <Label htmlFor="cif">C.I.F. (Cod de Identificare Fiscală)</Label>
                <Input
                  id="cif"
                  value={cif}
                  onChange={(e) => handleFieldChange(setCif, e.target.value)}
                  placeholder="RO12345678"
                />
                <p className="text-xs text-muted-foreground mt-1">Tax identification code</p>
              </div>
              <div>
                <Label htmlFor="vat_number">VAT Number (optional)</Label>
                <Input
                  id="vat_number"
                  value={vatNumber}
                  onChange={(e) => handleFieldChange(setVatNumber, e.target.value)}
                  placeholder="Leave empty to use C.I.F."
                />
                <p className="text-xs text-muted-foreground mt-1">If different from C.I.F.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Contact Information</CardTitle>
            </div>
            <CardDescription>How to reach your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange(setEmail, e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => handleFieldChange(setWebsite, e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <CardTitle>Address</CardTitle>
            </div>
            <CardDescription>Your company's physical location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => handleFieldChange(setAddress, e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => handleFieldChange(setCity, e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={state}
                  onChange={(e) => handleFieldChange(setState, e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP/Postal Code</Label>
                <Input
                  id="zip_code"
                  value={zipCode}
                  onChange={(e) => handleFieldChange(setZipCode, e.target.value)}
                  placeholder="10001"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => handleFieldChange(setCountry, e.target.value)}
                  placeholder="United States"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Bank Details</CardTitle>
            </div>
            <CardDescription>Banking information for contracts and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankName}
                  onChange={(e) => handleFieldChange(setBankName, e.target.value)}
                  placeholder="Bank of America"
                />
              </div>
              <div>
                <Label htmlFor="bank_account">Account Number / IBAN</Label>
                <Input
                  id="bank_account"
                  value={bankAccount}
                  onChange={(e) => handleFieldChange(setBankAccount, e.target.value)}
                  placeholder="RO49AAAA1B31007593840000"
                />
              </div>
              <div>
                <Label htmlFor="bank_swift">SWIFT/BIC Code</Label>
                <Input
                  id="bank_swift"
                  value={bankSwift}
                  onChange={(e) => handleFieldChange(setBankSwift, e.target.value)}
                  placeholder="AAAAROBB"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>Localization and regional preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => handleFieldChange(setTimezone, e.target.value)}
                  placeholder="UTC"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => handleFieldChange(setCurrency, e.target.value)}
                  placeholder="EUR"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => handleFieldChange(setLanguage, e.target.value)}
                  placeholder="en"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {companySettings?.updated_at && (
          <div className="text-sm text-muted-foreground text-right">
            Last updated: {new Date(companySettings.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
