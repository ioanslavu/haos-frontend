// Commission rates by category
export interface CommissionRates {
  concert: string;
  image_rights: string;
  rights: string;
  merchandising: string;
  ppd: string;
  emd: string;
  sync: string;
}

// Year-by-year commission structure
export type CommissionByYear = Record<string, CommissionRates>;

// Rights categories that can be enabled/disabled
export interface EnabledRights {
  concert: boolean;
  image_rights: boolean;
  rights: boolean;
  merchandising: boolean;
  ppd: boolean;
  emd: boolean;
  sync: boolean;
}

// Contract terms configuration
export interface ContractTerms {
  contract_duration_years: string;
  notice_period_days: string;
  auto_renewal: boolean;
  auto_renewal_years: string;
  minimum_launches_per_year: string;
  max_investment_per_song: string;
  max_investment_per_year: string;
  penalty_amount: string;
  currency: string;
  start_date: string;
  special_terms: string;
}

// Contract generation template
export interface Template {
  id: number;
  name: string;
  description: string;
  placeholders: string[];
}

// Social media form state
export interface SocialMediaFormState {
  platform: string;
  handle: string;
  url: string;
  display_name: string;
  follower_count: string;
  is_verified: boolean;
  is_primary: boolean;
}

// Default values
export const DEFAULT_CONTRACT_TERMS: ContractTerms = {
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
  special_terms: '',
};

export const DEFAULT_COMMISSION_BY_YEAR: CommissionByYear = {
  '1': { concert: '20', image_rights: '30', rights: '25', merchandising: '20', ppd: '5', emd: '5', sync: '20' },
  '2': { concert: '20', image_rights: '30', rights: '25', merchandising: '20', ppd: '5', emd: '5', sync: '20' },
  '3': { concert: '10', image_rights: '20', rights: '15', merchandising: '10', ppd: '3', emd: '3', sync: '10' },
};

export const DEFAULT_ENABLED_RIGHTS: EnabledRights = {
  concert: true,
  image_rights: true,
  rights: true,
  merchandising: true,
  ppd: true,
  emd: true,
  sync: true,
};

export const DEFAULT_SOCIAL_MEDIA_FORM: SocialMediaFormState = {
  platform: 'instagram',
  handle: '',
  url: '',
  display_name: '',
  follower_count: '',
  is_verified: false,
  is_primary: false,
};
