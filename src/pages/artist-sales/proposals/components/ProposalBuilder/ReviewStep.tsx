import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ProposalBuilderData } from './index'
import { CheckCircle2 } from 'lucide-react'

interface ReviewStepProps {
  data: ProposalBuilderData
  updateData: (updates: Partial<ProposalBuilderData>) => void
}

const ARTIST_ROLES = {
  main: 'Main Artist',
  featured: 'Featured Artist',
  guest: 'Guest Artist',
  ensemble: 'Ensemble',
}

const DELIVERABLE_TYPES: Record<string, string> = {
  ig_post: 'Instagram Post',
  ig_story: 'Instagram Story',
  ig_reel: 'Instagram Reel',
  tiktok_video: 'TikTok Video',
  youtube_video: 'YouTube Video',
  tvc: 'TV Commercial',
  event: 'Event Appearance',
  other: 'Other',
}

export function ReviewStep({ data }: ReviewStepProps) {
  const feeNet = (
    parseFloat(data.feeGross) -
    parseFloat(data.discounts) +
    parseFloat(data.agencyFee)
  ).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        <div className="text-sm">
          <p className="font-medium text-green-900 dark:text-green-100">
            Ready to submit
          </p>
          <p className="text-green-700 dark:text-green-300">
            Review your proposal details below and click Submit to create the proposal.
          </p>
        </div>
      </div>

      {/* Artists Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Artists ({data.artists.length})</h3>
        <div className="space-y-2">
          {data.artists.map((artist, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Artist ID: {artist.artistId}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {ARTIST_ROLES[artist.role]}
                </Badge>
              </div>
              {artist.proposedFee && (
                <span className="font-medium">{data.currency} {artist.proposedFee}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Deliverables Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Deliverables ({data.deliverables.length})</h3>
        <div className="space-y-2">
          {data.deliverables.map((deliverable, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-medium">{DELIVERABLE_TYPES[deliverable.type] || deliverable.type}</p>
                <Badge variant="outline">×{deliverable.quantity}</Badge>
              </div>
              {deliverable.description && (
                <p className="text-sm text-muted-foreground mt-1">{deliverable.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Usage Terms Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Usage Terms</h3>
        {data.usageTermsId ? (
          <div className="p-3 border rounded-lg">
            <p className="font-medium">Template ID: {data.usageTermsId}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Usage terms template will be applied to this proposal
            </p>
          </div>
        ) : (
          <div className="p-3 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            No usage terms selected
          </div>
        )}
      </div>

      <Separator />

      {/* Pricing Summary */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Pricing</h3>
        <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Fee:</span>
            <span className="font-medium">{data.currency} {parseFloat(data.feeGross).toFixed(2)}</span>
          </div>
          {parseFloat(data.discounts) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discounts:</span>
              <span className="font-medium text-red-600">
                -{data.currency} {parseFloat(data.discounts).toFixed(2)}
              </span>
            </div>
          )}
          {parseFloat(data.agencyFee) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Agency Fee:</span>
              <span className="font-medium">
                +{data.currency} {parseFloat(data.agencyFee).toFixed(2)}
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="font-semibold text-lg">Net Fee:</span>
            <span className="font-bold text-2xl text-primary">
              {data.currency} {feeNet}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Notes</h3>
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
