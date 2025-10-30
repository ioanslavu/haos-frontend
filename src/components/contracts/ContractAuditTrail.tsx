import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  FileText,
  CheckCircle,
  Webhook,
  Settings,
  Edit,
  XCircle,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useContractAuditTrail } from '@/api/hooks/useContracts';
import type { AuditEvent } from '@/api/services/contracts.service';

interface ContractAuditTrailProps {
  contractId: number;
}

const eventCategoryIcons = {
  contract: FileText,
  signature: CheckCircle,
  webhook: Webhook,
  system: Settings,
};

const eventCategoryColors = {
  contract: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  signature: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  webhook: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  system: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
};

const eventTypeIcons: Record<string, any> = {
  status_change: Edit,
  signature_completed: CheckCircle,
  signature_viewed: Eye,
  signature_sent: Send,
  signature_declined: XCircle,
  webhook_received: Webhook,
  contract_created: FileText,
  contract_updated: Edit,
};

function getInitials(name: string | null): string {
  if (!name || name === 'System') return 'SY';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AuditEventItem({ event, isLast }: { event: AuditEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = eventCategoryIcons[event.event_category];
  const TypeIcon = eventTypeIcons[event.event_type] || Icon;
  const colorClasses = eventCategoryColors[event.event_category];
  const timestamp = new Date(event.timestamp);

  const hasDetails = (event.changes && Object.keys(event.changes).length > 0) ||
                     (event.metadata && Object.keys(event.metadata).length > 0);

  return (
    <div className="flex gap-3 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
      )}

      {/* Icon */}
      <div className={`p-2 rounded-full ${colorClasses} h-10 w-10 flex items-center justify-center flex-shrink-0 z-10`}>
        <TypeIcon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {event.event_category}
              </Badge>
              {event.actor && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{event.actor}</span>
                </div>
              )}
            </div>

            <p className="text-sm font-medium">{event.description}</p>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <p className="text-xs text-muted-foreground">
                {format(timestamp, 'MMM d, yyyy HH:mm:ss')}
              </p>
              <Badge variant="secondary" className="text-xs">
                {event.source}
              </Badge>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        {hasDetails && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 px-2 text-xs"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show details
                </>
              )}
            </Button>

            {expanded && (
              <div className="space-y-3 pl-4 border-l-2 border-border">
                {event.changes && Object.keys(event.changes).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Changes:</p>
                    <div className="bg-muted/50 rounded-md p-2 space-y-1">
                      {Object.entries(event.changes).map(([key, value]) => (
                        <div key={key} className="text-xs font-mono">
                          <span className="text-muted-foreground">{key}:</span>{' '}
                          {typeof value === 'object' ? (
                            <pre className="text-xs mt-1 whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-foreground">{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Metadata:</p>
                    <div className="bg-muted/50 rounded-md p-2 space-y-1">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="text-xs font-mono">
                          <span className="text-muted-foreground">{key}:</span>{' '}
                          {typeof value === 'object' ? (
                            <pre className="text-xs mt-1 whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-foreground">{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ContractAuditTrail({ contractId }: ContractAuditTrailProps) {
  const { data: auditTrail, isLoading, error } = useContractAuditTrail(contractId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load audit trail. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!auditTrail || auditTrail.events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Audit Trail
        </CardTitle>
        <CardDescription className="flex items-center gap-4 text-xs mt-2">
          <span>Contract: {auditTrail.contract_number}</span>
          <span>•</span>
          <span>Status: {auditTrail.current_status}</span>
          <span>•</span>
          <span>{auditTrail.summary.total_events} events</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
          <Badge variant="outline" className="text-xs">
            {auditTrail.summary.contract_changes} contract changes
          </Badge>
          <Badge variant="outline" className="text-xs">
            {auditTrail.summary.signature_events} signature events
          </Badge>
          <Badge variant="outline" className="text-xs">
            {auditTrail.summary.webhook_events} webhook events
          </Badge>
          <Badge variant="outline" className="text-xs">
            {auditTrail.summary.unique_actors} unique actors
          </Badge>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-0">
            {auditTrail.events.map((event, index) => (
              <AuditEventItem
                key={`${event.timestamp}-${event.event_type}-${index}`}
                event={event}
                isLast={index === auditTrail.events.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
