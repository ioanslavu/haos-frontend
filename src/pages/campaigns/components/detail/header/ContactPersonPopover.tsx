/**
 * ContactPersonPopover - Contact person selection and creation popover
 */

import {
  Edit2,
  Loader2,
  Mail,
  Phone,
  Plus,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  CONTACT_ROLE_LABELS,
  ENGAGEMENT_STAGE_LABELS,
  CONTACT_SENTIMENT_LABELS,
  ENGAGEMENT_STAGE_COLORS,
  CONTACT_SENTIMENT_COLORS,
  ContactRole,
  EngagementStage,
  ContactSentiment,
} from '@/types/contact'

interface ContactPersonPopoverProps {
  campaign: any
  contactPersons: any[]
  clientProfile: any
  isSavingContactPerson: boolean
  showCreateContact: boolean
  setShowCreateContact: (show: boolean) => void
  newContactName: string
  setNewContactName: (name: string) => void
  newContactEmail: string
  setNewContactEmail: (email: string) => void
  newContactPhone: string
  setNewContactPhone: (phone: string) => void
  handleChangeContactPerson: (id: string) => void
  handleCreateContactPerson: () => void
  setEditingContactPerson: (cp: any) => void
  createContactPerson: any
  resetContactForm: () => void
}

export function ContactPersonPopover({
  campaign,
  contactPersons,
  clientProfile,
  isSavingContactPerson,
  showCreateContact,
  setShowCreateContact,
  newContactName,
  setNewContactName,
  newContactEmail,
  setNewContactEmail,
  newContactPhone,
  setNewContactPhone,
  handleChangeContactPerson,
  handleCreateContactPerson,
  setEditingContactPerson,
  createContactPerson,
  resetContactForm,
}: ContactPersonPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/50",
            !campaign.contact_person && "text-amber-500"
          )}
          disabled={isSavingContactPerson}
        >
          <User className="h-3.5 w-3.5" />
          {isSavingContactPerson ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : campaign.contact_person ? (
            <span>{campaign.contact_person.name}</span>
          ) : (
            <span>Contact</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Contact Person</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateContact(true)}
              className="h-6 text-xs px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>
          {showCreateContact ? (
            <CreateContactForm
              newContactName={newContactName}
              setNewContactName={setNewContactName}
              newContactEmail={newContactEmail}
              setNewContactEmail={setNewContactEmail}
              newContactPhone={newContactPhone}
              setNewContactPhone={setNewContactPhone}
              handleCreateContactPerson={handleCreateContactPerson}
              createContactPerson={createContactPerson}
              resetContactForm={resetContactForm}
            />
          ) : (
            <>
              {campaign.contact_person ? (
                <ContactPersonDetails
                  contactPerson={campaign.contact_person}
                  isSavingContactPerson={isSavingContactPerson}
                  handleChangeContactPerson={handleChangeContactPerson}
                  setEditingContactPerson={setEditingContactPerson}
                />
              ) : (
                <ContactPersonList
                  contactPersons={contactPersons}
                  isSavingContactPerson={isSavingContactPerson}
                  handleChangeContactPerson={handleChangeContactPerson}
                />
              )}

              {clientProfile && (
                <ClientHealthSection clientProfile={clientProfile} />
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CreateContactForm({
  newContactName,
  setNewContactName,
  newContactEmail,
  setNewContactEmail,
  newContactPhone,
  setNewContactPhone,
  handleCreateContactPerson,
  createContactPerson,
  resetContactForm,
}: {
  newContactName: string
  setNewContactName: (name: string) => void
  newContactEmail: string
  setNewContactEmail: (email: string) => void
  newContactPhone: string
  setNewContactPhone: (phone: string) => void
  handleCreateContactPerson: () => void
  createContactPerson: any
  resetContactForm: () => void
}) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Name *"
        value={newContactName}
        onChange={(e) => setNewContactName(e.target.value)}
        className="h-8 text-sm"
        autoFocus
      />
      <Input
        placeholder="Email"
        type="email"
        value={newContactEmail}
        onChange={(e) => setNewContactEmail(e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        placeholder="Phone"
        value={newContactPhone}
        onChange={(e) => setNewContactPhone(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={resetContactForm}
          className="h-7 text-xs flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleCreateContactPerson}
          disabled={!newContactName.trim() || createContactPerson.isPending}
          className="h-7 text-xs flex-1"
        >
          {createContactPerson.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </div>
  )
}

function ContactPersonDetails({
  contactPerson,
  isSavingContactPerson,
  handleChangeContactPerson,
  setEditingContactPerson,
}: {
  contactPerson: any
  isSavingContactPerson: boolean
  handleChangeContactPerson: (id: string) => void
  setEditingContactPerson: (cp: any) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{contactPerson.name}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => handleChangeContactPerson('none')}
          disabled={isSavingContactPerson}
          title="Remove contact person"
        >
          {isSavingContactPerson ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {contactPerson.role && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {CONTACT_ROLE_LABELS[contactPerson.role as ContactRole] || contactPerson.role}
          </Badge>
        )}
        {contactPerson.engagement_stage && (
          <Badge className={cn("text-[10px] px-1.5 py-0", ENGAGEMENT_STAGE_COLORS[contactPerson.engagement_stage as EngagementStage])}>
            {ENGAGEMENT_STAGE_LABELS[contactPerson.engagement_stage as EngagementStage]?.split(' ')[0] || contactPerson.engagement_stage}
          </Badge>
        )}
        {contactPerson.sentiment && (
          <Badge className={cn("text-[10px] px-1.5 py-0", CONTACT_SENTIMENT_COLORS[contactPerson.sentiment as ContactSentiment])}>
            {CONTACT_SENTIMENT_LABELS[contactPerson.sentiment as ContactSentiment]?.split(' ')[0] || contactPerson.sentiment}
          </Badge>
        )}
      </div>
      <div className="space-y-1 text-xs">
        {contactPerson.emails?.[0]?.email && (
          <a
            href={`mailto:${contactPerson.emails[0].email}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-3 w-3" />
            {contactPerson.emails[0].email}
          </a>
        )}
        {contactPerson.phones?.[0]?.phone && (
          <a
            href={`tel:${contactPerson.phones[0].phone}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3 w-3" />
            {contactPerson.phones[0].phone}
          </a>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs mt-1"
        onClick={() => setEditingContactPerson(contactPerson)}
      >
        <Edit2 className="h-3 w-3 mr-1" />
        Edit Contact
      </Button>
    </div>
  )
}

function ContactPersonList({
  contactPersons,
  isSavingContactPerson,
  handleChangeContactPerson,
}: {
  contactPersons: any[]
  isSavingContactPerson: boolean
  handleChangeContactPerson: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      {contactPersons.length > 0 ? (
        contactPersons.map((cp) => (
          <button
            key={cp.id}
            onClick={() => handleChangeContactPerson(cp.id.toString())}
            disabled={isSavingContactPerson}
            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors disabled:opacity-50"
          >
            {cp.name}
          </button>
        ))
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          No contacts yet. Click "New" to create one.
        </p>
      )}
    </div>
  )
}

function ClientHealthSection({ clientProfile }: { clientProfile: any }) {
  return (
    <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
      <div className="text-xs font-medium flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" />
        Client Health
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <HealthScoreItem label="Collaboration" score={clientProfile.collaboration_frequency_score} />
        <HealthScoreItem label="Feedback" score={clientProfile.feedback_score} />
        <div className="col-span-2">
          <HealthScoreItem label="Payment Timeliness" score={clientProfile.payment_latency_score} />
        </div>
      </div>
    </div>
  )
}

function HealthScoreItem({ label, score }: { label: string; score: number | null | undefined }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded bg-muted/30">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "font-medium",
        !score && "text-muted-foreground",
        score && score <= 3 && "text-red-500",
        score && score > 3 && score <= 6 && "text-yellow-500",
        score && score > 6 && "text-green-500"
      )}>
        {score ?? '-'}/10
      </span>
    </div>
  )
}
