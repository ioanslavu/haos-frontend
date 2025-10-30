import React, { useState } from 'react';
import { Plus, Music, Search, Filter, Edit, Trash2, Eye, CheckCircle2, XCircle, Users, Calendar, Download } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '@/api/hooks/useCatalog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NoCatalogItemsEmptyState, NoSearchResultsEmptyState } from '@/components/ui/empty-states-presets';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ContextMenuActions, quickActions } from '@/components/ui/context-menu-actions';
import { ExportDialog } from '@/components/ui/export-dialog';

import { AppLayout } from '@/components/layout/AppLayout';

export default function Works() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useViewMode('works', 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Musical Works</h1>
          <p className="text-muted-foreground text-base">
            Manage compositions, songs, and musical works
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            disabled={works.length === 0}
            aria-label="Export works data"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateWork} aria-label="Create new musical work">
            <Plus className="mr-2 h-4 w-4" />
            New Work
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{worksData?.count || 0}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
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
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
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
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
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
              aria-label="Search musical works"
            />
          </div>
        </div>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by language">
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
          <SelectTrigger className="w-[150px]" aria-label="Filter by genre">
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
        <ViewModeToggle
          value={viewMode}
          onValueChange={setViewMode}
          availableModes={['table', 'grid']}
        />
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : works.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    {searchQuery || genreFilter || languageFilter ? (
                      <NoSearchResultsEmptyState
                        searchQuery={searchQuery}
                        onClearSearch={() => {
                          setSearchQuery('');
                          setGenreFilter('');
                          setLanguageFilter('');
                        }}
                      />
                    ) : (
                      <NoCatalogItemsEmptyState
                        itemType="works"
                        onPrimaryAction={handleCreateWork}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                works.map((work) => (
                  <ContextMenuActions
                    key={work.id}
                    actions={[
                      quickActions.view(() => handleViewWork(work.id)),
                      quickActions.edit(() => navigate(`/catalog/works/${work.id}/edit`)),
                      quickActions.duplicate(() => console.log('Duplicate', work.id)),
                    ]}
                  >
                    <TableRow className="cursor-context-menu">
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
                        <Badge variant="subtle-success" icon={CheckCircle2} size="sm">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="subtle-destructive" icon={XCircle} size="sm">
                          Incomplete
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewWork(work.id)}
                          aria-label={`View ${work.title}`}
                          className="touch-target"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/catalog/works/${work.id}/edit`)}
                          aria-label={`Edit ${work.title}`}
                          className="touch-target"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </ContextMenuActions>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : works.length === 0 ? (
            searchQuery || genreFilter || languageFilter ? (
              <NoSearchResultsEmptyState
                searchQuery={searchQuery}
                onClearSearch={() => {
                  setSearchQuery('');
                  setGenreFilter('');
                  setLanguageFilter('');
                }}
              />
            ) : (
              <NoCatalogItemsEmptyState
                itemType="works"
                onPrimaryAction={handleCreateWork}
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {works.map((work) => (
                <Card
                  key={work.id}
                  className="hover-lift transition-smooth cursor-pointer backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl"
                  onClick={() => handleViewWork(work.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{work.title}</CardTitle>
                    {work.alternate_titles && (
                      <CardDescription className="text-xs">
                        {Array.isArray(work.alternate_titles)
                          ? work.alternate_titles.join(', ')
                          : String(work.alternate_titles)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {work.iswc && (
                        <Badge variant="outline">{work.iswc}</Badge>
                      )}
                      {work.language && (
                        <Badge variant="secondary">{work.language.toUpperCase()}</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {work.genre && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Genre:</span>
                          <span className="font-medium">{work.genre}</span>
                        </div>
                      )}
                      {work.year_composed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year:</span>
                          <span className="font-medium">{work.year_composed}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recordings:</span>
                        <Badge>{work.recordings_count || 0}</Badge>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      {work.has_complete_publishing_splits ? (
                        <Badge variant="subtle-success" icon={CheckCircle2} size="sm" className="w-full justify-center">
                          Complete Splits
                        </Badge>
                      ) : (
                        <Badge variant="subtle-destructive" icon={XCircle} size="sm" className="w-full justify-center">
                          Incomplete Splits
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewWork(work.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/catalog/works/${work.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="Export Musical Works"
        data={works}
        filename="musical-works"
        availableFormats={['csv', 'json']}
      />
    </div>
    </AppLayout>
  );
}
