import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Trash2, Mail, Phone, MapPin, Calendar, User, Building2, Hash, CreditCard, Percent, UserCheck, Loader2, Save, Send, Eye, DollarSign, EyeOff, Plus, Pencil, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEntityDetail } from '@/api/hooks/useEntities';
import { useArtistAnalyticsDetail, useClientAnalyticsDetail, useBrandAnalyticsDetail } from '@/api/hooks/useCampaigns';
import { useWorks, useRecordings, useReleases } from '@/api/hooks/useCatalog';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { EntityFormDialog } from '@/pages/crm/components/EntityFormDialog';
import { ContactPersonFormDialog } from '@/pages/crm/components/ContactPersonFormDialog';
import { EntityRequestDialog } from '@/pages/crm/components/EntityRequestDialog';
import { toast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { ENGAGEMENT_STAGE_COLORS, CONTACT_SENTIMENT_COLORS } from '@/types/contact';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Users, Package, Music, Disc, Album } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/api/client';
import entitiesService from '@/api/services/entities.service';
import { useAuthStore } from '@/stores/authStore';

// Contract generation types
interface Template {
  id: number
  name: string
  description: string
  placeholders: string[]
}

// Commission rates by category
interface CommissionRates {
  concert: string
  image_rights: string
  rights: string
  merchandising: string
  ppd: string
  emd: string
  sync: string
}

// Year-by-year commission structure
type CommissionByYear = Record<string, CommissionRates>;

