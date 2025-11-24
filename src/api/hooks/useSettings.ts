import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import settingsService, { UpdateCompanySettingsPayload } from '@/api/services/settings.service';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';

const QUERY_KEYS = {
  COMPANY_SETTINGS: ['settings', 'company'],
};

export const useCompanySettings = () => {
  return useQuery({
    queryKey: QUERY_KEYS.COMPANY_SETTINGS,
    queryFn: () => settingsService.getCompanySettings(),
  });
};

export const useUpdateCompanySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCompanySettingsPayload) =>
      settingsService.updateCompanySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPANY_SETTINGS });
      toast.success('Company settings updated successfully');
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'updating company settings',
        showToast: true,
      });
    },
  });
};
