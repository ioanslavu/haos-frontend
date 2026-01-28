import { User, Hash, FileText, DollarSign, TrendingUp, Calendar, Users, EyeOff } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EntityTabsProps {
  isAdmin: boolean;
  hasCampaigns: boolean;
  hasCreativeRole: boolean;
  showContractGeneration: boolean;
  entityKind: 'PF' | 'PJ';
}

const tabTriggerClass =
  'rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-background/50';

export function EntityTabs({
  isAdmin,
  hasCampaigns,
  hasCreativeRole,
  showContractGeneration,
  entityKind,
}: EntityTabsProps) {
  return (
    <div className="w-full overflow-x-auto">
      <TabsList className="inline-flex h-auto items-center justify-start gap-1 rounded-2xl bg-muted/50 p-2 backdrop-blur-xl border border-white/10 shadow-lg">
        <TabsTrigger value="details" className={tabTriggerClass}>
          <User className="h-3.5 w-3.5 mr-1.5" />
          Details
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="identifiers" className={tabTriggerClass}>
            <Hash className="h-3.5 w-3.5 mr-1.5" />
            Identifiers
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="contracts" className={tabTriggerClass}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Contracts
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="financial" className={tabTriggerClass}>
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Financial
          </TabsTrigger>
        )}
        {isAdmin && hasCampaigns && (
          <TabsTrigger value="campaigns" className={tabTriggerClass}>
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Campaigns
          </TabsTrigger>
        )}
        {isAdmin && (
          <TabsTrigger value="activity" className={tabTriggerClass}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Activity
          </TabsTrigger>
        )}
        {hasCreativeRole && (
          <TabsTrigger value="social" className={tabTriggerClass}>
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Social
          </TabsTrigger>
        )}
        {isAdmin && entityKind === 'PF' && (
          <TabsTrigger value="sensitive" className={tabTriggerClass}>
            <EyeOff className="h-3.5 w-3.5 mr-1.5" />
            Sensitive
          </TabsTrigger>
        )}
        {isAdmin && showContractGeneration && (
          <TabsTrigger value="generate-contract" className={tabTriggerClass}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Generate Contract
          </TabsTrigger>
        )}
      </TabsList>
    </div>
  );
}
