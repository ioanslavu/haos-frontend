import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRolesList, useDeleteRole } from '@/api/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateRoleDialog } from './components/CreateRoleDialog';
import {
  Shield,
  Users,
  Key,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function Roles() {
  const navigate = useNavigate();
  const { data: roles, isLoading, error } = useRolesList();
  const deleteRole = useDeleteRole();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);

  const filteredRoles = Array.isArray(roles) 
    ? roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleDeleteClick = (role: { id: number; name: string }) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      await deleteRole.mutateAsync(roleToDelete.id);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const getRoleConfig = (roleName: string): { variant: any; icon: any } => {
    if (roleName.includes('ADMIN')) return { variant: 'destructive', icon: Shield };
    if (roleName.includes('MANAGER') || roleName.includes('EXECUTIVE')) return { variant: 'default', icon: Users };
    if (roleName.includes('ANALYST') || roleName.includes('ACCOUNTANT')) return { variant: 'secondary', icon: Key };
    if (roleName === 'ARTIST' || roleName === 'PUBLISHER') return { variant: 'outline', icon: Key };
    return { variant: 'default', icon: Key };
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-fuchsia-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Roles & Permissions
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Manage user roles and their associated permissions
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Roles Table */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>All Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Failed to load roles</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No roles found matching your search' : 'No roles created yet'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Role
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => {
                    const config = getRoleConfig(role.name);
                    return (
                      <TableRow key={role.id} className="cursor-pointer hover-lift transition-smooth">
                        <TableCell
                          className="font-medium"
                          onClick={() => navigate(`/roles/${role.id}`)}
                        >
                          <Badge variant={config.variant} icon={config.icon} size="sm">
                            {role.name.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      <TableCell onClick={() => navigate(`/roles/${role.id}`)}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{role.user_count}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/roles/${role.id}`)}>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span>{role.permission_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}?tab=permissions`)}>
                              <Key className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem onClick={() => navigate(`/roles/${role.id}?tab=users`)}>
                              <Users className="mr-2 h-4 w-4" />
                              View Users
                            </DropdownMenuItem> */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(role)}
                              className="text-destructive"
                              disabled={role.user_count > 0}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Role Dialog */}
        <CreateRoleDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={(newRole) => {
            setCreateDialogOpen(false);
            navigate(`/roles/${newRole.id}`);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{roleToDelete?.name.replace(/_/g, ' ')}"? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}