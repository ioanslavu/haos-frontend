import { Button } from '@/components/ui/button';
import { useManualTriggers, useExecuteTrigger } from '@/api/hooks/useTriggers';
import { TriggerEntityType } from '@/api/types/triggers';
import { Loader2 } from 'lucide-react';

interface ManualTriggerButtonProps {
  entityType: TriggerEntityType;
  entityId: number;
  context?: string;
  contextData?: Record<string, any>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
}

const buttonStyleToVariant = (style: string): 'default' | 'outline' | 'destructive' | 'secondary' => {
  switch (style) {
    case 'primary':
      return 'default';
    case 'danger':
      return 'destructive';
    case 'secondary':
    case 'outline':
      return 'secondary';
    default:
      return 'default';
  }
};

export function ManualTriggerButton({
  entityType,
  entityId,
  context,
  contextData,
  className,
  variant,
}: ManualTriggerButtonProps) {
  const { data: triggers, isLoading } = useManualTriggers({
    entity_type: entityType,
    context,
    is_active: true,
  });

  const executeTrigger = useExecuteTrigger();

  if (isLoading || !triggers || triggers.length === 0) {
    return null;
  }

  return (
    <>
      {triggers.map((trigger) => (
        <Button
          key={trigger.id}
          variant={variant || buttonStyleToVariant(trigger.button_style)}
          className={className}
          onClick={() => {
            executeTrigger.mutate({
              triggerId: trigger.id,
              data: {
                entity_id: entityId,
                context_data: contextData,
              },
            });
          }}
          disabled={executeTrigger.isPending}
        >
          {executeTrigger.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {trigger.button_label}
        </Button>
      ))}
    </>
  );
}

// Specialized variants for common use cases
export function SongTriggerButton({
  songId,
  context,
  contextData,
  className,
}: Omit<ManualTriggerButtonProps, 'entityType' | 'entityId'> & { songId: number }) {
  return (
    <ManualTriggerButton
      entityType="song"
      entityId={songId}
      context={context}
      contextData={contextData}
      className={className}
    />
  );
}

export function DeliverableTriggerButton({
  deliverableId,
  context,
  contextData,
  className,
}: Omit<ManualTriggerButtonProps, 'entityType' | 'entityId'> & { deliverableId: number }) {
  return (
    <ManualTriggerButton
      entityType="deliverable"
      entityId={deliverableId}
      context={context}
      contextData={contextData}
      className={className}
    />
  );
}
