import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ProposalBuilderData } from './index'
import { useUsageTerms } from '@/api/hooks/useArtistSales'
import { AlertCircle } from 'lucide-react'

interface UsageTermsSelectionProps {
  data: ProposalBuilderData
  updateData: (updates: Partial<ProposalBuilderData>) => void
}

export function UsageTermsSelection({ data, updateData }: UsageTermsSelectionProps) {
  const { data: termsData, isLoading } = useUsageTerms()
  const terms = termsData?.results?.filter((t) => t.is_template) || []

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading usage terms...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">Usage terms are optional</p>
          <p className="text-blue-700 dark:text-blue-300 mt-1">
            You can skip this step and proceed without selecting usage terms, or select a template below.
          </p>
        </div>
      </div>

      {terms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No usage terms templates available.</p>
          <p className="text-sm mt-2">You can create templates in the admin section.</p>
        </div>
      ) : (
        <RadioGroup
          value={data.usageTermsId?.toString() || 'none'}
          onValueChange={(value) =>
            updateData({ usageTermsId: value === 'none' ? undefined : parseInt(value) })
          }
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="flex-1 cursor-pointer font-normal">
                <p className="font-medium">No usage terms</p>
                <p className="text-sm text-muted-foreground">Skip usage terms for this proposal</p>
              </Label>
            </div>

            {terms.map((term) => (
              <div
                key={term.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
              >
                <RadioGroupItem value={term.id.toString()} id={`term-${term.id}`} className="mt-1" />
                <Label htmlFor={`term-${term.id}`} className="flex-1 cursor-pointer font-normal">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{term.name}</p>
                      {term.buyout && <Badge variant="secondary">Buyout</Badge>}
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Scope:</strong> {term.usage_scope?.join(', ') || 'Not specified'}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Territories:</strong> {term.territories?.join(', ') || 'Not specified'}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Duration:</strong> {term.usage_duration_days} days
                        {term.extensions_allowed && ' (extensions allowed)'}
                      </p>
                      {term.exclusivity_category && (
                        <p className="text-muted-foreground">
                          <strong>Exclusivity:</strong> {term.exclusivity_category}
                          {term.exclusivity_duration_days && ` for ${term.exclusivity_duration_days} days`}
                        </p>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}
    </div>
  )
}
