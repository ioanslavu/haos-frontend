import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Hash,
  CreditCard,
  FileText,
  Loader2,
  Package,
  UserPlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntity, useEntityPlaceholders, useDeleteEntity, useDeleteContactPerson } from '@/api/hooks/useEntities';
import { useArtistAnalyticsDetail } from '@/api/hooks/useCampaigns';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import { ContactPersonFormDialog } from './ContactPersonFormDialog';
import { ContactPerson } from '@/api/services/entities.service';
import {
  ENGAGEMENT_STAGE_COLORS,
  CONTACT_SENTIMENT_COLORS,
} from '@/types/contact';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMediaUrl } from '@/lib/media';

interface EntityDetailsSheetProps {
  entityId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function EntityDetailsSheet({
  entityId,
  open,
  onOpenChange,
  onEdit,
}: EntityDetailsSheetProps) {
  const [contactPersonDialogOpen, setContactPersonDialogOpen] = useState(false);
  const [selectedContactPerson, setSelectedContactPerson] = useState<ContactPerson | null>(null);

  const { data: entity, isLoading } = useEntity(entityId || 0, !!entityId);
  const { data: placeholders } = useEntityPlaceholders(entityId || 0, !!entityId);
  const deleteEntity = useDeleteEntity();
  const deleteContactPerson = useDeleteContactPerson();

  // Check if entity is an artist
  const isArtist = entity?.entity_roles?.some(role => role.role === 'artist') || false;

  // Fetch artist analytics if entity is an artist
  const { data: artistAnalytics } = useArtistAnalyticsDetail(entityId || 0, isArtist && !!entityId);

  const handleDelete = async () => {
    if (!entityId) return;
    try {
      await deleteEntity.mutateAsync(entityId);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete entity:', error);
    }
  };

  const handleAddContactPerson = () => {
    setSelectedContactPerson(null);
    setContactPersonDialogOpen(true);
  };

  const handleEditContactPerson = (contactPerson: ContactPerson) => {
    setSelectedContactPerson(contactPerson);
    setContactPersonDialogOpen(true);
  };

  const handleDeleteContactPerson = async (contactPersonId: number) => {
    try {
      await deleteContactPerson.mutateAsync(contactPersonId);
      toast.success('Contact person deleted successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete contact person');
    }
  };

  if (!entityId || !entity) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-background shadow-lg">
                    <AvatarImage
                      src={getMediaUrl(entity.profile_photo) || `https://avatar.vercel.sh/${entity.display_name}`}
                      alt={entity.display_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg font-semibold">
                      {entity.display_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-xl">{entity.display_name}</SheetTitle>
                      {entity.kind === 'PJ' ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <SheetDescription className="mt-1">
                      {entity.kind === 'PJ' ? 'Legal Entity' : 'Physical Person'}
                      {entity.alias_name && (
                        <span className="block text-xs mt-1">alias: {entity.alias_name}</span>
                      )}
                      {entity.stage_name && (
                        <span className="block text-xs mt-1">aka "{entity.stage_name}"</span>
                      )}
                      {entity.entity_roles && entity.entity_roles.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entity.entity_roles.map((role) => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.role_display || role.role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className={`grid w-full ${isArtist ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {isArtist && <TabsTrigger value="campaigns">Campaigns</TabsTrigger>}
                  <TabsTrigger value="placeholders">Contract Fields</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      Contact Information
                    </h3>

                    {entity.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{entity.email}</span>
                      </div>
                    )}

                    {entity.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{entity.phone}</span>
                      </div>
                    )}

                    {(entity.address || entity.city || entity.country) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          {entity.address && <div>{entity.address}</div>}
                          <div>
                            {[entity.city, entity.state, entity.zip_code]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                          {entity.country && <div>{entity.country}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Business Information (for Legal Entities) */}
                  {entity.kind === 'PJ' && (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                          Business Information
                        </h3>

                        {entity.company_registration_number && (
                          <div className="flex items-center gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div className="text-xs text-muted-foreground">Registration Number</div>
                              <div>{entity.company_registration_number}</div>
                            </div>
                          </div>
                        )}

                        {entity.vat_number && (
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div className="text-xs text-muted-foreground">VAT Number</div>
                              <div>{entity.vat_number}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Contact Persons */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                        Contact Persons
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddContactPerson}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Contact
                      </Button>
                    </div>

                    {entity.contact_persons && entity.contact_persons.length > 0 ? (
                      <div className="space-y-3">
                        {entity.contact_persons.map((contact) => (
                          <div
                            key={contact.id}
                            className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{contact.name}</span>
                                {contact.role_display && (
                                  <Badge variant="secondary" className="text-xs">
                                    {contact.role_display}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditContactPerson(contact)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Contact Person</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {contact.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteContactPerson(contact.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>

                            {(contact.engagement_stage_display || contact.sentiment_display) && (
                              <div className="flex gap-2">
                                {contact.engagement_stage && (
                                  <Badge
                                    className={`text-xs ${ENGAGEMENT_STAGE_COLORS[contact.engagement_stage as keyof typeof ENGAGEMENT_STAGE_COLORS]}`}
                                  >
                                    {contact.engagement_stage_display}
                                  </Badge>
                                )}
                                {contact.sentiment && (
                                  <Badge
                                    className={`text-xs ${CONTACT_SENTIMENT_COLORS[contact.sentiment as keyof typeof CONTACT_SENTIMENT_COLORS]}`}
                                  >
                                    {contact.sentiment_display}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {contact.emails && contact.emails.length > 0 && (
                              <div className="space-y-1">
                                {contact.emails.map((email, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span>{email.email}</span>
                                    {email.label && (
                                      <span className="text-xs text-muted-foreground">
                                        ({email.label})
                                      </span>
                                    )}
                                    {email.is_primary && (
                                      <Badge variant="outline" className="text-xs">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {contact.phones && contact.phones.length > 0 && (
                              <div className="space-y-1">
                                {contact.phones.map((phone, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span>{phone.phone}</span>
                                    {phone.label && (
                                      <span className="text-xs text-muted-foreground">
                                        ({phone.label})
                                      </span>
                                    )}
                                    {phone.is_primary && (
                                      <Badge variant="outline" className="text-xs">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {contact.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                {contact.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                        No contact persons added yet
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Additional Information */}
                  {entity.notes && (
                    <>
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                          Notes
                        </h3>
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm whitespace-pre-wrap">{entity.notes}</p>
                        </div>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Metadata */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      System Information
                    </h3>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="text-xs text-muted-foreground">Created</div>
                        <div>{format(new Date(entity.created_at), 'PPP')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="text-xs text-muted-foreground">Last Updated</div>
                        <div>{format(new Date(entity.updated_at), 'PPP')}</div>
                      </div>
                    </div>

                    {entity.created_by && (
                      <div className="text-sm text-muted-foreground">
                        Created by User #{entity.created_by}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {isArtist && (
                  <TabsContent value="campaigns" className="space-y-4 mt-4">
                    {artistAnalytics ? (
                      <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{artistAnalytics.total_campaigns}</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                ${parseFloat(artistAnalytics.total_value).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{artistAnalytics.unique_clients}</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{artistAnalytics.unique_brands}</div>
                            </CardContent>
                          </Card>
                        </div>

                        <Separator />

                        {/* Avg Campaign Value */}
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Campaign Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              ${artistAnalytics.total_campaigns > 0
                                ? (parseFloat(artistAnalytics.total_value) / artistAnalytics.total_campaigns).toLocaleString(
                                    undefined,
                                    { maximumFractionDigits: 0 }
                                  )
                                : 0}
                            </div>
                          </CardContent>
                        </Card>

                        <Separator />

                        {/* Status Breakdown */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            Campaign Status Breakdown
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(artistAnalytics.campaigns_by_status).map(([status, count]) => (
                              <Badge
                                key={status}
                                className={`${CAMPAIGN_STATUS_COLORS[status as keyof typeof CAMPAIGN_STATUS_COLORS]} px-3 py-1`}
                              >
                                {CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS]}: {count as number}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Top Brands */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            Top Brands
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Brand</TableHead>
                                <TableHead className="text-right">Campaigns</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {artistAnalytics.brands.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    No brands found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                artistAnalytics.brands.slice(0, 5).map((brand) => (
                                  <TableRow key={brand.id}>
                                    <TableCell className="font-medium">{brand.name}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant="secondary">{brand.campaign_count}</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <Separator />

                        {/* Top Clients */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            Top Clients
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Campaigns</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {artistAnalytics.clients.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                                    No clients found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                artistAnalytics.clients.slice(0, 5).map((client) => (
                                  <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant="secondary">{client.campaign_count}</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="placeholders" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      Contract Placeholder Values
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      These values are automatically filled when generating contracts for this entity.
                    </p>

                    {placeholders && Object.keys(placeholders).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(placeholders).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b">
                            <span className="text-sm font-mono text-muted-foreground">
                              {`{{${key}}}`}
                            </span>
                            <span className="text-sm font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No placeholder values available.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 mt-4">
                  <ActivityTimeline entityId={entity.id} />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <Button className="w-full" onClick={onEdit}>
                  Edit Entity
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline">Generate Contract</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive">
                        Delete Entity
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the entity
                          and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      {/* Contact Person Dialog */}
      {entityId && (
        <ContactPersonFormDialog
          open={contactPersonDialogOpen}
          onOpenChange={setContactPersonDialogOpen}
          entityId={entityId}
          contactPerson={selectedContactPerson}
        />
      )}
    </Sheet>
  );
}