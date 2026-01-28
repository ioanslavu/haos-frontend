import { FileText, DollarSign, Eye, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CommissionByYear, CommissionRates, EnabledRights, ContractTerms } from '../../types';

interface ContractGenerationTabProps {
  showContractGeneration: boolean;
  entityName: string;
  contractTerms: ContractTerms;
  commissionByYear: CommissionByYear;
  enabledRights: EnabledRights;
  previewData: any;
  missingPlaceholders: string[];
  loading: boolean;
  onContractTermsChange: (terms: ContractTerms) => void;
  onUpdateContractDuration: (duration: number) => void;
  onCopyRateToAllYears: (category: keyof CommissionRates, sourceYear: string) => void;
  onUpdateCommissionRate: (year: string, category: keyof CommissionRates, value: string) => void;
  onToggleRightsCategory: (category: keyof EnabledRights) => void;
  onGenerateContract: () => void;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function ContractGenerationTab({
  showContractGeneration,
  entityName,
  contractTerms,
  commissionByYear,
  enabledRights,
  previewData,
  missingPlaceholders,
  loading,
  onContractTermsChange,
  onUpdateContractDuration,
  onCopyRateToAllYears,
  onUpdateCommissionRate,
  onToggleRightsCategory,
  onGenerateContract,
}: ContractGenerationTabProps) {
  if (!showContractGeneration) {
    return null;
  }

  const sortedYears = Object.keys(commissionByYear).sort((a, b) => parseInt(a) - parseInt(b));

  return (
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
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Contract Terms</CardTitle>
              <CardDescription>Define the business terms and conditions for {entityName}</CardDescription>
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
                      onUpdateContractDuration(newDuration);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="notice">Notice Period (days)</Label>
                  <Input
                    id="notice"
                    type="number"
                    value={contractTerms.notice_period_days}
                    onChange={(e) =>
                      onContractTermsChange({ ...contractTerms, notice_period_days: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={contractTerms.start_date}
                    onChange={(e) => onContractTermsChange({ ...contractTerms, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={contractTerms.currency}
                    onValueChange={(value) => onContractTermsChange({ ...contractTerms, currency: value })}
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
                    onChange={(e) =>
                      onContractTermsChange({ ...contractTerms, minimum_launches_per_year: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_per_song">Max Investment/Song</Label>
                  <Input
                    id="max_per_song"
                    type="number"
                    value={contractTerms.max_investment_per_song}
                    onChange={(e) =>
                      onContractTermsChange({ ...contractTerms, max_investment_per_song: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_per_year">Max Investment/Year</Label>
                  <Input
                    id="max_per_year"
                    type="number"
                    value={contractTerms.max_investment_per_year}
                    onChange={(e) =>
                      onContractTermsChange({ ...contractTerms, max_investment_per_year: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="penalty">Penalty Amount</Label>
                  <Input
                    id="penalty"
                    type="number"
                    value={contractTerms.penalty_amount}
                    onChange={(e) => onContractTermsChange({ ...contractTerms, penalty_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_renewal"
                  checked={contractTerms.auto_renewal}
                  onCheckedChange={(checked) => onContractTermsChange({ ...contractTerms, auto_renewal: checked })}
                />
                <Label htmlFor="auto_renewal">Auto-renewal</Label>
                {contractTerms.auto_renewal && (
                  <Input
                    type="number"
                    value={contractTerms.auto_renewal_years}
                    onChange={(e) =>
                      onContractTermsChange({ ...contractTerms, auto_renewal_years: e.target.value })
                    }
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
                  onChange={(e) => onContractTermsChange({ ...contractTerms, special_terms: e.target.value })}
                  placeholder="Any special terms or conditions..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card className={cardClass}>
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
                      {sortedYears.map((year) => (
                        <TableHead key={year} className="text-center">
                          Year {year}
                        </TableHead>
                      ))}
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <CommissionRow
                      label="Concert"
                      category="concert"
                      enabled={enabledRights.concert}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('concert')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('concert', '1')}
                    />
                    <CommissionRow
                      label="Image Rights"
                      category="image_rights"
                      enabled={enabledRights.image_rights}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('image_rights')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('image_rights', '1')}
                    />
                    <CommissionRow
                      label="Rights"
                      category="rights"
                      enabled={enabledRights.rights}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('rights')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('rights', '1')}
                    />
                    <CommissionRow
                      label="Merchandising"
                      category="merchandising"
                      enabled={enabledRights.merchandising}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('merchandising')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('merchandising', '1')}
                    />
                    <CommissionRow
                      label="PPD"
                      category="ppd"
                      enabled={enabledRights.ppd}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('ppd')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('ppd', '1')}
                    />
                    <CommissionRow
                      label="EMD"
                      category="emd"
                      enabled={enabledRights.emd}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('emd')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('emd', '1')}
                    />
                    <CommissionRow
                      label="Sync"
                      category="sync"
                      enabled={enabledRights.sync}
                      commissionByYear={commissionByYear}
                      sortedYears={sortedYears}
                      onToggle={() => onToggleRightsCategory('sync')}
                      onUpdateRate={onUpdateCommissionRate}
                      onCopyToAll={() => onCopyRateToAllYears('sync', '1')}
                    />
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
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Contract Preview</CardTitle>
              <CardDescription>Review placeholder values and missing data</CardDescription>
            </CardHeader>
            <CardContent>
              {previewData ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>{previewData.placeholder_count}</strong> placeholders will be replaced
                      {missingPlaceholders.length > 0 && (
                        <span className="text-orange-600"> ({missingPlaceholders.length} missing)</span>
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
                      <pre className="text-xs">{JSON.stringify(previewData.placeholders, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Click "Preview" button to see placeholder values</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={onGenerateContract} disabled={loading}>
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
  );
}

interface CommissionRowProps {
  label: string;
  category: keyof CommissionRates;
  enabled: boolean;
  commissionByYear: CommissionByYear;
  sortedYears: string[];
  onToggle: () => void;
  onUpdateRate: (year: string, category: keyof CommissionRates, value: string) => void;
  onCopyToAll: () => void;
}

function CommissionRow({
  label,
  category,
  enabled,
  commissionByYear,
  sortedYears,
  onToggle,
  onUpdateRate,
  onCopyToAll,
}: CommissionRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-center">
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </TableCell>
      {sortedYears.map((year) => (
        <TableCell key={year}>
          <Input
            type="number"
            value={commissionByYear[year][category]}
            onChange={(e) => onUpdateRate(year, category, e.target.value)}
            className="w-20"
            disabled={!enabled}
          />
        </TableCell>
      ))}
      <TableCell>
        <Button variant="ghost" size="sm" onClick={onCopyToAll} disabled={!enabled}>
          Copy Year 1
        </Button>
      </TableCell>
    </TableRow>
  );
}
