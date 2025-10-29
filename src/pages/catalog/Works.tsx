import React, { useState } from 'react';
import { Plus, Music, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '@/api/hooks/useCatalog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AppLayout } from '@/components/layout/AppLayout';

export default function Works() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: worksData, isLoading } = useWorks({
    search: searchQuery || undefined,
    genre: genreFilter === 'all' || !genreFilter ? undefined : genreFilter,
    language: languageFilter === 'all' || !languageFilter ? undefined : languageFilter,
    page,
    page_size: 20,
  });

  const works = worksData?.results || [];
  const totalPages = worksData ? Math.ceil(worksData.count / 20) : 1;

  const handleViewWork = (id: number) => {
    navigate(`/catalog/works/${id}`);
  };

  const handleCreateWork = () => {
    navigate('/catalog/works/create');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Musical Works</h1>
          <p className="text-muted-foreground">
            Manage compositions, songs, and musical works
          </p>
        </div>
        <Button onClick={handleCreateWork}>
          <Plus className="mr-2 h-4 w-4" />
          New Work
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{worksData?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With ISWC</CardTitle>
            <Badge variant="outline">Standard</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {works.filter(w => w.iswc).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete Splits</CardTitle>
            <Badge variant="outline">100%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {works.filter(w => w.has_complete_publishing_splits).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recordings</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {works.reduce((acc, w) => acc + (w.recordings_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search works..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ro">Romanian</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            <SelectItem value="pop">Pop</SelectItem>
            <SelectItem value="rock">Rock</SelectItem>
            <SelectItem value="hip-hop">Hip Hop</SelectItem>
            <SelectItem value="electronic">Electronic</SelectItem>
            <SelectItem value="classical">Classical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>ISWC</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Recordings</TableHead>
              <TableHead>Splits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : works.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No works found
                </TableCell>
              </TableRow>
            ) : (
              works.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{work.title}</div>
                      {work.alternate_titles && (
                        <div className="text-xs text-muted-foreground">
                          {Array.isArray(work.alternate_titles)
                            ? work.alternate_titles.join(', ')
                            : String(work.alternate_titles)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {work.iswc ? (
                      <Badge variant="outline">{work.iswc}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {work.language ? (
                      <Badge variant="secondary">{work.language.toUpperCase()}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{work.genre || '—'}</TableCell>
                  <TableCell>{work.year_composed || '—'}</TableCell>
                  <TableCell>
                    {work.recordings_count ? (
                      <Badge>{work.recordings_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {work.has_complete_publishing_splits ? (
                      <Badge variant="default" className="bg-green-500">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Incomplete</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewWork(work.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/catalog/works/${work.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, worksData?.count || 0)} of {worksData?.count || 0} works
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
