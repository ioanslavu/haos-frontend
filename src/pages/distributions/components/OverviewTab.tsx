/**
 * OverviewTab - Distribution overview content
 */

import { FileText, Percent, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotesSection } from '@/components/notes/NotesSection'
import { AssignmentSection } from './AssignmentSection'
import { DistributionNotesSection } from './DistributionNotesSection'
import { DEAL_TYPE_CONFIG } from '@/types/distribution'
import type { DealType, Distribution, DistributionAssignment } from '@/types/distribution'

interface OverviewTabProps {
  distribution: Distribution
  isLoading: boolean
  isSavingField: string | null
  onSaveDealType: (dealType: DealType) => void
  onSaveRevenueShare: (value: string) => void
  onSaveIncludesDsps: (checked: boolean) => void
  onSaveIncludesYoutube: (checked: boolean) => void
  onSaveSpecialTerms: (terms: string) => void
  onSaveNotes: (notes: string) => void
}

export function OverviewTab({
  distribution,
  isLoading,
  isSavingField,
  onSaveDealType,
  onSaveRevenueShare,
  onSaveIncludesDsps,
  onSaveIncludesYoutube,
  onSaveSpecialTerms,
  onSaveNotes,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Deal Info - Editable */}
        <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Deal Type - Editable */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deal Type</span>
              <Select
                value={distribution.deal_type}
                onValueChange={(value) => onSaveDealType(value as DealType)}
                disabled={isSavingField === 'deal_type'}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEAL_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Revenue Share - Editable */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue Share</span>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={distribution.global_revenue_share_percentage || ''}
                  onChange={() => {
                    // Debounce or save on blur
                  }}
                  onBlur={(e) => onSaveRevenueShare(e.target.value)}
                  className="h-8 w-20 text-right"
                  disabled={isSavingField === 'revenue_share'}
                />
              </div>
            </div>
            {/* Includes DSPs - Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="includes-dsps" className="text-sm text-muted-foreground">
                Includes DSPs
              </Label>
              <Switch
                id="includes-dsps"
                checked={distribution.includes_dsps}
                onCheckedChange={onSaveIncludesDsps}
                disabled={isSavingField === 'includes_dsps'}
              />
            </div>
            {/* Includes YouTube - Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="includes-youtube" className="text-sm text-muted-foreground">
                Includes YouTube
              </Label>
              <Switch
                id="includes-youtube"
                checked={distribution.includes_youtube}
                onCheckedChange={onSaveIncludesYoutube}
                disabled={isSavingField === 'includes_youtube'}
              />
            </div>
            {distribution.contract && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract</span>
                <Button variant="link" size="sm" className="h-auto p-0">
                  <FileText className="h-4 w-4 mr-1" />
                  {distribution.contract.contract_number}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Terms - Editable with Autosave */}
        <NotesSection
          notes={distribution.special_terms}
          onSave={onSaveSpecialTerms}
          isLoading={isLoading}
          title="Special Terms"
          placeholder="Add special terms for this deal..."
        />
      </div>

      {/* Team Assignments */}
      <AssignmentSection
        distributionId={distribution.id}
        assignments={distribution.assignments || []}
        createdBy={distribution.created_by}
      />

      {/* Notes Section - with Autosave */}
      <DistributionNotesSection
        notes={distribution.notes}
        onSave={onSaveNotes}
        isLoading={isLoading}
      />
    </div>
  )
}
