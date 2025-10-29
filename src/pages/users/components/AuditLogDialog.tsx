import React from 'react';
import { useUserAuditLog } from '@/api/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  History,
  User,
  Globe,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  Trash,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuditLogDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: AuditLogDialogProps) {
  const { data, isLoading, error } = useUserAuditLog(userId, 100);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatFieldValue = (value: any): React.ReactNode => {
    // Handle null/undefined
    if (value === null || value === undefined) return 'None';
    
    // Handle empty string
    if (value === '') return '(empty)';
    
    // Handle boolean
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty list)';
      return value.join(', ');
    }
    
    // Handle objects
    if (typeof value === 'object') {
      // Check if it's a date string that got parsed as object
      try {
        const objStr = JSON.stringify(value);
        // Check for empty object
        if (objStr === '{}') return '(empty)';
        
        // Try to parse as a notification preferences or similar structured object
        const obj = value as Record<string, any>;
        const keys = Object.keys(obj);
        
        // If it looks like a preferences object with boolean values
        if (keys.length > 0 && keys.every(k => typeof obj[k] === 'boolean' || typeof obj[k] === 'string' || typeof obj[k] === 'number')) {
          return (
            <div className="space-y-1">
              {keys.map(key => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className="font-medium">
                    {typeof obj[key] === 'boolean' ? (obj[key] ? '✓' : '✗') : String(obj[key])}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        
        // For other objects, try to format as JSON but more readable
        return (
          <pre className="text-xs bg-muted p-1 rounded overflow-x-auto max-w-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
      } catch {}
      return JSON.stringify(value);
    }
    
    // Handle numbers
    if (typeof value === 'number') return value.toString();
    
    // Handle strings that might be JSON
    if (typeof value === 'string') {
      // Check if it's a JSON string
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          return formatFieldValue(parsed); // Recursively format the parsed JSON
        } catch {
          // Not valid JSON, treat as regular string
        }
      }
      
      // Handle password fields (show masked)
      if (value.includes('pbkdf2_') || value.includes('bcrypt')) {
        return '••••••••';
      }
      
      return value || 'None';
    }
    
    // Default
    return String(value) || 'None';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Audit Log</DialogTitle>
          <DialogDescription>
            Activity history for {userName} (showing last {data?.audit_log.length || 0} of{' '}
            {data?.count || 0} events)
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load audit log. Please try again.</AlertDescription>
          </Alert>
        ) : data?.audit_log.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No audit events found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {data?.audit_log.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </div>
                      {entry.remote_addr && (
                        <div className="flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" />
                          {entry.remote_addr}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actor */}
                  {entry.actor && (
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" />
                      <span className="text-muted-foreground">Performed by:</span>
                      <span className="font-medium">{entry.actor}</span>
                    </div>
                  )}

                  {/* Changes */}
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div className="bg-muted/50 rounded p-3 space-y-2">
                      <p className="text-sm font-medium">Changes:</p>
                      {Object.entries(entry.changes).map(([field, change]) => {
                        // Handle different possible structures of the change object
                        let oldValue, newValue;
                        
                        if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
                          // Expected structure: { old: value, new: value }
                          oldValue = change.old;
                          newValue = change.new;
                        } else if (Array.isArray(change) && change.length === 2) {
                          // Alternative structure: [oldValue, newValue]
                          oldValue = change[0];
                          newValue = change[1];
                        } else {
                          // Fallback: treat the entire change as the new value
                          oldValue = null;
                          newValue = change;
                        }
                        
                        return (
                          <div key={field} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[120px]">
                              {formatFieldName(field)}:
                            </span>
                            <div className="flex items-start gap-2">
                              <div className="bg-background px-2 py-1 rounded border">
                                {formatFieldValue(oldValue)}
                              </div>
                              <ArrowRight className="h-3 w-3 text-muted-foreground mt-1" />
                              <div className="bg-background px-2 py-1 rounded border">
                                {formatFieldValue(newValue)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}