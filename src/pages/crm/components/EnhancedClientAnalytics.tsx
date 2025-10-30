import { useState, useMemo } from 'react'
import { useClientAnalyticsDetail } from '@/api/hooks/useCampaigns'
import { useEntity } from '@/api/hooks/useEntities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, TrendingUp, Users, DollarSign, Package, Building2, UserPlus, Mail, Phone, Pencil, BarChart3 } from 'lucide-react'
import { ContactPersonFormDialog } from './ContactPersonFormDialog'
import { ENGAGEMENT_STAGE_COLORS, CONTACT_SENTIMENT_COLORS } from '@/types/contact'
import { CAMPAIGN_STATUS_LABELS, CampaignStatus } from '@/types/campaign'
import { StatusDistributionChart } from '@/components/crm/charts/StatusDistributionChart'
import { CampaignCard } from './CampaignCard'
import { motion } from 'framer-motion'

interface EnhancedClientAnalyticsProps {
  clientId: number
  onCampaignEdit?: (campaign: any) => void
  onCampaignDelete?: (campaign: any) => void
  onCampaignClick?: (campaign: any) => void
}

export function EnhancedClientAnalytics({
  clientId,
  onCampaignEdit,
  onCampaignDelete,
  onCampaignClick,
}: EnhancedClientAnalyticsProps) {
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

  const statusDistribution = useMemo(() => {
    if (!analytics) return {}
    return Object.entries(analytics.campaigns_by_status).reduce(
      (acc, [status, count]) => {
        acc[status as CampaignStatus] = count as number
        return acc
      },
      {} as Record<CampaignStatus, number>
    )
  }, [analytics])

  const avgCampaignValue = useMemo(() => {
    if (!analytics || analytics.total_campaigns === 0) return 0
    return parseFloat(analytics.total_value) / analytics.total_campaigns
  }, [analytics])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Failed to load client analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg border bg-gradient-to-br from-primary/10 via-background to-background p-6"
      >
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight">{analytics.client_name}</h2>
          <p className="text-muted-foreground mt-1">Complete Campaign Analytics & Insights</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
      </motion.div>

      {/* Bento Grid Stats - Modern Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.total_campaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">Active & Completed</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(parseFloat(analytics.total_value) / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: ${avgCampaignValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Artists</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.unique_artists}</div>
              <p className="text-xs text-muted-foreground mt-1">Collaborations</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-2">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Brands</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.unique_brands}</div>
              <p className="text-xs text-muted-foreground mt-1">Partnerships</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Two Column Layout - Chart and Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <StatusDistributionChart
            data={statusDistribution}
            title="Campaign Status Distribution"
            description="Breakdown of campaigns by current status"
            height={350}
          />
        </motion.div>

        {/* Contact Persons */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Contact Persons</CardTitle>
                <CardDescription>Key contacts at this client</CardDescription>
              </div>
              <Button size="sm" onClick={handleAddContactPerson}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto">
              {entity?.contact_persons && entity.contact_persons.length > 0 ? (
                <div className="space-y-3">
                  {entity.contact_persons.map((contact: any) => (
                    <div
                      key={contact.id}
                      className="border rounded-lg p-3 space-y-2 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{contact.name}</p>
                            {contact.role_display && (
                              <Badge variant="outline" className="text-xs">
                                {contact.role_display}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {contact.engagement_stage && (
                              <Badge className={`text-xs ${ENGAGEMENT_STAGE_COLORS[contact.engagement_stage]}`}>
                                {contact.engagement_stage_display}
                              </Badge>
                            )}
                            {contact.sentiment && (
                              <Badge className={`text-xs ${CONTACT_SENTIMENT_COLORS[contact.sentiment]}`}>
                                {contact.sentiment_display}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContactPerson(contact)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Contact Methods */}
                      <div className="space-y-1">
                        {contact.emails && contact.emails.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{contact.emails[0].email}</span>
                            {contact.emails[0].is_primary && (
                              <Badge variant="secondary" className="text-[10px] h-4">
                                Primary
                              </Badge>
                            )}
                          </div>
                        )}
                        {contact.phones && contact.phones.length > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{contact.phones[0].phone}</span>
                            {contact.phones[0].is_primary && (
                              <Badge variant="secondary" className="text-[10px] h-4">
                                Primary
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {contact.notes && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">"{contact.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No contact persons added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddContactPerson}
                    className="mt-3"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Partner Tables - Compact Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Artists */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partnered Artists</CardTitle>
              <CardDescription>Artists this client has worked with</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.artists.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No artists yet</div>
              ) : (
                <div className="space-y-2">
                  {analytics.artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <span className="font-medium text-sm">{artist.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {artist.campaign_count} campaign{artist.campaign_count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Brands */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Associated Brands</CardTitle>
              <CardDescription>Brands this client has used</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.brands.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No brands yet</div>
              ) : (
                <div className="space-y-2">
                  {analytics.brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <span className="font-medium text-sm">{brand.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {brand.campaign_count} campaign{brand.campaign_count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* All Campaigns */}
      {analytics.campaigns && analytics.campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              All Campaigns ({analytics.campaigns.length})
            </h3>
          </div>
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
        </motion.div>
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
