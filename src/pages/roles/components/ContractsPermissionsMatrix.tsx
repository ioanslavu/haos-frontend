import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useContractsVerbs, useRoleDeptPolicies, useUpsertContractPolicies, type ContractPolicyRow } from '@/api/hooks/useContractsRBAC';

interface Props {
  roleCode: string;
}

const DEPARTMENTS = [
  { value: 'digital', label: 'Digital' },
  { value: 'sales', label: 'Sales' },
];

export const ContractsPermissionsMatrixForRole: React.FC<Props> = ({ roleCode }) => {
  const { data: verbsData } = useContractsVerbs();
  const [department, setDepartment] = React.useState<string>('digital');
  const { data: policyRows } = useRoleDeptPolicies(roleCode, department);
  const upsert = useUpsertContractPolicies();

  const [local, setLocal] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    if (policyRows && verbsData) {
      const map: Record<string, any> = {};
      verbsData.types.forEach((t) => {
        const row = policyRows.find((r) => r.contract_type === t);
        map[t] = {
          can_view: row ? row.can_view : true,
          can_publish: row ? row.can_publish : false,
          can_send: row ? row.can_send : false,
          can_update: row ? row.can_update : false,
          can_delete: row ? row.can_delete : false,
          can_regenerate: row ? row.can_regenerate : false,
        };
      });
      setLocal(map);
    }
  }, [policyRows, verbsData]);

  const toggle = (ctype: string, field: string) => {
    setLocal((prev) => ({
      ...prev,
      [ctype]: { ...prev[ctype], [field]: !prev[ctype]?.[field] },
    }));
  };

  if (!verbsData) return null;
  const types = verbsData.types;
  const columns = [
    { key: 'can_view', label: 'View' },
    { key: 'can_publish', label: 'Make Public' },
    { key: 'can_send', label: 'Send for Signature' },
    { key: 'can_update', label: 'Update' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_regenerate', label: 'Regenerate' },
  ];

  const handleSave = async () => {
    const items: ContractPolicyRow[] = types.map((t) => ({
      role: roleCode,
      department,
      contract_type: t,
      can_view: !!local[t]?.can_view,
      can_publish: !!local[t]?.can_publish,
      can_send: !!local[t]?.can_send,
      can_update: !!local[t]?.can_update,
      can_delete: !!local[t]?.can_delete,
      can_regenerate: !!local[t]?.can_regenerate,
    }));
    await upsert.mutateAsync(items);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contracts Permissions</CardTitle>
          <CardDescription>Manage per-type actions for role "{roleCode}"</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem value={d.value} key={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
        </div>
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

