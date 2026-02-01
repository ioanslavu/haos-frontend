import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { useEntityDetail as useEntityDetailQuery } from '@/api/hooks/useEntities';
import { useArtistAnalyticsDetail, useClientAnalyticsDetail, useBrandAnalyticsDetail } from '@/api/hooks/useCampaigns';
import { useContracts } from '@/api/hooks/useContracts';
import { useAuthStore } from '@/stores/authStore';
import entitiesService from '@/api/services/entities.service';
import {
  useContractTemplates,
  useContractDraft,
  useSaveContractDraft,
  usePreviewContractGeneration,
  useGenerateContractWithTerms,
} from '@/api/hooks/useContractGeneration';
import {
  CommissionByYear,
  CommissionRates,
  EnabledRights,
  ContractTerms,
  Template,
  SocialMediaFormState,
  DEFAULT_CONTRACT_TERMS,
  DEFAULT_COMMISSION_BY_YEAR,
  DEFAULT_ENABLED_RIGHTS,
  DEFAULT_SOCIAL_MEDIA_FORM,
} from '../types';

export function useEntityDetailState() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'administrator';

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
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
  const [socialMediaForm, setSocialMediaForm] = useState<SocialMediaFormState>(DEFAULT_SOCIAL_MEDIA_FORM);
  const [savingSocialMedia, setSavingSocialMedia] = useState(false);

  // Contract generation state
  const [loading, setLoading] = useState(false);
  const selectedTemplate = '2'; // Always use template ID 2 for artists

  // Contracts state
  const { data: contractsData, isLoading: contractsLoading } = useContracts(
    activeTab === 'contracts' ? { counterparty_entity: Number(id) } : undefined
  );
  const contracts = contractsData?.results || contractsData || [];

  // Contract Terms
  const [contractTerms, setContractTerms] = useState<ContractTerms>(DEFAULT_CONTRACT_TERMS);

  // Commission Structure (year-by-year)
  const [commissionByYear, setCommissionByYear] = useState<CommissionByYear>(DEFAULT_COMMISSION_BY_YEAR);

  // Rights categories visibility
  const [enabledRights, setEnabledRights] = useState<EnabledRights>(DEFAULT_ENABLED_RIGHTS);

  // Preview data
  const [previewData, setPreviewData] = useState<any>(null);
  const [missingPlaceholders, setMissingPlaceholders] = useState<string[]>([]);

  // Contract generation hooks
  const { data: templatesData } = useContractTemplates(showContractGeneration);
  const templates = templatesData || [];
  const { data: draftData } = useContractDraft(Number(id), showContractGeneration);
  const saveDraftMutation = useSaveContractDraft();
  const previewMutation = usePreviewContractGeneration();
  const generateMutation = useGenerateContractWithTerms();

  // Fetch entity data
  const { data: entity, isLoading, error } = useEntityDetailQuery(Number(id));

  // Check entity roles
  const isArtist = entity?.entity_roles?.some((role: any) => role.role === 'artist') || false;
  const isClient = entity?.entity_roles?.some((role: any) => role.role === 'client') || false;
  const isBrand = entity?.entity_roles?.some((role: any) => role.role === 'brand') || false;
  const hasCampaigns = isArtist || isClient || isBrand;
  const hasCreativeRole = entity?.entity_roles?.some((role: any) =>
    ['artist', 'producer', 'composer', 'lyricist', 'audio_editor'].includes(role.role)
  ) || false;

  // Fetch analytics for different roles
  const { data: artistAnalytics } = useArtistAnalyticsDetail(Number(id), isArtist && !!id);
  const { data: clientAnalytics } = useClientAnalyticsDetail(Number(id), isClient && !!id);
  const { data: brandAnalytics } = useBrandAnalyticsDetail(Number(id), isBrand && !!id);

  // Load draft data when it arrives
  useEffect(() => {
    if (draftData?.draft_data) {
      setContractTerms(draftData.draft_data.contract_terms || DEFAULT_CONTRACT_TERMS);
      if (draftData.draft_data.commission_by_year) {
        setCommissionByYear(draftData.draft_data.commission_by_year);
      }
      if (draftData.draft_data.enabled_rights) {
        setEnabledRights(draftData.draft_data.enabled_rights);
      }
    }
  }, [draftData]);

  // Update contract duration and adjust commission years
  const updateContractDuration = useCallback((newDuration: number) => {
    const currentYears = Object.keys(commissionByYear).map(Number);
    const currentMax = Math.max(...currentYears);
    const updated = { ...commissionByYear };

    if (newDuration > currentMax) {
      const lastYear = updated[String(currentMax)];
      for (let i = currentMax + 1; i <= newDuration; i++) {
        updated[String(i)] = { ...lastYear };
      }
    } else if (newDuration < currentMax) {
      for (let i = newDuration + 1; i <= currentMax; i++) {
        delete updated[String(i)];
      }
    }

    setCommissionByYear(updated);
    setContractTerms((prev) => ({ ...prev, contract_duration_years: String(newDuration) }));
  }, [commissionByYear]);

  // Copy a category's rate to all years
  const copyRateToAllYears = useCallback((category: keyof CommissionRates, sourceYear: string) => {
    const rate = commissionByYear[sourceYear][category];
    const updated = { ...commissionByYear };
    Object.keys(updated).forEach((year) => {
      updated[year] = { ...updated[year], [category]: rate };
    });
    setCommissionByYear(updated);
  }, [commissionByYear]);

  // Update a specific year's category rate
  const updateCommissionRate = useCallback((year: string, category: keyof CommissionRates, value: string) => {
    setCommissionByYear((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [category]: value,
      },
    }));
  }, []);

  // Toggle rights category
  const toggleRightsCategory = useCallback((category: keyof EnabledRights) => {
    setEnabledRights((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // Reveal CNP
  const handleRevealCNP = useCallback(async () => {
    if (!entity?.sensitive_identity?.id) {
      sonnerToast.error('No sensitive identity found');
      return;
    }
    setRevealing(true);
    try {
      const response = await entitiesService.revealCNP(entity.sensitive_identity.id, 'User viewed CNP from entity details');
      setRevealedCNP(response.cnp);
      sonnerToast.success('CNP revealed');
    } catch (error: any) {
      console.error('Failed to reveal CNP:', error);
      if (error.response?.status === 422 && error.response?.data?.needs_reentry) {
        sonnerToast.error('CNP cannot be decrypted. Please re-enter the CNP in the form below.', { duration: 6000 });
      } else {
        sonnerToast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to reveal CNP');
      }
    } finally {
      setRevealing(false);
    }
  }, [entity?.sensitive_identity?.id]);

  // Reveal Passport Number
  const handleRevealPassportNumber = useCallback(async () => {
    if (!entity?.sensitive_identity?.id) {
      sonnerToast.error('No sensitive identity found');
      return;
    }
    setRevealing(true);
    try {
      const response = await entitiesService.revealCNP(entity.sensitive_identity.id, 'User viewed passport number from entity details');
      setRevealedPassportNumber(response.passport_number || response.cnp);
      sonnerToast.success('Passport number revealed');
    } catch (error: any) {
      console.error('Failed to reveal passport number:', error);
      if (error.response?.status === 422 && error.response?.data?.needs_reentry) {
        sonnerToast.error('Passport number cannot be decrypted. Please re-enter it in the form below.', { duration: 6000 });
      } else {
        sonnerToast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to reveal passport number');
      }
    } finally {
      setRevealing(false);
    }
  }, [entity?.sensitive_identity?.id]);

  // Social media handlers
  const handleAddSocialMedia = useCallback(() => {
    setEditingSocialMedia(null);
    setSocialMediaForm(DEFAULT_SOCIAL_MEDIA_FORM);
    setSocialMediaDialogOpen(true);
  }, []);

  const handleEditSocialMedia = useCallback((account: any) => {
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
  }, []);

  const handleSaveSocialMedia = useCallback(async () => {
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
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to save social media account:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to save social media account');
    } finally {
      setSavingSocialMedia(false);
    }
  }, [entity?.id, socialMediaForm, editingSocialMedia]);

  const handleDeleteSocialMedia = useCallback(async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;
    try {
      await entitiesService.deleteSocialMediaAccount(accountId);
      sonnerToast.success('Social media account deleted');
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to delete social media account:', error);
      sonnerToast.error(error.response?.data?.detail || 'Failed to delete social media account');
    }
  }, []);

  // Contact person handlers
  const handleAddContactPerson = useCallback(() => {
    setEditingContactPerson(null);
    setContactPersonDialogOpen(true);
  }, []);

  const handleEditContactPerson = useCallback((contactPerson: any) => {
    setEditingContactPerson(contactPerson);
    setContactPersonDialogOpen(true);
  }, []);

  // Contract generation handlers
  const saveDraft = useCallback(async () => {
    if (!id) {
      sonnerToast.error('Entity not found');
      return;
    }
    saveDraftMutation.mutate({
      entityId: parseInt(id),
      draftData: {
        contract_terms: contractTerms,
        commission_by_year: commissionByYear,
        enabled_rights: enabledRights,
      },
    }, {
      onSuccess: () => {
        sonnerToast.success('Draft saved successfully');
      },
      onError: (error) => {
        console.error('Failed to save draft:', error);
        sonnerToast.error('Failed to save draft');
      },
    });
  }, [id, contractTerms, commissionByYear, enabledRights, saveDraftMutation]);

  const previewContract = useCallback(async () => {
    if (!id || !selectedTemplate) {
      sonnerToast.error('Missing required information');
      return;
    }
    previewMutation.mutate({
      entityId: id,
      templateId: selectedTemplate,
      contractTerms: {
        ...contractTerms,
        commission_by_year: commissionByYear,
        enabled_rights: enabledRights,
      },
    }, {
      onSuccess: (data) => {
        setPreviewData(data);
        setMissingPlaceholders(data.missing_placeholders || []);
        if (data.missing_placeholders?.length > 0) {
          sonnerToast.warning(`${data.missing_placeholders.length} placeholders are missing values`);
        } else {
          sonnerToast.success('All placeholders have values!');
        }
      },
      onError: (error) => {
        console.error('Failed to preview contract:', error);
        sonnerToast.error('Failed to preview contract');
      },
    });
  }, [id, selectedTemplate, contractTerms, commissionByYear, enabledRights, previewMutation]);

  const generateContract = useCallback(async () => {
    if (!id || !selectedTemplate) {
      sonnerToast.error('Missing required information');
      return;
    }
    if (missingPlaceholders.length > 0) {
      const proceed = confirm(`There are ${missingPlaceholders.length} missing placeholders. Do you want to proceed anyway?`);
      if (!proceed) return;
    }
    setLoading(true);
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
      enabled_rights: enabledRights,
    };
    generateMutation.mutate({
      entityId: parseInt(id),
      templateId: parseInt(selectedTemplate),
      contractTerms: formattedContractTerms,
    }, {
      onSuccess: () => {
        sonnerToast.success('Contract generation started!');
        setShowContractGeneration(false);
        setActiveTab('contracts');
        fetchContracts();
        setLoading(false);
      },
      onError: (error) => {
        console.error('Failed to generate contract:', error);
        sonnerToast.error('Failed to generate contract');
        setLoading(false);
      },
    });
  }, [id, selectedTemplate, contractTerms, commissionByYear, enabledRights, missingPlaceholders, fetchContracts, generateMutation]);

  const handleGenerateContract = useCallback(() => {
    setShowContractGeneration(true);
    setActiveTab('generate-contract');
  }, []);

  const handleBackToDetails = useCallback(() => {
    setShowContractGeneration(false);
    setActiveTab('details');
  }, []);

  return {
    // Navigation
    id,
    navigate,

    // User info
    currentUser,
    isAdmin,

    // Entity data
    entity,
    isLoading,
    error,

    // Role flags
    isArtist,
    isClient,
    isBrand,
    hasCampaigns,
    hasCreativeRole,

    // Analytics
    artistAnalytics,
    clientAnalytics,
    brandAnalytics,

    // Tab state
    activeTab,
    setActiveTab,

    // Dialog states
    editDialogOpen,
    setEditDialogOpen,
    entityRequestDialogOpen,
    setEntityRequestDialogOpen,
    entityRequestType,
    setEntityRequestType,
    contactPersonDialogOpen,
    setContactPersonDialogOpen,
    editingContactPerson,
    setEditingContactPerson,
    socialMediaDialogOpen,
    setSocialMediaDialogOpen,

    // Contact person handlers
    handleAddContactPerson,
    handleEditContactPerson,

    // Sensitive data
    revealedCNP,
    revealedPassportNumber,
    revealing,
    handleRevealCNP,
    handleRevealPassportNumber,

    // Social media
    editingSocialMedia,
    socialMediaForm,
    setSocialMediaForm,
    savingSocialMedia,
    handleAddSocialMedia,
    handleEditSocialMedia,
    handleSaveSocialMedia,
    handleDeleteSocialMedia,

    // Contract generation
    showContractGeneration,
    setShowContractGeneration,
    loading,
    saving: saveDraftMutation.isPending,
    previewing: previewMutation.isPending,
    templates,
    selectedTemplate,
    contracts,
    contractsLoading,
    contractTerms,
    setContractTerms,
    commissionByYear,
    enabledRights,
    previewData,
    missingPlaceholders,
    updateContractDuration,
    copyRateToAllYears,
    updateCommissionRate,
    toggleRightsCategory,
    saveDraft,
    previewContract,
    generateContract,
    handleGenerateContract,
    handleBackToDetails,
    fetchContracts,
  };
}
