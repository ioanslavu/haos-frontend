import { ArrowLeft, Edit, FileText, Trash2, User, Building2, Pencil, Loader2, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EntityHeaderProps {
  entity: any;
  isAdmin: boolean;
  showContractGeneration: boolean;
  saving: boolean;
  previewing: boolean;
  onNavigateBack: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onGenerateContractClick: () => void;
  onBackToDetails: () => void;
  onSaveDraft: () => void;
  onPreview: () => void;
  onRequestEdit: () => void;
  onRequestDelete: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function EntityHeader({
  entity,
  isAdmin,
  showContractGeneration,
  saving,
  previewing,
  onNavigateBack,
  onEditClick,
  onDeleteClick,
  onGenerateContractClick,
  onBackToDetails,
  onSaveDraft,
  onPreview,
  onRequestEdit,
  onRequestDelete,
}: EntityHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onNavigateBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://avatar.vercel.sh/${entity.display_name}`} />
            <AvatarFallback>{getInitials(entity.display_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {entity.display_name}
            </h1>
            {entity.alias_name && (
              <p className="text-lg text-muted-foreground mt-1">alias: {entity.alias_name}</p>
            )}
            {entity.stage_name && (
              <p className="text-lg text-muted-foreground mt-1">aka "{entity.stage_name}"</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={entity.kind === 'PF' ? 'default' : 'secondary'}>
                {entity.kind === 'PF' ? (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Physical Person
                  </>
                ) : (
                  <>
                    <Building2 className="h-3 w-3 mr-1" />
                    Legal Entity
                  </>
                )}
              </Badge>
              {entity.entity_roles?.map((roleObj: any) => (
                <Badge key={roleObj.id} variant={roleObj.primary_role ? 'default' : 'outline'}>
                  {roleObj.role_display || roleObj.role}
                  {roleObj.primary_role && ' (Primary)'}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {!showContractGeneration && (
          <>
            {isAdmin ? (
              <>
                <Button onClick={onEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Entity
                </Button>
                {entity.kind === 'PF' && (
                  <Button variant="outline" onClick={onGenerateContractClick}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Contract
                  </Button>
                )}
                <Button variant="destructive" onClick={onDeleteClick}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entity
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onRequestEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Request Edit
                </Button>
                <Button variant="outline" onClick={onRequestDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Delete
                </Button>
              </>
            )}
          </>
        )}
        {showContractGeneration && (
          <>
            <Button variant="ghost" onClick={onBackToDetails}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
            <Button variant="outline" onClick={onSaveDraft} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button variant="outline" onClick={onPreview} disabled={previewing}>
              {previewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
