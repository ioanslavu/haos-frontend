import { useQuery } from '@tanstack/react-query';
import { FileText, Calendar, Users, Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { fetchSongContracts } from '@/api/songApi';
import { formatDistanceToNow } from 'date-fns';

interface ContractsTabProps {
  songId: number;
  workId?: number | null;
  releaseId?: number | null;
}

export function ContractsTab({ songId, workId, releaseId }: ContractsTabProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['song-contracts', songId],
    queryFn: () => fetchSongContracts(songId),
  });

  const contracts = Array.isArray(contractsData?.data) ? contractsData.data : [];

  // Determine user permissions
  const userDepartment = user?.profile?.department?.code || user?.department?.toLowerCase() || '';
  const userRole = user?.profile?.role?.level || 0;
  const canLinkContracts = ['Label', 'label'].includes(userDepartment) || userRole >= 1000;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No contracts linked to this song yet.</p>
          {canLinkContracts && (
            <Button onClick={() => navigate(`/contracts/link?song=${songId}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Link Contract
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'default';
      case 'pending_signature':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'pending_signature':
        return 'Pending Signature';
      case 'draft':
        return 'Draft';
      case 'cancelled':
        return 'Cancelled';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      default:
        return status;
    }
  };

  const getContractTypeLabel = (type: string | null) => {
    if (!type) return 'General';
    const types: Record<string, string> = {
      artist_master: 'Artist Master Agreement',
      producer_service: 'Producer Service Agreement',
      publishing_writer: 'Publishing Writer Agreement',
      publishing_admin: 'Publishing Administration',
      co_pub: 'Co-Publishing Agreement',
      license_sync: 'Synchronization License',
      co_label: 'Co-Label Agreement',
      video_production: 'Video Production Agreement',
      digital_dist: 'Digital Distribution Agreement',
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contracts
              </CardTitle>
              <CardDescription>
                {contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'} linked to this song
              </CardDescription>
            </div>
            {canLinkContracts && (
              <Button variant="outline" onClick={() => navigate(`/contracts/link?song=${songId}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Link Contract
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Contracts List */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract: any) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono font-medium">
                    {contract.contract_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.title}</p>
                      {contract.department && (
                        <p className="text-xs text-muted-foreground">
                          {contract.department.name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getContractTypeLabel(contract.contract_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <div>
                        {contract.counterparty_entity ? (
                          <p className="text-sm">{contract.counterparty_entity.display_name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No counterparty</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(contract.status)}>
                      {getStatusLabel(contract.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <div>
                        {contract.term_start ? (
                          <>
                            <p className="text-xs">
                              {new Date(contract.term_start).toLocaleDateString()}
                            </p>
                            {contract.term_end && (
                              <p className="text-xs">
                                to {new Date(contract.term_end).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs">
                            {formatDistanceToNow(new Date(contract.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {contract.gdrive_file_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={contract.gdrive_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contract Scope Information */}
      {contracts.some((c: any) => c.scopes && c.scopes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Coverage</CardTitle>
            <CardDescription>
              What is covered by each contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contracts
              .filter((c: any) => c.scopes && c.scopes.length > 0)
              .map((contract: any) => (
                <div key={contract.id} className="border-l-2 border-primary pl-4">
                  <p className="font-medium mb-2">{contract.contract_number}</p>
                  <div className="space-y-2">
                    {contract.scopes.map((scope: any, idx: number) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        {scope.all_in_term ? (
                          <Badge variant="secondary">All works/recordings during term</Badge>
                        ) : (
                          <>
                            {scope.work && <Badge variant="outline">Work: {scope.work.title}</Badge>}
                            {scope.recording && (
                              <Badge variant="outline">Recording: {scope.recording.title}</Badge>
                            )}
                            {scope.release && (
                              <Badge variant="outline">Release: {scope.release.title}</Badge>
                            )}
                          </>
                        )}
                        {scope.include_derivatives && (
                          <span className="text-xs ml-2">(includes derivatives)</span>
                        )}
                        {scope.notes && (
                          <p className="text-xs mt-1 italic">{scope.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
