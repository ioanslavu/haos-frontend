import React, { useState } from 'react';
import { useUserAuditLog } from '@/api/hooks/useUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogTabProps {
  userId: string;
}

interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  actor?: string;
  remote_addr?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export function ActivityLogTab({ userId }: ActivityLogTabProps) {
  const [limit, setLimit] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  
  const { data, isLoading, error, refetch } = useUserAuditLog(userId, limit);
  
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  const formatFieldValue = (value: unknown): React.ReactNode => {
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
  
  // Filter audit entries
  const filteredEntries = React.useMemo(() => {
    if (!data?.audit_log) return [];
    
    let filtered = data.audit_log;
    
    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter((entry) => entry.action === filterAction);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((entry) => {
        const searchableText = [
          entry.action,
          entry.actor,
          entry.remote_addr,
          JSON.stringify(entry.changes),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(term);
      });
    }
    
    return filtered;
  }, [data?.audit_log, filterAction, searchTerm]);
  
  const handleExport = () => {
    if (!filteredEntries.length) return;
    
    const csv = [
      ['Timestamp', 'Action', 'Actor', 'IP Address', 'Changes'].join(','),
      ...filteredEntries.map((entry) => [
        entry.timestamp,
        entry.action,
        entry.actor || '',
        entry.remote_addr || '',
        JSON.stringify(entry.changes || {}),
      ].join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${userId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="action">Action Type</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="limit">Results Limit</Label>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">Last 50</SelectItem>
                  <SelectItem value="100">Last 100</SelectItem>
                  <SelectItem value="250">Last 250</SelectItem>
                  <SelectItem value="500">Last 500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleExport}
                disabled={!filteredEntries.length}
                className="w-full gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {data && (
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span>
                Showing {filteredEntries.length} of {data.count} total events
              </span>
              {filteredEntries.length < data.count && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setLimit(Math.min(limit + 100, 1000))}
                  className="p-0 h-auto"
                >
                  Load more
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {searchTerm || filterAction !== 'all'
                  ? 'No matching events found'
                  : 'No audit events found'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {filteredEntries.map((entry) => (
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
        </CardContent>
      </Card>
    </div>
  );
}