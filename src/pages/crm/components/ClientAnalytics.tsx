import { useState } from 'react'
import { useClientAnalyticsDetail } from '@/api/hooks/useCampaigns'
import { useEntity } from '@/api/hooks/useEntities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, Users, DollarSign, Package, Building2, UserPlus, Mail, Phone, Pencil } from 'lucide-react'
import { ContactPersonFormDialog } from './ContactPersonFormDialog'
import { ENGAGEMENT_STAGE_COLORS, CONTACT_SENTIMENT_COLORS } from '@/types/contact'
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS } from '@/types/campaign'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CampaignCard } from './CampaignCard'

interface ClientAnalyticsProps {
  clientId: number
  onCampaignEdit?: (campaign: any) => void
  onCampaignDelete?: (campaign: any) => void
  onCampaignClick?: (campaign: any) => void
}

export function ClientAnalytics({ clientId, onCampaignEdit, onCampaignDelete, onCampaignClick }: ClientAnalyticsProps) {
  const { data: analytics, isLoading, error } = useClientAnalyticsDetail(clientId)
  const { data: entity } = useEntity(clientId)

  const [contactPersonDialogOpen, setContactPersonDialogOpen] = useState(false)
  const [editingContactPerson, setEditingContactPerson] = useState<any | null>(null)

  const handleAddContactPerson = () => {
    setEditingContactPerson(null)
    setContactPersonDialogOpen(true)
  }

  const handleEditContactPerson = (contactPerson: any) => {
    setEditingContactPerson(contactPerson)
    setContactPersonDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load client analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div>
        <h2 className="text-3xl font-bold">{analytics.client_name}</h2>
        <p className="text-muted-foreground">Client Campaign Analytics</p>
      </div>

      {/* Contact Persons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contact Persons</CardTitle>
            <CardDescription>Key contacts at this client</CardDescription>
          </div>
          <Button size="sm" onClick={handleAddContactPerson}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {entity?.contact_persons && entity.contact_persons.length > 0 ? (
            <div className="space-y-4">
              {entity.contact_persons.map((contact: any) => (
                <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.name}</p>
                        {contact.role_display && (
                          <Badge variant="outline">{contact.role_display}</Badge>
                        )}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContactPerson(contact)}
                    >
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
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
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
                          <span>{phone.phone}</span>
                          {phone.is_primary && (
                            <Badge variant="secondary" className="text-xs">Primary</Badge>
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddContactPerson}
                className="mt-4"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Contact Person
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_campaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(analytics.total_value).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_artists}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.unique_brands}</div>
          </CardContent>
        </Card>
      </div>

      {/* Avg Campaign Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Campaign Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${analytics.total_campaigns > 0
              ? (parseFloat(analytics.total_value) / analytics.total_campaigns).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )
              : 0}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Status Breakdown</CardTitle>
          <CardDescription>Distribution of campaigns across different statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.campaigns_by_status).map(([status, count]) => (
              <Badge
                key={status}
                className={`${CAMPAIGN_STATUS_COLORS[status as keyof typeof CAMPAIGN_STATUS_COLORS]} px-4 py-2 text-sm`}
              >
                {CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS]}: {count as number}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Artist Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Artists by Campaign Count</CardTitle>
          <CardDescription>Artists this client has worked with</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.artists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No artists found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.artists.map((artist) => (
                  <TableRow key={artist.id}>
                    <TableCell className="font-medium">{artist.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{artist.campaign_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Brand Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brands by Campaign Count</CardTitle>
          <CardDescription>Brands this client has used</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Campaigns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No brands found
                  </TableCell>
                </TableRow>
              ) : (
                analytics.brands.map((brand) => (
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
        </CardContent>
      </Card>

      {/* All Campaigns */}
      {analytics.campaigns && analytics.campaigns.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">All Campaigns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={onCampaignEdit}
                onDelete={onCampaignDelete}
                onClick={onCampaignClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contact Person Dialog */}
      {entity && (
        <ContactPersonFormDialog
          open={contactPersonDialogOpen}
          onOpenChange={setContactPersonDialogOpen}
          entityId={entity.id}
          contactPerson={editingContactPerson}
        />
      )}
    </div>
  )
}
