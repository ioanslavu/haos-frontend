/**
 * SendForSignatureDialog - Dialog for sending contracts for e-signature
 */

import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Loader2,
  Plus,
  Send,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface SendForSignatureDialogProps {
  ctx: UseCampaignDetailReturn
}

export function SendForSignatureDialog({ ctx }: SendForSignatureDialogProps) {
  const {
    campaign,
    validation,
    validationLoading,
    sendSignatureContract,
    setSendSignatureContract,
    signers,
    setSigners,
    testMode,
    setTestMode,
    handleSendForSignature,
    sendForSignature,
  } = ctx

  return (
    <Dialog
      open={!!sendSignatureContract}
      onOpenChange={(open) => !open && setSendSignatureContract(null)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send for Signature
          </DialogTitle>
          <DialogDescription>
            Send {sendSignatureContract?.contract_title || sendSignatureContract?.contract_number} for e-signature via Dropbox Sign.
          </DialogDescription>
        </DialogHeader>

        {validationLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading signer information...</span>
          </div>
        ) : (
          <form onSubmit={handleSendForSignature} className="space-y-4">
            {/* Client validation warning */}
            {validation?.signers?.client && !validation.signers.client.is_valid && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  <span className="font-medium">Missing client information:</span>
                  <ul className="mt-1 ml-4 list-disc text-sm">
                    {validation.signers.client.missing_fields?.map((field) => (
                      <li key={field.field}>{field.label}</li>
                    ))}
                  </ul>
                  <Link
                    to={`/entities/${campaign?.client?.id}`}
                    className="text-xs underline mt-2 inline-block"
                  >
                    Edit client profile →
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Signers (in signing order)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSigners([...signers, { email: '', name: '', role: '' }])}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Signer
                </Button>
              </div>

              {signers.map((signer, index) => {
                const isHahahaRep = signer.role === 'HaHaHa Production'
                const isClient = signer.role === 'Client'
                const clientInvalid = isClient && validation?.signers?.client && !validation.signers.client.is_valid

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border space-y-3",
                      isHahahaRep && "bg-indigo-500/10 border-indigo-500/30",
                      isClient && !clientInvalid && "bg-muted/30",
                      clientInvalid && "bg-amber-500/10 border-amber-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}. {isHahahaRep ? 'HaHaHa Representative' : isClient ? 'Client' : `Signer ${index + 1}`}
                        </span>
                        {clientInvalid && (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      {signers.length > 1 && !isHahahaRep && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setSigners(signers.filter((_, i) => i !== index))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`name-${index}`} className="text-xs">Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={signer.name}
                          onChange={(e) => {
                            const newSigners = [...signers]
                            newSigners[index].name = e.target.value
                            setSigners(newSigners)
                          }}
                          placeholder="Full name"
                          className={cn(
                            "h-8 text-sm",
                            isHahahaRep && "bg-indigo-500/5"
                          )}
                          readOnly={isHahahaRep}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`role-${index}`} className="text-xs">Role</Label>
                        <Input
                          id={`role-${index}`}
                          value={signer.role}
                          onChange={(e) => {
                            const newSigners = [...signers]
                            newSigners[index].role = e.target.value
                            setSigners(newSigners)
                          }}
                          placeholder="e.g. Client, Artist"
                          className={cn(
                            "h-8 text-sm",
                            (isHahahaRep || isClient) && "bg-muted/50"
                          )}
                          readOnly={isHahahaRep || isClient}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`email-${index}`} className="text-xs">Email *</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        value={signer.email}
                        onChange={(e) => {
                          const newSigners = [...signers]
                          newSigners[index].email = e.target.value
                          setSigners(newSigners)
                        }}
                        placeholder="email@example.com"
                        className={cn(
                          "h-8 text-sm",
                          isHahahaRep && "bg-indigo-500/5",
                          clientInvalid && !signer.email && "border-amber-500"
                        )}
                        readOnly={isHahahaRep}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
              <div>
                <Label htmlFor="test-mode" className="text-sm font-medium">Test Mode</Label>
                <p className="text-xs text-muted-foreground">
                  {testMode
                    ? 'All signature requests will be sent to a test email'
                    : 'Signatures will be legally binding'}
                </p>
              </div>
              <Switch
                id="test-mode"
                checked={testMode}
                onCheckedChange={setTestMode}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSendSignatureContract(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendForSignature.isPending || signers.some(s => !s.email || !s.name)}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {sendForSignature.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send for Signature
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
