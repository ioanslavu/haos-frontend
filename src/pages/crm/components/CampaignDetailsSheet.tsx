import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  User,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Building2,
  Package,
  Users,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCampaign } from '@/api/hooks/useCampaigns';
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
import { Campaign, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS, CAMPAIGN_HANDLER_ROLE_COLORS } from '@/types/campaign';
import { CampaignHandlersDialog } from './CampaignHandlersDialog';
import { ENGAGEMENT_STAGE_COLORS, CONTACT_SENTIMENT_COLORS } from '@/types/contact';

interface CampaignDetailsSheetProps {
  campaignId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

export function CampaignDetailsSheet({
  campaignId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CampaignDetailsSheetProps) {
  const navigate = useNavigate();
  const [handlersDialogOpen, setHandlersDialogOpen] = useState(false);
  const { data: campaign, isLoading } = useCampaign(campaignId || 0, !!campaignId);

  const handleEdit = () => {
    if (campaign && onEdit) {
      onEdit(campaign);
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (campaign && onDelete) {
      onDelete(campaign);
      onOpenChange(false);
    }
  };

  const handleViewEntity = (entityId: number) => {
    navigate(`/entities/${entityId}`);
    onOpenChange(false);
  };

  if (!campaignId || !campaign) {
    return null;
  }

  const getEntityIcon = (kind: 'PF' | 'PJ') => {
    return kind === 'PJ' ? (
      <Building2 className="h-4 w-4 text-muted-foreground" />
    ) : (
      <User className="h-4 w-4 text-muted-foreground" />
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <SheetTitle className="text-xl">{campaign.campaign_name}</SheetTitle>
                    <SheetDescription className="mt-1">
                      Campaign Details
                      <div className="mt-2">
                        <Badge
                          className={`${CAMPAIGN_STATUS_COLORS[campaign.status]} px-3 py-1`}
                        >
                          {CAMPAIGN_STATUS_LABELS[campaign.status]}
                        </Badge>
                      </div>
                    </SheetDescription>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Campaign Value */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Campaign Value
                </h3>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    ${parseFloat(campaign.value).toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Entities Involved */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Entities Involved
                </h3>

                {/* Client */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Client</div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    {getEntityIcon(campaign.client.kind)}
                    <div className="flex-1">
                      <div className="font-medium">{campaign.client.display_name}</div>
                      {campaign.client.email && (
                        <div className="text-xs text-muted-foreground">{campaign.client.email}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEntity(campaign.client.id)}
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Contact Person */}
                  {campaign.contact_person && (
                    <div className="mt-3 p-3 border-l-2 border-primary/30 bg-primary/5 rounded-r">
                      <div className="text-xs text-muted-foreground mb-2">Primary Contact</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-sm">{campaign.contact_person.name}</span>
                          {campaign.contact_person.role_display && (
                            <Badge variant="outline" className="text-xs">
                              {campaign.contact_person.role_display}
                            </Badge>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2 flex-wrap">
                          {campaign.contact_person.engagement_stage && (
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ENGAGEMENT_STAGE_COLORS[campaign.contact_person.engagement_stage]}`}>
                              {campaign.contact_person.engagement_stage_display}
                            </div>
                          )}
                          {campaign.contact_person.sentiment && (
                            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CONTACT_SENTIMENT_COLORS[campaign.contact_person.sentiment]}`}>
                              {campaign.contact_person.sentiment_display}
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        {campaign.contact_person.emails && campaign.contact_person.emails.length > 0 && (
                          <div className="text-xs flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{campaign.contact_person.emails[0].email}</span>
                          </div>
                        )}
                        {campaign.contact_person.phones && campaign.contact_person.phones.length > 0 && (
                          <div className="text-xs flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{campaign.contact_person.phones[0].phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Artist */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Artist</div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    {getEntityIcon(campaign.artist.kind)}
                    <div className="flex-1">
                      <div className="font-medium">{campaign.artist.display_name}</div>
                      {campaign.artist.email && (
                        <div className="text-xs text-muted-foreground">{campaign.artist.email}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEntity(campaign.artist.id)}
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Brand */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Brand</div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    {getEntityIcon(campaign.brand.kind)}
                    <div className="flex-1">
                      <div className="font-medium">{campaign.brand.display_name}</div>
                      {campaign.brand.email && (
                        <div className="text-xs text-muted-foreground">{campaign.brand.email}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEntity(campaign.brand.id)}
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Show indicator if brand is same as client */}
                  {campaign.brand.id === campaign.client.id && (
                    <div className="text-xs text-muted-foreground italic pl-3">
                      ℹ️ Same entity as client
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Campaign Handlers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Campaign Handlers
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHandlersDialogOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </div>

                {campaign.handlers && campaign.handlers.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.handlers.map((handler) => (
                      <div
                        key={handler.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{handler.user_name || handler.user_email}</div>
                          {handler.user_name && handler.user_email && (
                            <div className="text-xs text-muted-foreground">{handler.user_email}</div>
                          )}
                        </div>
                        <Badge className={CAMPAIGN_HANDLER_ROLE_COLORS[handler.role]}>
                          {handler.role_display || handler.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    No handlers assigned
                  </div>
                )}
              </div>

              <Separator />

              {/* Campaign Notes */}
              {campaign.notes && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                      Notes
                    </h3>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm whitespace-pre-wrap">{campaign.notes}</p>
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Campaign Dates */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Important Dates
                </h3>

                {campaign.confirmed_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Confirmed</div>
                      <div className="font-medium">{format(new Date(campaign.confirmed_at), 'PPP')}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div>{format(new Date(campaign.created_at), 'PPP')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Last Updated</div>
                    <div>{format(new Date(campaign.updated_at), 'PPP')}</div>
                  </div>
                </div>

                {campaign.created_by_name && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Created by {campaign.created_by_name}
                  </div>
                )}
              </div>

              {/* Actions */}
              {(onEdit || onDelete) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-4">
                    {onEdit && (
                      <Button className="w-full" onClick={handleEdit}>
                        Edit Campaign
                      </Button>
                    )}
                    {onDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full text-destructive">
                            Delete Campaign
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the campaign
                              "{campaign.campaign_name}" and remove all associated data.
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
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>

      {/* Handlers Management Dialog */}
      {campaign && (
        <CampaignHandlersDialog
          open={handlersDialogOpen}
          onOpenChange={setHandlersDialogOpen}
          campaign={campaign}
        />
      )}
    </Sheet>
  );
}
