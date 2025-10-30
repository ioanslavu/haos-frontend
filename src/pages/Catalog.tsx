import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Mic, Disc, Users, DollarSign, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWorks, useRecordings, useReleases } from '@/api/hooks/useCatalog';
import { Badge } from '@/components/ui/badge';

export default function Catalog() {
  const navigate = useNavigate();

  // Get statistics
  const { data: worksData } = useWorks({ page_size: 1 });
  const { data: recordingsData } = useRecordings({ page_size: 1 });
  const { data: releasesData } = useReleases({ page_size: 1 });

  const catalogSections = [
    {
      title: 'Musical Works',
      description: 'Manage compositions, songs, and musical works with their credits and publishing splits',
      icon: Music,
      href: '/catalog/works',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: worksData?.count || 0,
      label: 'works',
      tourId: 'works-nav',
    },
    {
      title: 'Recordings',
      description: 'Manage master recordings, demos, and versions with assets and master splits',
      icon: Mic,
      href: '/catalog/recordings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: recordingsData?.count || 0,
      label: 'recordings',
      tourId: 'recordings-nav',
    },
    {
      title: 'Releases',
      description: 'Manage albums, singles, EPs, and compilations with track listings and distribution',
      icon: Disc,
      href: '/catalog/releases',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: releasesData?.count || 0,
      label: 'releases',
    }
  ];

  const quickActions = [
    {
      title: 'Rights & Splits',
      description: 'Manage royalty distributions',
      icon: DollarSign,
      action: () => navigate('/catalog/works')
    },
    {
      title: 'Credits',
      description: 'Track contributors and roles',
      icon: Users,
      action: () => navigate('/catalog/works')
    },
    {
      title: 'Identifiers',
      description: 'ISWC, ISRC, and UPC codes',
      icon: FileText,
      action: () => navigate('/catalog/works')
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Music Catalog</h1>
          <p className="text-muted-foreground mt-2">
            Centralized management for your music catalog, rights, and metadata
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(worksData?.count || 0) + (recordingsData?.count || 0) + (releasesData?.count || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all catalog sections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Works</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{worksData?.count || 0}</div>
              <p className="text-xs text-muted-foreground">
                Musical compositions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recordings</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recordingsData?.count || 0}</div>
              <p className="text-xs text-muted-foreground">
                Master recordings & demos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Releases</CardTitle>
              <Disc className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{releasesData?.count || 0}</div>
              <p className="text-xs text-muted-foreground">
                Albums & singles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Sections */}
        <div className="grid gap-4 md:grid-cols-3">
          {catalogSections.map((section) => (
            <Card
              key={section.href}
              data-tour={section.tourId}
              className="hover-lift transition-smooth cursor-pointer"
              onClick={() => navigate(section.href)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${section.bgColor}`}>
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                  <Badge variant="secondary">
                    {section.stats} {section.label}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  View {section.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover-lift transition-smooth cursor-pointer"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates in your music catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>New work added: "Summer Vibes"</span>
                </div>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Recording completed: "Night Drive (Master)"</span>
                </div>
                <span className="text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Release scheduled: "Winter Collection EP"</span>
                </div>
                <span className="text-muted-foreground">Yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}