import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, Users, Calendar, DollarSign, Save, Send, Eye, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  useContractTemplates,
  useContractDraft,
  useSaveContractDraft,
  usePreviewContractGeneration,
  useGenerateContractWithTerms,
} from '@/api/hooks/useContractGeneration'
import { useEntity } from '@/api/hooks/useEntities'

interface Entity {
  id: number
  display_name: string
  kind: string
  stage_name?: string
  email?: string
  phone?: string
}

interface Template {
  id: number
  name: string
  description: string
  placeholders: string[]
}

interface CommissionRange {
  concert: string
  rights: string
  merchandising: string
  image_rights: string
  ppd: string
  emd: string
  sync: string
}

interface CommissionStructure {
  first_years: CommissionRange & { count: string }
  middle_years: CommissionRange
  last_years: CommissionRange & { count: string }
}

export default function ContractGeneration() {
  const navigate = useNavigate()
  const { id: entityId } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)

  // Entity and Template selection
  const { data: entity } = useEntity(Number(entityId) || 0, !!entityId)
  const [selectedTemplate] = useState<string>('2') // Always use template ID 2 for artists

  // Contract generation hooks
  const { data: templatesData } = useContractTemplates(true)
  const templates = templatesData || []
  const { data: draftData } = useContractDraft(Number(entityId), true)
  const saveDraftMutation = useSaveContractDraft()
  const previewMutation = usePreviewContractGeneration()
  const generateMutation = useGenerateContractWithTerms()

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
  })

  // Commission Structure (range-based)
  const [commissionStructure, setCommissionStructure] = useState<CommissionStructure>({
    first_years: {
      count: '2',
      concert: '20',
      rights: '50',
      merchandising: '30',
      image_rights: '30',
      ppd: '50',
      emd: '50',
      sync: '50'
    },
    middle_years: {
      concert: '25',
      rights: '50',
      merchandising: '30',
      image_rights: '25',
      ppd: '50',
      emd: '50',
      sync: '50'
    },
    last_years: {
      count: '2',
      concert: '30',
      rights: '50',
      merchandising: '30',
      image_rights: '20',
      ppd: '50',
      emd: '50',
      sync: '50'
    }
  })

  // Preview data
  const [previewData, setPreviewData] = useState<any>(null)
  const [missingPlaceholders, setMissingPlaceholders] = useState<string[]>([])

  // Load draft data when it arrives
  useEffect(() => {
    if (draftData?.draft_data) {
      setContractTerms(draftData.draft_data.contract_terms || contractTerms)
      if (draftData.draft_data.commission_structure) {
        setCommissionStructure(draftData.draft_data.commission_structure)
      }
    }
  }, [draftData])

  const saveDraft = async () => {
    if (!entityId) {
      toast.error('Entity not found')
      return
    }

    saveDraftMutation.mutate({
      entityId: Number(entityId),
      draftData: {
        contract_terms: contractTerms,
        commission_structure: commissionStructure
      }
    }, {
      onSuccess: () => {
        toast.success('Draft saved successfully')
      },
      onError: (error) => {
        console.error('Failed to save draft:', error)
        toast.error('Failed to save draft')
      },
    })
  }

  // Build commission structure for API
  const buildCommissionStructure = () => {
    return {
      first_years: {
        count: parseInt(commissionStructure.first_years.count),
        concert: commissionStructure.first_years.concert,
        rights: commissionStructure.first_years.rights,
        merchandising: commissionStructure.first_years.merchandising,
        image_rights: commissionStructure.first_years.image_rights,
        ppd: commissionStructure.first_years.ppd,
        emd: commissionStructure.first_years.emd,
        sync: commissionStructure.first_years.sync
      },
      middle_years: {
        concert: commissionStructure.middle_years.concert,
        rights: commissionStructure.middle_years.rights,
        merchandising: commissionStructure.middle_years.merchandising,
        image_rights: commissionStructure.middle_years.image_rights,
        ppd: commissionStructure.middle_years.ppd,
        emd: commissionStructure.middle_years.emd,
        sync: commissionStructure.middle_years.sync
      },
      last_years: {
        count: parseInt(commissionStructure.last_years.count),
        concert: commissionStructure.last_years.concert,
        rights: commissionStructure.last_years.rights,
        merchandising: commissionStructure.last_years.merchandising,
        image_rights: commissionStructure.last_years.image_rights,
        ppd: commissionStructure.last_years.ppd,
        emd: commissionStructure.last_years.emd,
        sync: commissionStructure.last_years.sync
      }
    }
  }

  const previewContract = async () => {
    if (!entityId || !selectedTemplate) {
      toast.error('Missing required information')
      return
    }

    previewMutation.mutate({
      entityId: entityId,
      templateId: selectedTemplate,
      contractTerms: {
        ...contractTerms,
        commission_structure: buildCommissionStructure()
      }
    }, {
      onSuccess: (data) => {
        setPreviewData(data)
        setMissingPlaceholders(data.missing_placeholders || [])

        if (data.missing_placeholders?.length > 0) {
          toast.warning(`${data.missing_placeholders.length} placeholders are missing values`)
        } else {
          toast.success('All placeholders have values!')
        }
      },
      onError: (error) => {
        console.error('Failed to preview contract:', error)
        toast.error('Failed to preview contract')
      },
    })
  }

  const generateContract = async () => {
    if (!entityId || !selectedTemplate) {
      toast.error('Missing required information')
      return
    }

    if (missingPlaceholders.length > 0) {
      const proceed = confirm(`There are ${missingPlaceholders.length} missing placeholders. Do you want to proceed anyway?`)
      if (!proceed) return
    }

    setLoading(true)
    // Convert contract terms to proper types
    const formattedContractTerms = {
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
      commission_structure: buildCommissionStructure()
    }

    generateMutation.mutate({
      entityId: parseInt(entityId),
      templateId: parseInt(selectedTemplate),
      contractTerms: formattedContractTerms
    }, {
      onSuccess: (response) => {
        toast.success('Contract generation started!')
        // Navigate to the contract detail page
        navigate(`/contracts/${response.id}`)
        setLoading(false)
      },
      onError: (error) => {
        console.error('Failed to generate contract:', error)
        toast.error('Failed to generate contract')
        setLoading(false)
      },
    })
  }

  // Helper to update commission structure fields
  const updateCommissionField = (range: 'first_years' | 'middle_years' | 'last_years', field: string, value: string) => {
    setCommissionStructure(prev => ({
      ...prev,
      [range]: {
        ...prev[range],
        [field]: value
      }
    }))
  }

  // Helper function to update fixed commission fields (rights, merchandising, ppd, emd, sync) across all ranges
  const updateFixedCommissionField = (field: string, value: string) => {
    setCommissionStructure(prev => ({
      ...prev,
      first_years: { ...prev.first_years, [field]: value },
      middle_years: { ...prev.middle_years, [field]: value },
      last_years: { ...prev.last_years, [field]: value }
    }))
  }

  const contractDuration = parseInt(contractTerms.contract_duration_years)

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/entities/${entityId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Artist
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Generate Artist Contract</h1>
              {entity && (
                <p className="text-muted-foreground mt-1">
                  Creating contract for: <strong>{entity.display_name}</strong>
                  {entity.stage_name && ` (${entity.stage_name})`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saveDraftMutation.isPending}
            >
              {saveDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button
              variant="outline"
              onClick={previewContract}
              disabled={previewMutation.isPending}
            >
              {previewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Preview
            </Button>
          </div>
        </div>

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
            <Card>
              <CardHeader>
                <CardTitle>Contract Terms</CardTitle>
                <CardDescription>
                  Define the business terms and conditions
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
                      onChange={(e) => setContractTerms({...contractTerms, contract_duration_years: e.target.value})}
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
            <Card>
              <CardHeader>
                <CardTitle>Revenue Share Configuration</CardTitle>
                <CardDescription>
                  Concert and Image Rights vary by contract period. Other rates are constant.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Validation Alert */}
                {(parseInt(commissionStructure.first_years.count) + parseInt(commissionStructure.last_years.count)) > contractDuration && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Warning: First years ({commissionStructure.first_years.count}) + Last years ({commissionStructure.last_years.count}) cannot exceed contract duration ({contractDuration} years)
                    </AlertDescription>
                  </Alert>
                )}

                {/* Concert and Image Rights (Range-based) */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Concert & Image Rights (Variable by Period)</h3>

                  {/* First Years */}
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-4">
                      <h4 className="font-semibold">First</h4>
                      <Input
                        type="number"
                        className="w-20"
                        value={commissionStructure.first_years.count}
                        onChange={(e) => updateCommissionField('first_years', 'count', e.target.value)}
                        min="0"
                        max={contractDuration}
                      />
                      <h4 className="font-semibold">years</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Concert (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.first_years.concert}
                          onChange={(e) => updateCommissionField('first_years', 'concert', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Image Rights (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.first_years.image_rights}
                          onChange={(e) => updateCommissionField('first_years', 'image_rights', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Middle Years */}
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold">Middle years (all remaining)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Concert (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.middle_years.concert}
                          onChange={(e) => updateCommissionField('middle_years', 'concert', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Image Rights (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.middle_years.image_rights}
                          onChange={(e) => updateCommissionField('middle_years', 'image_rights', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last Years */}
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center gap-4">
                      <h4 className="font-semibold">Last</h4>
                      <Input
                        type="number"
                        className="w-20"
                        value={commissionStructure.last_years.count}
                        onChange={(e) => updateCommissionField('last_years', 'count', e.target.value)}
                        min="0"
                        max={contractDuration}
                      />
                      <h4 className="font-semibold">years</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Concert (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.last_years.concert}
                          onChange={(e) => updateCommissionField('last_years', 'concert', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Image Rights (%)</Label>
                        <Input
                          type="number"
                          value={commissionStructure.last_years.image_rights}
                          onChange={(e) => updateCommissionField('last_years', 'image_rights', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fixed Rates (Same for all years) */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Other Rates (Fixed for Contract Duration)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="rights">Rights (%)</Label>
                      <Input
                        id="rights"
                        type="number"
                        value={commissionStructure.first_years.rights}
                        onChange={(e) => updateFixedCommissionField('rights', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="merchandising">Merchandising (%)</Label>
                      <Input
                        id="merchandising"
                        type="number"
                        value={commissionStructure.first_years.merchandising}
                        onChange={(e) => updateFixedCommissionField('merchandising', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ppd">PPD (%)</Label>
                      <Input
                        id="ppd"
                        type="number"
                        value={commissionStructure.first_years.ppd}
                        onChange={(e) => updateFixedCommissionField('ppd', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emd">EMD (%)</Label>
                      <Input
                        id="emd"
                        type="number"
                        value={commissionStructure.first_years.emd}
                        onChange={(e) => updateFixedCommissionField('emd', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sync">Sync (%)</Label>
                      <Input
                        id="sync"
                        type="number"
                        value={commissionStructure.first_years.sync}
                        onChange={(e) => updateFixedCommissionField('sync', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
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
      </div>
    </AppLayout>
  )
}