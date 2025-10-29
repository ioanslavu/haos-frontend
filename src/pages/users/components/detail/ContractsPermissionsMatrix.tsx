import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useContractsVerbs, useUserContractsMatrix, useUpsertContractPolicies, type ContractPolicyRow } from '@/api/hooks/useContractsRBAC';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  userId: string;
}

export const ContractsPermissionsMatrix: React.FC<Props> = ({ userId }) => {
  const { data: verbsData } = useContractsVerbs();
  const { data: matrix, isLoading } = useUserContractsMatrix(userId);
  const upsert = useUpsertContractPolicies();

  const [local, setLocal] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    if (matrix && verbsData) {
      const initial: Record<string, any> = {};
      matrix.policies.forEach((p) => {
        initial[p.contract_type] = {
          can_view: p.can_view,
          can_publish: p.can_publish,
          can_send: p.can_send,
          can_update: p.can_update,
          can_delete: p.can_delete,
          can_regenerate: p.can_regenerate,
        };
      });
      setLocal(initial);
    }
  }, [matrix, verbsData]);

  // Allow editing; server will enforce authorization as needed
  const canEdit = true;

  const toggle = (ctype: string, field: string) => {
    setLocal((prev) => ({
      ...prev,
      [ctype]: {
        ...prev[ctype],
        [field]: !prev[ctype]?.[field],
      },
    }));
  };

  const handleSave = async () => {
    if (!matrix?.role || !matrix?.department) return;
    const items: ContractPolicyRow[] = Object.entries(local).map(([ctype, flags]: any) => ({
      role: matrix.role!,
      department: matrix.department!,
      contract_type: ctype,
      can_view: !!flags.can_view,
      can_publish: !!flags.can_publish,
      can_send: !!flags.can_send,
      can_update: !!flags.can_update,
      can_delete: !!flags.can_delete,
      can_regenerate: !!flags.can_regenerate,
    }));
    await upsert.mutateAsync(items);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contracts Permissions</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (!matrix || !verbsData) return null;
  if (!matrix.role || !matrix.department) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contracts Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          Assign this user a role and department to configure per-type contract permissions.
        </CardContent>
      </Card>
    );
  }

  const types = verbsData.types;
  const columns = [
    { key: 'can_view', label: 'View' },
    { key: 'can_publish', label: 'Make Public' },
    { key: 'can_send', label: 'Send for Signature' },
    { key: 'can_update', label: 'Update' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_regenerate', label: 'Regenerate' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contracts Permissions</CardTitle>
          <p className="text-sm text-muted-foreground">Role: {matrix.role || '—'} | Department: {matrix.department || '—'}</p>
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending}>Save Changes</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Type</TableHead>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t}>
                <TableCell className="capitalize">{t.replace('_', ' ')}</TableCell>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <Switch
                      checked={!!local[t]?.[c.key]}
                      onCheckedChange={() => toggle(t, c.key)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
