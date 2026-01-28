import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface ContractsTabProps {
  contracts: any[];
  contractsLoading: boolean;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function ContractsTab({ contracts, contractsLoading }: ContractsTabProps) {
  return (
    <TabsContent value="contracts" className="space-y-6">
      <Card className={cardClass}>
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
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function ContractCard({ contract }: { contract: any }) {
  return (
    <Card className={`overflow-hidden ${cardClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{contract.title}</CardTitle>
            <CardDescription className="mt-1">Contract #{contract.contract_number}</CardDescription>
          </div>
          <Badge
            variant={
              contract.status === 'signed'
                ? 'default'
                : contract.status === 'draft'
                  ? 'secondary'
                  : contract.status === 'processing'
                    ? 'outline'
                    : 'destructive'
            }
          >
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
            <p className="font-medium">{format(new Date(contract.created_at), 'MMM d, yyyy')}</p>
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
              <p className="font-medium">{format(new Date(contract.contract_terms.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Notice Period</p>
              <p className="font-medium">{contract.contract_terms.notice_period_days} days</p>
            </div>
          </div>
        )}

        {contract.shares && contract.shares.length > 0 && (
          <ContractSharesSection contract={contract} />
        )}
      </CardContent>
    </Card>
  );
}

function ContractSharesSection({ contract }: { contract: any }) {
  // Group shares by validity period
  const sharesByPeriod = new Map<string, any[]>();

  // Year-varying share types (these change each year)
  const yearVaryingTypes = ['Concert Commission', 'Image Rights Percentage'];

  contract.shares.forEach((share: any) => {
    let periodKey: string;

    // Check if this is a year-varying share type
    const isYearVarying = yearVaryingTypes.some((type) => share.share_type_name.includes(type));

    if (isYearVarying) {
      // Calculate year based on valid_from date
      const shareStartDate = new Date(share.valid_from);
      const contractStartDate = contract.contract_terms
        ? new Date(contract.contract_terms.start_date)
        : new Date(contract.created_at);

      const daysDiff = Math.floor((shareStartDate.getTime() - contractStartDate.getTime()) / (24 * 60 * 60 * 1000));
      const yearNumber = Math.floor(daysDiff / 365) + 1;
      periodKey = `year${yearNumber}`;
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

  return (
    <div>
      <Separator className="my-3" />
      <p className="text-sm font-medium mb-3">Revenue Shares</p>
      <div className="space-y-3">
        {sortedKeys.map((periodKey) => {
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
                {dateRange && <p className="text-xs text-muted-foreground">{dateRange}</p>}
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
        })}
      </div>
    </div>
  );
}
