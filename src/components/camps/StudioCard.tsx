import * as React from 'react';
import { MapPin, Clock, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CampStudio } from '@/types/camps';

interface StudioCardProps {
  studio: CampStudio;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudioCard({ studio, onEdit, onDelete }: StudioCardProps) {
  const hasLocation = studio.location || studio.city || studio.country;
  const hasSchedule = studio.hours || studio.sessions;

  return (
    <Card className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{studio.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Studio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{studio.name}"? This action cannot
                    be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Info */}
        {hasLocation && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              {studio.location && <div>{studio.location}</div>}
              {(studio.city || studio.country) && (
                <div>
                  {[studio.city, studio.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Info */}
        {hasSchedule && (
          <div className="flex flex-wrap gap-3 text-sm">
            {studio.hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{studio.hours} hours</span>
              </div>
            )}
            {studio.sessions && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{studio.sessions} sessions</span>
              </div>
            )}
          </div>
        )}

        {/* Artists */}
        {(studio.internal_artists.length > 0 || studio.external_artists.length > 0) && (
          <div>
            <div className="text-sm font-medium mb-2">Artists</div>
            <div className="flex flex-wrap gap-2">
              {[...studio.internal_artists, ...studio.external_artists].map((artist) => (
                <Badge key={artist.id} variant="secondary" className="pl-2 pr-3 py-1">
                  <Avatar className="h-4 w-4 mr-1.5">
                    <AvatarImage src={artist.profile_picture || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(artist.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{artist.display_name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasLocation && !hasSchedule && studio.internal_artists.length === 0 && studio.external_artists.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No additional details provided
          </p>
        )}
      </CardContent>
    </Card>
  );
}
