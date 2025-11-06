import { useRef } from 'react'
import { Proposal } from '@/types/artist-sales'
import { formatDate, formatMoney } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Download, Mail } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ProposalPreviewProps {
  proposal: Proposal
  onSendToClient?: () => void
}

export function ProposalPreview({ proposal, onSendToClient }: ProposalPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card>
      <CardHeader className="print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proposal Preview</h2>
          <div className="flex gap-2">
            {onSendToClient && (
              <Button variant="default" size="sm" onClick={onSendToClient}>
                <Mail className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Print/Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* PDF-Style Preview */}
        <div ref={previewRef} className="bg-white p-12 space-y-8 print:p-0 rounded-lg border">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">PROPOSAL</h1>
              <p className="text-muted-foreground">
                {proposal.opportunity.opp_name}
              </p>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className="mb-2">
                Version {proposal.version}
              </Badge>
              <p className="text-sm">
                <strong>Date:</strong> {formatDate(proposal.sent_date || proposal.created_at)}
              </p>
              {proposal.valid_until && (
                <p className="text-sm">
                  <strong>Valid Until:</strong> {formatDate(proposal.valid_until)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-3">Prepared For:</h3>
              <p className="text-base font-medium">{proposal.opportunity.account.name}</p>
              {proposal.opportunity.account.legal_name && (
                <p className="text-sm text-muted-foreground">
                  {proposal.opportunity.account.legal_name}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Prepared By:</h3>
              <p className="text-base font-medium">
                {proposal.created_by_name || 'The Team'}
              </p>
              <p className="text-sm text-muted-foreground">Artist Sales Team</p>
            </div>
          </div>

          <Separator />

          {/* Artists Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Selected Artists</h3>
            {proposal.proposal_artists && proposal.proposal_artists.length > 0 ? (
              <div className="space-y-3">
                {proposal.proposal_artists.map((pa, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                        {pa.artist?.display_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-base">{pa.artist?.display_name || 'Unknown Artist'}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {pa.role_display || pa.role}
                        </p>
                      </div>
                    </div>
                    {pa.proposed_fee && (
                      <p className="font-semibold text-lg">
                        {formatMoney(parseFloat(pa.proposed_fee), proposal.currency)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No artists assigned yet</p>
            )}
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Gross Fee:</span>
                <span className="font-medium text-base">
                  {formatMoney(parseFloat(proposal.fee_gross), proposal.currency)}
                </span>
              </div>

              {parseFloat(proposal.discounts) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Discounts:</span>
                  <span className="font-medium text-base text-red-600">
                    -{formatMoney(parseFloat(proposal.discounts), proposal.currency)}
                  </span>
                </div>
              )}

              {parseFloat(proposal.agency_fee) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Agency Fee:</span>
                  <span className="font-medium text-base">
                    {formatMoney(parseFloat(proposal.agency_fee), proposal.currency)}
                  </span>
                </div>
              )}

              <Separator className="my-3" />

              <div className="flex justify-between items-center py-2 bg-primary/5 px-4 rounded-lg">
                <span className="font-semibold text-lg">Total Investment:</span>
                <span className="font-bold text-2xl text-primary">
                  {formatMoney(parseFloat(proposal.fee_net), proposal.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {proposal.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-4">Additional Notes</h3>
                <p className="text-base whitespace-pre-wrap text-muted-foreground">
                  {proposal.notes}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-muted">
            <p className="text-sm text-center text-muted-foreground">
              This proposal is valid until {proposal.valid_until ? formatDate(proposal.valid_until) : 'further notice'}.
              <br />
              All fees are quoted in {proposal.currency} and are subject to applicable taxes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
