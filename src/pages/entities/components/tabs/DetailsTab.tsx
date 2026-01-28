import { Mail, Phone, MapPin, Calendar, User, Building2, Hash, CreditCard, UserCheck, UserPlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ClientScoreSection } from '@/pages/campaigns/components/ClientScoreSection';
import { ENGAGEMENT_STAGE_COLORS, CONTACT_SENTIMENT_COLORS } from '@/types/contact';

interface DetailsTabProps {
  entity: any;
  isClient: boolean;
  onAddContactPerson: () => void;
  onEditContactPerson: (contactPerson: any) => void;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function DetailsTab({
  entity,
  isClient,
  onAddContactPerson,
  onEditContactPerson,
}: DetailsTabProps) {
  return (
    <TabsContent value="details" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information for PF */}
        {entity.kind === 'PF' && (entity.first_name || entity.last_name) && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Individual details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(entity.first_name || entity.last_name) && (
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Legal Name</p>
                    <p className="font-medium">
                      {entity.first_name} {entity.last_name}
                    </p>
                  </div>
                </div>
              )}
              {entity.stage_name && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Stage Name</p>
                    <p className="font-medium">{entity.stage_name}</p>
                  </div>
                </div>
              )}
              {entity.gender && (
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">
                      {entity.gender === 'M' ? 'Male' : entity.gender === 'F' ? 'Female' : 'Other'}
                    </p>
                  </div>
                </div>
              )}
              {entity.nationality && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{entity.nationality}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details for this entity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entity.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{entity.email}</p>
                </div>
              </div>
            )}
            {entity.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{entity.phone}</p>
                </div>
              </div>
            )}
            {entity.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{entity.address}</p>
                  {entity.city && (
                    <p className="text-sm">
                      {entity.city}, {entity.state} {entity.zip_code}
                    </p>
                  )}
                  {entity.country && <p className="text-sm">{entity.country}</p>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Persons */}
        <Card className={cardClass}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Contact Persons</CardTitle>
              <CardDescription>Key contacts at this entity</CardDescription>
            </div>
            <Button size="sm" onClick={onAddContactPerson}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </CardHeader>
          <CardContent>
            {entity.contact_persons && entity.contact_persons.length > 0 ? (
              <div className="space-y-4">
                {entity.contact_persons.map((contact: any) => (
                  <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contact.name}</p>
                          {contact.role_display && <Badge variant="outline">{contact.role_display}</Badge>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {contact.engagement_stage && (
                            <Badge className={ENGAGEMENT_STAGE_COLORS[contact.engagement_stage]}>
                              {contact.engagement_stage_display}
                            </Badge>
                          )}
                          {contact.sentiment && (
                            <Badge className={CONTACT_SENTIMENT_COLORS[contact.sentiment]}>
                              {contact.sentiment_display}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onEditContactPerson(contact)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Emails */}
                    {contact.emails && contact.emails.length > 0 && (
                      <div className="space-y-1">
                        {contact.emails.map((email: any) => (
                          <div key={email.id} className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{email.label || 'Email'}:</span>
                            <span>{email.email}</span>
                            {email.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Phones */}
                    {contact.phones && contact.phones.length > 0 && (
                      <div className="space-y-1">
                        {contact.phones.map((phone: any) => (
                          <div key={phone.id} className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{phone.label || 'Phone'}:</span>
                            <span>{phone.phone_number}</span>
                            {phone.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {contact.notes && (
                      <div className="text-sm text-muted-foreground">
                        <p className="italic">"{contact.notes}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No contact persons added yet</p>
                <Button variant="outline" size="sm" onClick={onAddContactPerson} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Contact Person
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Information */}
        {entity.kind === 'PJ' && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Company registration and tax details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entity.company_registration_number && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-medium">{entity.company_registration_number}</p>
                  </div>
                </div>
              )}
              {entity.vat_number && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">VAT Number</p>
                    <p className="font-medium">{entity.vat_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Banking Information */}
        {(entity.iban || entity.bank_name || entity.bank_branch) && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Banking Information</CardTitle>
              <CardDescription>Bank account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entity.iban && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono">{entity.iban}</p>
                  </div>
                </div>
              )}
              {entity.bank_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{entity.bank_name}</p>
                  </div>
                </div>
              )}
              {entity.bank_branch && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Bank Branch</p>
                    <p className="font-medium">{entity.bank_branch}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Metadata and tracking information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(entity.created_at), 'PPpp')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(entity.updated_at), 'PPpp')}</p>
              </div>
            </div>
            {entity.created_by && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{entity.created_by}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {entity.notes && (
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes about this entity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{entity.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Client Score - only for entities with client role */}
        {isClient && <ClientScoreSection entityId={entity.id} entityName={entity.display_name} />}
      </div>
    </TabsContent>
  );
}
