import { Hash, CreditCard, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';

interface SensitiveTabProps {
  entityKind: 'PF' | 'PJ';
  sensitiveIdentity: any;
  revealedCNP: string | null;
  revealedPassportNumber: string | null;
  revealing: boolean;
  onRevealCNP: () => void;
  onRevealPassportNumber: () => void;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function SensitiveTab({
  entityKind,
  sensitiveIdentity,
  revealedCNP,
  revealedPassportNumber,
  revealing,
  onRevealCNP,
  onRevealPassportNumber,
}: SensitiveTabProps) {
  if (entityKind !== 'PF') {
    return null;
  }

  return (
    <TabsContent value="sensitive" className="space-y-6">
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>Sensitive Information</CardTitle>
          <CardDescription>Personal identification data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sensitiveIdentity ? (
            <>
              {/* Document Type Badge */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Document Type</Label>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="flex-1 font-medium">
                    {sensitiveIdentity.identification_type_display ||
                      (sensitiveIdentity.identification_type === 'ID_CARD' ? 'Romanian ID Card' : 'Passport')}
                  </p>
                </div>
              </div>

              {/* ID Card Fields */}
              {sensitiveIdentity.identification_type === 'ID_CARD' && (
                <>
                  {/* CNP Display/Reveal */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">CNP (Personal Numeric Code)</Label>
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium font-mono">
                        {revealedCNP || sensitiveIdentity.cnp || 'Not set'}
                      </p>
                      {sensitiveIdentity.cnp && !revealedCNP && sensitiveIdentity.cnp.includes('***') && (
                        <Button size="sm" variant="outline" onClick={onRevealCNP} disabled={revealing}>
                          {revealing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Revealing...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Reveal
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ID Series */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">ID Series</Label>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium">{sensitiveIdentity.id_series || 'Not set'}</p>
                    </div>
                  </div>

                  {/* ID Number */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">ID Number</Label>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium">{sensitiveIdentity.id_number || 'Not set'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Passport Fields */}
              {sensitiveIdentity.identification_type === 'PASSPORT' && (
                <>
                  {/* Passport Number Display/Reveal */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Passport Number</Label>
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium font-mono">
                        {revealedPassportNumber || sensitiveIdentity.passport_number || 'Not set'}
                      </p>
                      {sensitiveIdentity.passport_number &&
                        !revealedPassportNumber &&
                        sensitiveIdentity.passport_number.includes('***') && (
                          <Button size="sm" variant="outline" onClick={onRevealPassportNumber} disabled={revealing}>
                            {revealing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Revealing...
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Reveal
                              </>
                            )}
                          </Button>
                        )}
                    </div>
                  </div>

                  {/* Passport Country */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Country of Issuance</Label>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium">{sensitiveIdentity.passport_country || 'Not set'}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Shared Fields (both ID card and passport) */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-4">Document Details</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Issued By</Label>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 font-medium">{sensitiveIdentity.id_issued_by || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Issue Date</Label>
                      <p className="font-medium">{sensitiveIdentity.id_issued_date || 'Not set'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Expiry Date</Label>
                      <p className="font-medium">{sensitiveIdentity.id_expiry_date || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{sensitiveIdentity.date_of_birth || 'Not set'}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Place of Birth</Label>
                      <p className="font-medium">{sensitiveIdentity.place_of_birth || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No sensitive information available for this entity.</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
