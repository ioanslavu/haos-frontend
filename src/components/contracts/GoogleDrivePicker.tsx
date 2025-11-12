import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Folder, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import contractsService from '@/api/services/contracts.service';
import { useDebounce } from '@/hooks/use-debounce';

interface GoogleDrivePickerProps {
  type: 'document' | 'folder';
  onSelect: (item: any) => void;
  selectedId?: string;
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  type,
  onSelect,
  selectedId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const searchDrive = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let items;
        if (type === 'document') {
          items = await contractsService.searchDriveDocuments(debouncedQuery);
        } else {
          items = await contractsService.searchDriveFolders(debouncedQuery);
        }
        setResults(items);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to search Google Drive');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchDrive();
  }, [debouncedQuery, type]);

  const handleSelect = (item: any) => {
    onSelect(item);
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${type === 'document' ? 'documents' : 'folders'}...`}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="border rounded-lg max-h-[300px] overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery
              ? `No ${type === 'document' ? 'documents' : 'folders'} found`
              : `Start typing to search for ${type === 'document' ? 'documents' : 'folders'}`}
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="divide-y">
            {results.map((item) => (
              <div
                key={item.id}
                className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                  selectedId === item.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                }`}
                onClick={() => handleSelect(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1">
                      {type === 'document' ? (
                        <FileText className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Folder className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Modified: {new Date(item.modifiedTime).toLocaleDateString()}
                      </div>
                      {item.owners && item.owners.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Owner: {item.owners[0].displayName || item.owners[0].emailAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedId === item.id && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.webViewLink, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedId === item.id && (
                  <div className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded">
                    ID: {item.id}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Info */}
      {selectedId && (
        <div className="text-xs text-muted-foreground">
          Selected ID: <span className="font-mono">{selectedId}</span>
        </div>
      )}
    </div>
  );
};