// Rights categories that can be enabled/disabled
interface EnabledRights {
  concert: boolean
  image_rights: boolean
  rights: boolean
  merchandising: boolean
  ppd: boolean
  emd: boolean
  sync: boolean
}

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'administrator';
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showContractGeneration, setShowContractGeneration] = useState(false);
  const [entityRequestDialogOpen, setEntityRequestDialogOpen] = useState(false);
  const [entityRequestType, setEntityRequestType] = useState<'edit' | 'delete'>('edit');

  // Contact Person state
  const [contactPersonDialogOpen, setContactPersonDialogOpen] = useState(false);
  const [editingContactPerson, setEditingContactPerson] = useState<any | null>(null);

  // Reveal sensitive data state
  const [revealedCNP, setRevealedCNP] = useState<string | null>(null);
  const [revealedPassportNumber, setRevealedPassportNumber] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  // Social Media state
  const [socialMediaDialogOpen, setSocialMediaDialogOpen] = useState(false);
  const [editingSocialMedia, setEditingSocialMedia] = useState<any | null>(null);
  const [socialMediaForm, setSocialMediaForm] = useState({
    platform: 'instagram',
    handle: '',
    url: '',
    display_name: '',
    follower_count: '',
    is_verified: false,
    is_primary: false,
  });
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);

  // Contract generation state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate] = useState<string>('2'); // Always use template ID 2 for artists

  // Contracts state
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  // Contract Terms
  const [contractTerms, setContractTerms] = useState({
    contract_duration_years: '3',
    notice_period_days: '30',
    auto_renewal: false,
    auto_renewal_years: '1',
    minimum_launches_per_year: '2',
    max_investment_per_song: '5000',
    max_investment_per_year: '50000',
    penalty_amount: '10000',
    currency: 'EUR',
    start_date: new Date().toISOString().split('T')[0],
    special_terms: ''
  });

  // Commission Structure (year-by-year)
  const [commissionByYear, setCommissionByYear] = useState<CommissionByYear>({
    '1': { concert: '20', image_rights: '30', rights: '25', merchandising: '20', ppd: '5', emd: '5', sync: '20' },
    '2': { concert: '20', image_rights: '30', rights: '25', merchandising: '20', ppd: '5', emd: '5', sync: '20' },
    '3': { concert: '10', image_rights: '20', rights: '15', merchandising: '10', ppd: '3', emd: '3', sync: '10' }
  });

  // Rights categories visibility
  const [enabledRights, setEnabledRights] = useState<EnabledRights>({
    concert: true,
    image_rights: true,
    rights: true,
    merchandising: true,
    ppd: true,
    emd: true,
    sync: true
  });

  // Preview data
  const [previewData, setPreviewData] = useState<any>(null);
  const [missingPlaceholders, setMissingPlaceholders] = useState<string[]>([]);

  const { data: entity, isLoading, error } = useEntityDetail(Number(id));

  // Check entity roles
  const isArtist = entity?.entity_roles?.some(role => role.role === 'artist') || false;
  const isClient = entity?.entity_roles?.some(role => role.role === 'client') || false;
  const isBrand = entity?.entity_roles?.some(role => role.role === 'brand') || false;
  const hasCampaigns = isArtist || isClient || isBrand;

  // Fetch analytics for different roles
  const { data: artistAnalytics } = useArtistAnalyticsDetail(Number(id), isArtist && !!id);
  const { data: clientAnalytics } = useClientAnalyticsDetail(Number(id), isClient && !!id);
  const { data: brandAnalytics } = useBrandAnalyticsDetail(Number(id), isBrand && !!id);

  // Fetch catalog data for entities with creative roles
  const { data: worksData } = useWorks({ entity_id: Number(id), page_size: 100 });
  const { data: recordingsData } = useRecordings({ entity_id: Number(id), page_size: 100 });
  const { data: releasesData } = useReleases({ entity_id: Number(id), page_size: 100 });

  useEffect(() => {
    if (showContractGeneration) {
      loadTemplates();
      loadDraft();
    }
  }, [showContractGeneration]);

  const loadTemplates = async () => {
    try {
      const response = await apiClient.get('/api/v1/templates/');
      setTemplates(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      sonnerToast.error('Failed to load contract templates');
    }
  };

  const loadDraft = async () => {
    if (!id) return;

    try {
      const response = await apiClient.get('/api/v1/contracts/load_draft/', {
        params: { entity_id: id }
      });

      if (response.data.draft_data) {
        setContractTerms(response.data.draft_data.contract_terms || contractTerms);
        if (response.data.draft_data.commission_by_year) {
          setCommissionByYear(response.data.draft_data.commission_by_year);
        }
        if (response.data.draft_data.enabled_rights) {
          setEnabledRights(response.data.draft_data.enabled_rights);
        }
        sonnerToast.success('Draft loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const fetchContracts = async () => {
    if (!id) return;

    setContractsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/contracts/', {
        params: { counterparty_entity: id }
      });
      setContracts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      sonnerToast.error('Failed to load contracts');
    } finally {
      setContractsLoading(false);
    }
  };

  // Fetch contracts when contracts tab is opened
  useEffect(() => {
    if (activeTab === 'contracts') {
      fetchContracts();
    }
  }, [activeTab, id]);

  // Helper: Update contract duration and adjust commission years
  const updateContractDuration = (newDuration: number) => {
    const currentYears = Object.keys(commissionByYear).map(Number);
    const currentMax = Math.max(...currentYears);
    const updated = { ...commissionByYear };

    if (newDuration > currentMax) {
      // Add years - copy rates from last year
      const lastYear = updated[String(currentMax)];
      for (let i = currentMax + 1; i <= newDuration; i++) {
        updated[String(i)] = { ...lastYear };
      }
    } else if (newDuration < currentMax) {
      // Remove years beyond new duration
      for (let i = newDuration + 1; i <= currentMax; i++) {
        delete updated[String(i)];
      }
    }

    setCommissionByYear(updated);
    setContractTerms({ ...contractTerms, contract_duration_years: String(newDuration) });
  };

  // Helper: Copy a category's rate to all years
  const copyRateToAllYears = (category: keyof CommissionRates, sourceYear: string) => {
    const rate = commissionByYear[sourceYear][category];
    const updated = { ...commissionByYear };

    Object.keys(updated).forEach(year => {
      updated[year] = { ...updated[year], [category]: rate };
    });

    setCommissionByYear(updated);
  };

  // Helper: Update a specific year's category rate
  const updateCommissionRate = (year: string, category: keyof CommissionRates, value: string) => {
    setCommissionByYear({
      ...commissionByYear,
      [year]: {
        ...commissionByYear[year],
        [category]: value
      }
    });
  };

  // Helper: Toggle rights category
  const toggleRightsCategory = (category: keyof EnabledRights) => {
    setEnabledRights({
      ...enabledRights,
      [category]: !enabledRights[category]
    });
  };

  const handleRevealCNP = async () => {
    if (!entity?.sensitive_identity?.id) {
      sonnerToast.error('No sensitive identity found');
      return;
    }

    setRevealing(true);
    try {
      // Call API with automatic reason
      const response = await entitiesService.revealCNP(entity.sensitive_identity.id, 'User viewed CNP from entity details');
      setRevealedCNP(response.cnp);
      sonnerToast.success('CNP revealed');
    } catch (error: any) {
      console.error('Failed to reveal CNP:', error);

      // Check if it's a decryption error (422 status)
      if (error.response?.status === 422 && error.response?.data?.needs_reentry) {
        sonnerToast.error(
          'CNP cannot be decrypted. Please re-enter the CNP in the form below.',
          { duration: 6000 }
        );
      } else {
        sonnerToast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to reveal CNP');
      }
    } finally {
      setRevealing(false);
    }
  };

  const handleRevealPassportNumber = async () => {
    if (!entity?.sensitive_identity?.id) {
      sonnerToast.error('No sensitive identity found');
      return;
    }

    setRevealing(true);
    try {
      // Call API with automatic reason (using the same endpoint as CNP for now)
      const response = await entitiesService.revealCNP(entity.sensitive_identity.id, 'User viewed passport number from entity details');
      // The response should contain passport_number instead of CNP for passport type
      setRevealedPassportNumber(response.passport_number || response.cnp);
      sonnerToast.success('Passport number revealed');
    } catch (error: any) {
      console.error('Failed to reveal passport number:', error);

      // Check if it's a decryption error (422 status)
      if (error.response?.status === 422 && error.response?.data?.needs_reentry) {
        sonnerToast.error(
          'Passport number cannot be decrypted. Please re-enter it in the form below.',
          { duration: 6000 }
        );
      } else {
        sonnerToast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to reveal passport number');
      }
    } finally {
      setRevealing(false);
    }
  };

  const handleAddSocialMedia = () => {
    setEditingSocialMedia(null);
    setSocialMediaForm({
      platform: 'instagram',
      handle: '',
      url: '',
      display_name: '',
      follower_count: '',
      is_verified: false,
      is_primary: false,
    });
    setSocialMediaDialogOpen(true);
  };

  const handleEditSocialMedia = (account: any) => {
    setEditingSocialMedia(account);
    setSocialMediaForm({
      platform: account.platform,
      handle: account.handle || '',
      url: account.url,
      display_name: account.display_name || '',
      follower_count: account.follower_count?.toString() || '',
      is_verified: account.is_verified,
      is_primary: account.is_primary,
    });
    setSocialMediaDialogOpen(true);
  };

  const handleAddContactPerson = () => {
    setEditingContactPerson(null);
    setContactPersonDialogOpen(true);
  };

  const handleEditContactPerson = (contactPerson: any) => {
    setEditingContactPerson(contactPerson);
    setContactPersonDialogOpen(true);
  };

  const handleSaveSocialMedia = async () => {
    if (!entity?.id) return;

    if (!socialMediaForm.url.trim()) {
      sonnerToast.error('URL is required');
      return;
    }

    setSavingSocialMedia(true);
    try {
      const payload = {
        entity: entity.id,
        platform: socialMediaForm.platform,
        handle: socialMediaForm.handle.trim() || undefined,
        url: socialMediaForm.url.trim(),
        display_name: socialMediaForm.display_name.trim() || undefined,
        follower_count: socialMediaForm.follower_count ? parseInt(socialMediaForm.follower_count) : undefined,
        is_verified: socialMediaForm.is_verified,
        is_primary: socialMediaForm.is_primary,
      };

      if (editingSocialMedia) {
        await entitiesService.updateSocialMediaAccount(editingSocialMedia.id, payload);
        sonnerToast.success('Social media account updated');
      } else {
        await entitiesService.createSocialMediaAccount(payload);
        sonnerToast.success('Social media account added');
      }

      setSocialMediaDialogOpen(false);
      // Refresh entity data
      window.location.reload(); // TODO: Better way to refresh
    } catch (error: any) {
      console.error('Failed to save social media account:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to save social media account');
    } finally {
      setSavingSocialMedia(false);
    }
  };

  const handleDeleteSocialMedia = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;

    try {
      await entitiesService.deleteSocialMediaAccount(accountId);
      sonnerToast.success('Social media account deleted');
      window.location.reload(); // TODO: Better way to refresh
    } catch (error: any) {
      console.error('Failed to delete social media account:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to delete social media account');
    }
  };

  const saveDraft = async () => {
    if (!id) {
      sonnerToast.error('Entity not found');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/v1/contracts/save_draft/', {
        entity_id: parseInt(id),
        draft_data: {
          contract_terms: contractTerms,
          commission_by_year: commissionByYear,
          enabled_rights: enabledRights
        }
      });
      sonnerToast.success('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      sonnerToast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };


  const previewContract = async () => {
    if (!id || !selectedTemplate) {
      sonnerToast.error('Missing required information');
      return;
    }

    setPreviewing(true);
    try {
      const response = await apiClient.post('/api/v1/contracts/preview_generation/', {
        entity_id: id,
        template_id: selectedTemplate,
        contract_terms: {
          ...contractTerms,
          commission_by_year: commissionByYear,
          enabled_rights: enabledRights
        }
      });

      setPreviewData(response.data);
      setMissingPlaceholders(response.data.missing_placeholders || []);

      if (response.data.missing_placeholders?.length > 0) {
        sonnerToast.warning(`${response.data.missing_placeholders.length} placeholders are missing values`);
      } else {
        sonnerToast.success('All placeholders have values!');
      }
    } catch (error) {
      console.error('Failed to preview contract:', error);
      sonnerToast.error('Failed to preview contract');
    } finally {
      setPreviewing(false);
    }
  };

  const generateContract = async () => {
    if (!id || !selectedTemplate) {
      sonnerToast.error('Missing required information');
      return;
    }

    if (missingPlaceholders.length > 0) {
      const proceed = confirm(`There are ${missingPlaceholders.length} missing placeholders. Do you want to proceed anyway?`);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      // Convert contract terms to proper types
      const formattedContractTerms = {
        entity_id: parseInt(id),
        contract_duration_years: parseInt(contractTerms.contract_duration_years),
        notice_period_days: parseInt(contractTerms.notice_period_days),
        auto_renewal: contractTerms.auto_renewal,
        auto_renewal_years: parseInt(contractTerms.auto_renewal_years),
        minimum_launches_per_year: parseInt(contractTerms.minimum_launches_per_year),
        max_investment_per_song: parseFloat(contractTerms.max_investment_per_song),
        max_investment_per_year: parseFloat(contractTerms.max_investment_per_year),
        penalty_amount: parseFloat(contractTerms.penalty_amount),
        currency: contractTerms.currency,
        start_date: contractTerms.start_date,
        special_terms: contractTerms.special_terms,
        commission_by_year: commissionByYear,
        enabled_rights: enabledRights
      };

      const response = await apiClient.post('/api/v1/contracts/generate_with_terms/', {
        entity_id: parseInt(id),
        template_id: parseInt(selectedTemplate),
        contract_terms: formattedContractTerms
      });

      sonnerToast.success('Contract generation started!');
      // Stay on entity page and switch to contracts tab
      setShowContractGeneration(false);
      setActiveTab('contracts');
      // Refresh contracts list
      fetchContracts();
    } catch (error) {
      console.error('Failed to generate contract:', error);
      sonnerToast.error('Failed to generate contract');
    } finally {
      setLoading(false);
    }
  };


  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !entity) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Entity not found</p>
          <Button className="mt-4" onClick={() => navigate('/entities')}>
            Back to Entities
          </Button>
        </div>
      </AppLayout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      try {
        // TODO: Implement delete API call
        toast({
          title: "Entity deleted",
          description: "The entity has been successfully deleted.",
        });
        navigate('/entities');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete entity.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerateContract = () => {
    setShowContractGeneration(true);
    setActiveTab("generate-contract");
  };

  // Check if entity has creative roles (for Social Media tab visibility)
  const hasCreativeRole = entity?.entity_roles?.some(role =>
    ['artist', 'producer', 'composer', 'lyricist', 'audio_editor'].includes(role.role)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/entities')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://avatar.vercel.sh/${entity.display_name}`} />
                <AvatarFallback>{getInitials(entity.display_name)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{entity.display_name}</h1>
                {entity.alias_name && (
                  <p className="text-lg text-muted-foreground mt-1">
                    alias: {entity.alias_name}
                  </p>
                )}
                {entity.stage_name && (
                  <p className="text-lg text-muted-foreground mt-1">
                    aka "{entity.stage_name}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={entity.kind === 'PF' ? 'default' : 'secondary'}>
                    {entity.kind === 'PF' ? (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        Physical Person
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3 w-3 mr-1" />
                        Legal Entity
                      </>
                    )}
                  </Badge>
                  {entity.entity_roles?.map((roleObj) => (
                    <Badge key={roleObj.id} variant={roleObj.primary_role ? 'default' : 'outline'}>
                      {roleObj.role_display || roleObj.role}
                      {roleObj.primary_role && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!showContractGeneration && (
              <>
                {isAdmin ? (
                  <>
                    <Button onClick={() => setEditDialogOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Entity
                    </Button>
                    {entity.kind === 'PF' && (
                      <Button variant="outline" onClick={handleGenerateContract}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Contract
                      </Button>
                    )}
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Entity
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => {
                      setEntityRequestType('edit');
                      setEntityRequestDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Request Edit
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEntityRequestType('delete');
                      setEntityRequestDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Request Delete
                    </Button>
                  </>
                )}
              </>
            )}
            {showContractGeneration && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowContractGeneration(false);
                    setActiveTab("details");
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Details
                </Button>
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={previewContract}
                  disabled={previewing}
                >
                  {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                  Preview
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex h-auto items-center justify-start gap-1 rounded-2xl bg-muted/50 p-2 backdrop-blur-xl border border-white/10 shadow-lg">
            <TabsTrigger
              value="details"
              className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
            >
              <User className="h-3.5 w-3.5 mr-1.5" />
              Details
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="identifiers"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <Hash className="h-3.5 w-3.5 mr-1.5" />
                Identifiers
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="contracts"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Contracts
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="financial"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                Financial
              </TabsTrigger>
            )}
            {isAdmin && hasCampaigns && (
              <TabsTrigger
                value="campaigns"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Campaigns
              </TabsTrigger>
            )}
            {isAdmin && hasCreativeRole && (
              <TabsTrigger
                value="catalog"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <Music className="h-3.5 w-3.5 mr-1.5" />
                Catalog
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger
                value="activity"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Activity
              </TabsTrigger>
            )}
            {hasCreativeRole && (
              <TabsTrigger
                value="social"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Social
              </TabsTrigger>
            )}
            {isAdmin && entity.kind === 'PF' && (
              <TabsTrigger
                value="sensitive"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Sensitive
              </TabsTrigger>
            )}
            {isAdmin && showContractGeneration && (
              <TabsTrigger
                value="generate-contract"
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Generate Contract
              </TabsTrigger>
            )}
          </TabsList>
          </div>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information for PF */}
              {entity.kind === 'PF' && (entity.first_name || entity.last_name) && (
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Individual details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(entity.first_name || entity.last_name) && (
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Legal Name</p>
                          <p className="font-medium">
                            {entity.first_name} {entity.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                    {entity.stage_name && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Stage Name</p>
                          <p className="font-medium">{entity.stage_name}</p>
                        </div>
                      </div>
                    )}
                    {entity.gender && (
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium">
                            {entity.gender === 'M' ? 'Male' : entity.gender === 'F' ? 'Female' : 'Other'}
                          </p>
                        </div>
                      </div>
                    )}
                    {entity.nationality && (
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{entity.nationality}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Primary contact details for this entity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entity.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{entity.email}</p>
                      </div>
                    </div>
                  )}
                  {entity.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{entity.phone}</p>
                      </div>
                    </div>
                  )}
                  {entity.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{entity.address}</p>
                        {entity.city && <p className="text-sm">{entity.city}, {entity.state} {entity.zip_code}</p>}
                        {entity.country && <p className="text-sm">{entity.country}</p>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Persons */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Contact Persons</CardTitle>
                    <CardDescription>Key contacts at this entity</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddContactPerson}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </CardHeader>
                <CardContent>
                  {entity.contact_persons && entity.contact_persons.length > 0 ? (
                    <div className="space-y-4">
                      {entity.contact_persons.map((contact: any) => (
                        <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{contact.name}</p>
                                {contact.role_display && (
                                  <Badge variant="outline">{contact.role_display}</Badge>
                                )}
                              </div>
                              <div className="flex gap-2 mt-2">
                                {contact.engagement_stage && (
                                  <Badge className={ENGAGEMENT_STAGE_COLORS[contact.engagement_stage]}>
                                    {contact.engagement_stage_display}
                                  </Badge>
                                )}
                                {contact.sentiment && (
                                  <Badge className={CONTACT_SENTIMENT_COLORS[contact.sentiment]}>
                                    {contact.sentiment_display}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContactPerson(contact)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Emails */}
                          {contact.emails && contact.emails.length > 0 && (
                            <div className="space-y-1">
                              {contact.emails.map((email: any) => (
                                <div key={email.id} className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{email.label || 'Email'}:</span>
                                  <span>{email.email}</span>
                                  {email.is_primary && (
                                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Phones */}
                          {contact.phones && contact.phones.length > 0 && (
                            <div className="space-y-1">
                              {contact.phones.map((phone: any) => (
                                <div key={phone.id} className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{phone.label || 'Phone'}:</span>
                                  <span>{phone.phone_number}</span>
                                  {phone.is_primary && (
                                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          {contact.notes && (
                            <div className="text-sm text-muted-foreground">
                              <p className="italic">"{contact.notes}"</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No contact persons added yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddContactPerson}
                        className="mt-4"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Contact Person
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Information */}
              {entity.kind === 'PJ' && (
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Company registration and tax details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.company_registration_number && (
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Registration Number</p>
                          <p className="font-medium">{entity.company_registration_number}</p>
                        </div>
                      </div>
                    )}
                    {entity.vat_number && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">VAT Number</p>
                          <p className="font-medium">{entity.vat_number}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Banking Information */}
              {(entity.iban || entity.bank_name || entity.bank_branch) && (
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle>Banking Information</CardTitle>
                    <CardDescription>Bank account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entity.iban && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">IBAN</p>
                          <p className="font-medium font-mono">{entity.iban}</p>
                        </div>
                      </div>
                    )}
                    {entity.bank_name && (
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Bank Name</p>
                          <p className="font-medium">{entity.bank_name}</p>
                        </div>
                      </div>
                    )}
                    {entity.bank_branch && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Bank Branch</p>
                          <p className="font-medium">{entity.bank_branch}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* System Information */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Metadata and tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(entity.created_at), 'PPpp')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{format(new Date(entity.updated_at), 'PPpp')}</p>
                    </div>
                  </div>
                  {entity.created_by && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Created By</p>
                        <p className="font-medium">{entity.created_by}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {entity.notes && (
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>Internal notes about this entity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{entity.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          {isArtist && (
            <TabsContent value="campaigns" className="space-y-6">
              {artistAnalytics ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{artistAnalytics.total_campaigns}</div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          ${parseFloat(artistAnalytics.total_value).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{artistAnalytics.unique_clients}</div>
                      </CardContent>
                    </Card>

                    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{artistAnalytics.unique_brands}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Avg Campaign Value */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Campaign Value</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${artistAnalytics.total_campaigns > 0
                          ? (parseFloat(artistAnalytics.total_value) / artistAnalytics.total_campaigns).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 }
                            )
                          : 0}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Breakdown */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Campaign Status Breakdown</CardTitle>
                      <CardDescription>Distribution of campaigns across different statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(artistAnalytics.campaigns_by_status).map(([status, count]) => (
                          <Badge
                            key={status}
                            className={`${CAMPAIGN_STATUS_COLORS[status as keyof typeof CAMPAIGN_STATUS_COLORS]} px-4 py-2 text-sm`}
                          >
                            {CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS]}: {count as number}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Brands */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Brands by Campaign Count</CardTitle>
                      <CardDescription>Brands this artist has worked with</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Brand</TableHead>
                            <TableHead className="text-right">Campaigns</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {artistAnalytics.brands.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No brands found
                              </TableCell>
                            </TableRow>
                          ) : (
                            artistAnalytics.brands.map((brand) => (
                              <TableRow key={brand.id}>
                                <TableCell className="font-medium">{brand.name}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">{brand.campaign_count}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Top Clients */}
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Clients by Campaign Count</CardTitle>
                      <CardDescription>Clients this artist has worked with</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-right">Campaigns</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {artistAnalytics.clients.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No clients found
                              </TableCell>
                            </TableRow>
                          ) : (
                            artistAnalytics.clients.map((client) => (
                              <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary">{client.campaign_count}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </TabsContent>
          )}

          {/* Catalog Tab */}
          {hasCreativeRole && (
            <TabsContent value="catalog" className="space-y-6">
              {/* Works */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      Works
                    </CardTitle>
                    <CardDescription>Musical works with credits for this entity</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/catalog/works')}
                  >
                    View All Works
                  </Button>
                </CardHeader>
                <CardContent>
                  {worksData && worksData.results && worksData.results.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>ISWC</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Genre</TableHead>
                          <TableHead>Recordings</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {worksData.results.map((work) => (
                          <TableRow key={work.id}>
                            <TableCell className="font-medium">{work.title}</TableCell>
                            <TableCell className="font-mono text-sm">{work.iswc || '—'}</TableCell>
                            <TableCell>{work.language?.toUpperCase() || '—'}</TableCell>
                            <TableCell>{work.genre || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{work.recordings_count || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/catalog/works/${work.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No works found with credits for this entity
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recordings */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Disc className="h-5 w-5" />
                      Recordings
                    </CardTitle>
                    <CardDescription>Audio recordings with credits for this entity</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/catalog/recordings')}
                  >
                    View All Recordings
                  </Button>
                </CardHeader>
                <CardContent>
                  {recordingsData && recordingsData.results && recordingsData.results.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>ISRC</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recordingsData.results.map((recording) => (
                          <TableRow key={recording.id}>
                            <TableCell className="font-medium">{recording.title}</TableCell>
                            <TableCell className="font-mono text-sm">{recording.isrc || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{recording.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{recording.status}</Badge>
                            </TableCell>
                            <TableCell>{recording.formatted_duration || '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/catalog/recordings/${recording.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recordings found with credits for this entity
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Releases */}
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Album className="h-5 w-5" />
                      Releases
                    </CardTitle>
                    <CardDescription>Album and single releases featuring this entity</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/catalog/releases')}
                  >
                    View All Releases
                  </Button>
                </CardHeader>
                <CardContent>
                  {releasesData && releasesData.results && releasesData.results.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>UPC</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Release Date</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {releasesData.results.map((release) => (
                          <TableRow key={release.id}>
                            <TableCell className="font-medium">{release.title}</TableCell>
                            <TableCell className="font-mono text-sm">{release.upc || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{release.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{release.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {release.release_date ? format(new Date(release.release_date), 'MMM d, yyyy') : '—'}
                            </TableCell>
                            <TableCell>{release.label_name || '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/catalog/releases/${release.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No releases found featuring this entity
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Contract Generation Tab */}
          {showContractGeneration && (
            <TabsContent value="generate-contract" className="space-y-4">
              <Tabs defaultValue="terms" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="terms">
                    <FileText className="mr-2 h-4 w-4" />
                    Contract Terms
                  </TabsTrigger>
                  <TabsTrigger value="rates">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Revenue Shares
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="terms" className="space-y-4">
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Contract Terms</CardTitle>
                      <CardDescription>
                        Define the business terms and conditions for {entity.display_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duration">Duration (years)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={contractTerms.contract_duration_years}
                            onChange={(e) => {
                              const newDuration = parseInt(e.target.value) || 1;
                              updateContractDuration(newDuration);
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor="notice">Notice Period (days)</Label>
                          <Input
                            id="notice"
                            type="number"
                            value={contractTerms.notice_period_days}
                            onChange={(e) => setContractTerms({...contractTerms, notice_period_days: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="start_date">Start Date</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={contractTerms.start_date}
                            onChange={(e) => setContractTerms({...contractTerms, start_date: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="currency">Currency</Label>
                          <Select
                            value={contractTerms.currency}
                            onValueChange={(value) => setContractTerms({...contractTerms, currency: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="RON">RON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="min_launches">Min Launches/Year</Label>
                          <Input
                            id="min_launches"
                            type="number"
                            value={contractTerms.minimum_launches_per_year}
                            onChange={(e) => setContractTerms({...contractTerms, minimum_launches_per_year: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="max_per_song">Max Investment/Song</Label>
                          <Input
                            id="max_per_song"
                            type="number"
                            value={contractTerms.max_investment_per_song}
                            onChange={(e) => setContractTerms({...contractTerms, max_investment_per_song: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="max_per_year">Max Investment/Year</Label>
                          <Input
                            id="max_per_year"
                            type="number"
                            value={contractTerms.max_investment_per_year}
                            onChange={(e) => setContractTerms({...contractTerms, max_investment_per_year: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="penalty">Penalty Amount</Label>
                          <Input
                            id="penalty"
                            type="number"
                            value={contractTerms.penalty_amount}
                            onChange={(e) => setContractTerms({...contractTerms, penalty_amount: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto_renewal"
                          checked={contractTerms.auto_renewal}
                          onCheckedChange={(checked) => setContractTerms({...contractTerms, auto_renewal: checked})}
                        />
                        <Label htmlFor="auto_renewal">Auto-renewal</Label>
                        {contractTerms.auto_renewal && (
                          <Input
                            type="number"
                            value={contractTerms.auto_renewal_years}
                            onChange={(e) => setContractTerms({...contractTerms, auto_renewal_years: e.target.value})}
                            className="w-20 ml-2"
                            placeholder="Years"
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="special_terms">Special Terms</Label>
                        <Textarea
                          id="special_terms"
                          value={contractTerms.special_terms}
                          onChange={(e) => setContractTerms({...contractTerms, special_terms: e.target.value})}
                          placeholder="Any special terms or conditions..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rates" className="space-y-4">
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Revenue Share Configuration (Year-by-Year)</CardTitle>
                      <CardDescription>
                        Configure commission rates for each year and category. Backend will analyze patterns automatically.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[180px]">Category</TableHead>
                              <TableHead className="w-[60px] text-center">Enabled</TableHead>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableHead key={year} className="text-center">Year {year}</TableHead>
                              ))}
                              <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Concert */}
                            <TableRow>
                              <TableCell className="font-medium">Concert</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.concert}
                                  onCheckedChange={() => toggleRightsCategory('concert')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].concert}
                                    onChange={(e) => updateCommissionRate(year, 'concert', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.concert}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('concert', '1')}
                                  disabled={!enabledRights.concert}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Image Rights */}
                            <TableRow>
                              <TableCell className="font-medium">Image Rights</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.image_rights}
                                  onCheckedChange={() => toggleRightsCategory('image_rights')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].image_rights}
                                    onChange={(e) => updateCommissionRate(year, 'image_rights', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.image_rights}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('image_rights', '1')}
                                  disabled={!enabledRights.image_rights}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Rights */}
                            <TableRow>
                              <TableCell className="font-medium">Rights</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.rights}
                                  onCheckedChange={() => toggleRightsCategory('rights')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].rights}
                                    onChange={(e) => updateCommissionRate(year, 'rights', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.rights}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('rights', '1')}
                                  disabled={!enabledRights.rights}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Merchandising */}
                            <TableRow>
                              <TableCell className="font-medium">Merchandising</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.merchandising}
                                  onCheckedChange={() => toggleRightsCategory('merchandising')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].merchandising}
                                    onChange={(e) => updateCommissionRate(year, 'merchandising', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.merchandising}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('merchandising', '1')}
                                  disabled={!enabledRights.merchandising}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* PPD */}
                            <TableRow>
                              <TableCell className="font-medium">PPD</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.ppd}
                                  onCheckedChange={() => toggleRightsCategory('ppd')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].ppd}
                                    onChange={(e) => updateCommissionRate(year, 'ppd', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.ppd}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('ppd', '1')}
                                  disabled={!enabledRights.ppd}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* EMD */}
                            <TableRow>
                              <TableCell className="font-medium">EMD</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.emd}
                                  onCheckedChange={() => toggleRightsCategory('emd')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].emd}
                                    onChange={(e) => updateCommissionRate(year, 'emd', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.emd}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('emd', '1')}
                                  disabled={!enabledRights.emd}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Sync */}
                            <TableRow>
                              <TableCell className="font-medium">Sync</TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={enabledRights.sync}
                                  onCheckedChange={() => toggleRightsCategory('sync')}
                                />
                              </TableCell>
                              {Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
                                <TableCell key={year}>
                                  <Input
                                    type="number"
                                    value={commissionByYear[year].sync}
                                    onChange={(e) => updateCommissionRate(year, 'sync', e.target.value)}
                                    className="w-20"
                                    disabled={!enabledRights.sync}
                                  />
                                </TableCell>
                              ))}
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyRateToAllYears('sync', '1')}
                                  disabled={!enabledRights.sync}
                                >
                                  Copy Year 1
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <Alert>
                        <AlertDescription>
                          <strong>Note:</strong> Backend will automatically analyze the patterns you've configured.
                          Uniform rates (all years same) or split rates (consecutive groups) will be detected and
                          used to generate appropriate contract text with conditional sections.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                    <CardHeader>
                      <CardTitle>Contract Preview</CardTitle>
                      <CardDescription>
                        Review placeholder values and missing data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {previewData ? (
                        <div className="space-y-4">
                          <Alert>
                            <AlertDescription>
                              <strong>{previewData.placeholder_count}</strong> placeholders will be replaced
                              {missingPlaceholders.length > 0 && (
                                <span className="text-orange-600">
                                  {' '}({missingPlaceholders.length} missing)
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>

                          {missingPlaceholders.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Missing Placeholders:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {missingPlaceholders.map((placeholder, i) => (
                                  <li key={i} className="text-sm text-orange-600">
                                    {placeholder}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div>
                            <h4 className="font-semibold mb-2">Sample Values:</h4>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-96 overflow-y-auto">
                              <pre className="text-xs">
                                {JSON.stringify(previewData.placeholders, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">
                          Click "Preview" button to see placeholder values
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={generateContract}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Generate Contract
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          <TabsContent value="identifiers" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Identification Codes</CardTitle>
                <CardDescription>Tracking identifiers for this entity</CardDescription>
              </CardHeader>
              <CardContent>
                {entity.identifiers && entity.identifiers.length > 0 ? (
                  <div className="space-y-4">
                    {entity.identifiers.map((identifier: any) => (
                      <div key={identifier.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{identifier.scheme}</p>
                          <p className="text-sm text-muted-foreground">{identifier.value}</p>
                        </div>
                        {identifier.expiry_date && (
                          <Badge variant={new Date(identifier.expiry_date) < new Date() ? 'destructive' : 'default'}>
                            Expires: {format(new Date(identifier.expiry_date), 'PP')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No identifiers found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Associated Contracts</CardTitle>
                <CardDescription>Contracts and agreements with this entity</CardDescription>
              </CardHeader>
              <CardContent>
                {contractsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : contracts.length === 0 ? (
                  <p className="text-muted-foreground">No contracts found</p>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <Card key={contract.id} className="overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{contract.title}</CardTitle>
                              <CardDescription className="mt-1">
                                Contract #{contract.contract_number}
                              </CardDescription>
                            </div>
                            <Badge variant={
                              contract.status === 'signed' ? 'default' :
                              contract.status === 'draft' ? 'secondary' :
                              contract.status === 'processing' ? 'outline' :
                              'destructive'
                            }>
                              {contract.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Template</p>
                              <p className="font-medium">{contract.template_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {format(new Date(contract.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Shares</p>
                              <p className="font-medium">{contract.shares?.length || 0} revenue types</p>
                            </div>
                          </div>
                          {contract.contract_terms && (
                            <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p className="font-medium">{contract.contract_terms.contract_duration_years} years</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Start Date</p>
                                <p className="font-medium">
                                  {format(new Date(contract.contract_terms.start_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Notice Period</p>
                                <p className="font-medium">{contract.contract_terms.notice_period_days} days</p>
                              </div>
                            </div>
                          )}

                          {contract.shares && contract.shares.length > 0 && (
                            <div>
                              <Separator className="my-3" />
                              <p className="text-sm font-medium mb-3">Revenue Shares</p>
                              <div className="space-y-3">
                                {(() => {
                                  // Group shares by validity period
                                  const sharesByPeriod = new Map<string, any[]>();

                                  // Year-varying share types (these change each year)
                                  const yearVaryingTypes = ['Concert Commission', 'Image Rights Percentage'];

                                  contract.shares.forEach((share: any) => {
                                    let periodKey: string;

                                    // Check if this is a year-varying share type
                                    const isYearVarying = yearVaryingTypes.some(type =>
                                      share.share_type_name.includes(type)
                                    );

                                    if (isYearVarying) {
                                      // Calculate year based on valid_from date
                                      const shareStartDate = new Date(share.valid_from);
                                      const contractStartDate = contract.contract_terms
                                        ? new Date(contract.contract_terms.start_date)
                                        : new Date(contract.created_at);

                                      const daysDiff = Math.floor((shareStartDate.getTime() - contractStartDate.getTime()) / (24 * 60 * 60 * 1000));
                                      const yearNumber = Math.floor(daysDiff / 365) + 1;
                                      periodKey = `year${yearNumber}`;

                                      // Debug logging
                                      if (share.share_type_name === 'Concert Commission') {
                                        console.log(`${share.share_type_name}: valid_from=${share.valid_from}, daysDiff=${daysDiff}, yearNumber=${yearNumber}`);
                                      }
                                    } else {
                                      // Fixed shares (same for all years)
                                      periodKey = 'fixed';
                                    }

                                    if (!sharesByPeriod.has(periodKey)) {
                                      sharesByPeriod.set(periodKey, []);
                                    }
                                    sharesByPeriod.get(periodKey)!.push(share);
                                  });

                                  // Sort keys: year1, year2, year3, then fixed
                                  const sortedKeys = Array.from(sharesByPeriod.keys()).sort((a, b) => {
                                    if (a === 'fixed') return 1;
                                    if (b === 'fixed') return -1;
                                    return a.localeCompare(b);
                                  });

                                  return sortedKeys.map(periodKey => {
                                    const shares = sharesByPeriod.get(periodKey)!;

                                    let label: string;
                                    let dateRange: string = '';

                                    if (periodKey === 'fixed') {
                                      label = 'Fixed / Ongoing';
                                    } else {
                                      const yearNumber = periodKey.replace('year', '');
                                      label = `Year ${yearNumber}`;

                                      // Get date range from first share in this period
                                      const firstShare = shares[0];
                                      if (firstShare) {
                                        const startDate = format(new Date(firstShare.valid_from), 'MMM d, yyyy');
                                        const endDate = firstShare.valid_to
                                          ? format(new Date(firstShare.valid_to), 'MMM d, yyyy')
                                          : 'Ongoing';
                                        dateRange = `${startDate} - ${endDate}`;
                                      }
                                    }

                                    return (
                                      <div key={periodKey} className="space-y-1">
                                        <div>
                                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                                          {dateRange && (
                                            <p className="text-xs text-muted-foreground">{dateRange}</p>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {shares.map((share: any) => (
                                            <div key={share.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                              <span className="text-muted-foreground">{share.share_type_name}</span>
                                              <span className="font-medium">{share.value}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Banking and payment details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No financial information available</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No recent activity</p>
              </CardContent>
            </Card>
          </TabsContent>

          {hasCreativeRole && (
            <TabsContent value="social" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Social Media Accounts</h3>
                  <p className="text-sm text-muted-foreground">Manage social media profiles and links</p>
                </div>
                <Button onClick={handleAddSocialMedia}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>

              {entity.social_media_accounts && entity.social_media_accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entity.social_media_accounts.map((account) => (
                    <Card key={account.id} className="hover:shadow-lg transition-shadow backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{account.platform_icon}</span>
                            <CardTitle className="text-lg">{account.platform_display}</CardTitle>
                          </div>
                          {account.is_verified && (
                            <Badge variant="default" className="bg-blue-500">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {account.display_name && (
                          <div>
                            <p className="text-sm font-medium">{account.display_name}</p>
                          </div>
                        )}
                        {account.handle && (
                          <div>
                            <p className="text-sm text-muted-foreground">@{account.handle}</p>
                          </div>
                        )}
                        {account.follower_count && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{account.follower_count.toLocaleString()} followers</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <a href={account.url} target="_blank" rel="noopener noreferrer">
                              Visit Profile
                              <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSocialMedia(account)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSocialMedia(account.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <CardContent className="py-12">
                    <div className="text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Hash className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">No social media accounts yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Add social media accounts to showcase your online presence
                        </p>
                      </div>
                      <Button onClick={handleAddSocialMedia} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {entity.kind === 'PF' && (
            <TabsContent value="sensitive" className="space-y-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle>Sensitive Information</CardTitle>
                  <CardDescription>Personal identification data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entity.sensitive_identity ? (
                    <>
                      {/* Document Type Badge */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Document Type</Label>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <p className="flex-1 font-medium">
                            {entity.sensitive_identity.identification_type_display ||
                             (entity.sensitive_identity.identification_type === 'ID_CARD' ? 'Romanian ID Card' : 'Passport')}
                          </p>
                        </div>
                      </div>

                      {/* ID Card Fields */}
                      {entity.sensitive_identity.identification_type === 'ID_CARD' && (
                        <>
                          {/* CNP Display/Reveal */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">CNP (Personal Numeric Code)</Label>
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium font-mono">{revealedCNP || entity.sensitive_identity.cnp || 'Not set'}</p>
                              {entity.sensitive_identity.cnp && !revealedCNP && entity.sensitive_identity.cnp.includes('***') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleRevealCNP}
                                  disabled={revealing}
                                >
                                  {revealing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Revealing...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Reveal
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* ID Series */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">ID Series</Label>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium">{entity.sensitive_identity.id_series || 'Not set'}</p>
                            </div>
                          </div>

                          {/* ID Number */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">ID Number</Label>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium">{entity.sensitive_identity.id_number || 'Not set'}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Passport Fields */}
                      {entity.sensitive_identity.identification_type === 'PASSPORT' && (
                        <>
                          {/* Passport Number Display/Reveal */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Passport Number</Label>
                            <div className="flex items-center gap-3">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium font-mono">{revealedPassportNumber || entity.sensitive_identity.passport_number || 'Not set'}</p>
                              {entity.sensitive_identity.passport_number && !revealedPassportNumber && entity.sensitive_identity.passport_number.includes('***') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleRevealPassportNumber}
                                  disabled={revealing}
                                >
                                  {revealing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Revealing...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Reveal
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Passport Country */}
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Country of Issuance</Label>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium">{entity.sensitive_identity.passport_country || 'Not set'}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Shared Fields (both ID card and passport) */}
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium mb-4">Document Details</h3>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Issued By</Label>
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <p className="flex-1 font-medium">{entity.sensitive_identity.id_issued_by || 'Not set'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Issue Date</Label>
                              <p className="font-medium">{entity.sensitive_identity.id_issued_date || 'Not set'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                              <p className="font-medium">{entity.sensitive_identity.id_expiry_date || 'Not set'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                              <p className="font-medium">{entity.sensitive_identity.date_of_birth || 'Not set'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-muted-foreground">Place of Birth</Label>
                              <p className="font-medium">{entity.sensitive_identity.place_of_birth || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No sensitive information available for this entity.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        {editDialogOpen && (
          <EntityFormDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            entity={entity}
            onSuccess={() => {
              setEditDialogOpen(false);
              // Refresh entity data
            }}
          />
        )}

        {/* Contact Person Dialog */}
        {entity && (
          <ContactPersonFormDialog
            open={contactPersonDialogOpen}
            onOpenChange={setContactPersonDialogOpen}
            entityId={entity.id}
            contactPerson={editingContactPerson}
            onSuccess={() => {
              setContactPersonDialogOpen(false);
              setEditingContactPerson(null);
              // Refresh entity data
              window.location.reload(); // TODO: Better way to refresh
            }}
          />
        )}

        {/* Entity Request Dialog - for non-admins */}
        {entity && (
          <EntityRequestDialog
            open={entityRequestDialogOpen}
            onOpenChange={setEntityRequestDialogOpen}
            entity={{
              id: entity.id,
              display_name: entity.display_name,
            }}
            requestType={entityRequestType}
          />
        )}

        {/* Social Media Dialog */}
        <Dialog open={socialMediaDialogOpen} onOpenChange={setSocialMediaDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSocialMedia ? 'Edit' : 'Add'} Social Media Account</DialogTitle>
              <DialogDescription>
                Add your social media profile to showcase your online presence
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={socialMediaForm.platform}
                  onValueChange={(value) => setSocialMediaForm({ ...socialMediaForm, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">📷 Instagram</SelectItem>
                    <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                    <SelectItem value="youtube">▶️ YouTube</SelectItem>
                    <SelectItem value="facebook">👤 Facebook</SelectItem>
                    <SelectItem value="twitter">🐦 Twitter/X</SelectItem>
                    <SelectItem value="spotify">🎧 Spotify</SelectItem>
                    <SelectItem value="apple_music">🍎 Apple Music</SelectItem>
                    <SelectItem value="soundcloud">☁️ SoundCloud</SelectItem>
                    <SelectItem value="bandcamp">🎸 Bandcamp</SelectItem>
                    <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                    <SelectItem value="website">🌐 Website</SelectItem>
                    <SelectItem value="other">🔗 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Username/Handle</Label>
                <Input
                  id="handle"
                  placeholder="username (without @)"
                  value={socialMediaForm.handle}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, handle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Profile URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={socialMediaForm.url}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="Name shown on platform"
                  value={socialMediaForm.display_name}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follower_count">Followers/Subscribers</Label>
                <Input
                  id="follower_count"
                  type="number"
                  placeholder="0"
                  value={socialMediaForm.follower_count}
                  onChange={(e) => setSocialMediaForm({ ...socialMediaForm, follower_count: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_verified"
                  checked={socialMediaForm.is_verified}
                  onCheckedChange={(checked) => setSocialMediaForm({ ...socialMediaForm, is_verified: checked })}
                />
                <Label htmlFor="is_verified">Verified account</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_primary"
                  checked={socialMediaForm.is_primary}
                  onCheckedChange={(checked) => setSocialMediaForm({ ...socialMediaForm, is_primary: checked })}
                />
                <Label htmlFor="is_primary">Primary account for this platform</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSocialMediaDialogOpen(false)}
                disabled={savingSocialMedia}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSocialMedia}
                disabled={savingSocialMedia || !socialMediaForm.url.trim()}
              >
                {savingSocialMedia ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingSocialMedia ? 'Update' : 'Add'} Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}