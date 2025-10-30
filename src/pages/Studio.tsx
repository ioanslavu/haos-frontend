import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock, Users, Mic, Headphones, Music, Video, Settings, Eye, Edit2, Trash2, Play, Pause, Square, Record, DollarSign, CheckCircle2, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock data for studio sessions
const studioSessions = [
  {
    id: 1,
    title: "Drake - New Album Session",
    artist: "Drake",
    producer: "40",
    engineer: "Noah Shebib",
    startTime: "2024-01-15T10:00:00",
    endTime: "2024-01-15T18:00:00",
    status: "In Progress",
    studio: "Studio A",
    equipment: ["Neumann U87", "Pro Tools HD", "SSL Console"],
    tracks: 8,
    completedTracks: 3,
    notes: "Working on track 4 - vocals need re-recording"
  },
  {
    id: 2,
    title: "Taylor Swift - Vocal Session",
    artist: "Taylor Swift",
    producer: "Jack Antonoff",
    engineer: "Laura Sisk",
    startTime: "2024-01-16T14:00:00",
    endTime: "2024-01-16T22:00:00",
    status: "Scheduled",
    studio: "Studio B",
    equipment: ["Neumann U67", "Logic Pro", "Neve Console"],
    tracks: 5,
    completedTracks: 0,
    notes: "Acoustic session - bring guitar and piano"
  },
  {
    id: 3,
    title: "The Weeknd - Mixing Session",
    artist: "The Weeknd",
    producer: "Max Martin",
    engineer: "Serban Ghenea",
    startTime: "2024-01-14T09:00:00",
    endTime: "2024-01-14T17:00:00",
    status: "Completed",
    studio: "Studio C",
    equipment: ["Pro Tools HD", "SSL Console", "Outboard Gear"],
    tracks: 12,
    completedTracks: 12,
    notes: "All tracks mixed and approved"
  }
];

// Mock data for equipment
const equipment = [
  {
    id: 1,
    name: "Neumann U87",
    type: "Microphone",
    status: "Available",
    location: "Studio A",
    lastMaintenance: "2024-01-10",
    nextMaintenance: "2024-04-10",
    condition: "Excellent"
  },
  {
    id: 2,
    name: "Pro Tools HD",
    type: "DAW",
    status: "In Use",
    location: "Studio A",
    lastMaintenance: "2024-01-05",
    nextMaintenance: "2024-04-05",
    condition: "Good"
  },
  {
    id: 3,
    name: "SSL Console",
    type: "Console",
    status: "Maintenance",
    location: "Studio A",
    lastMaintenance: "2024-01-12",
    nextMaintenance: "2024-04-12",
    condition: "Maintenance Required"
  }
];

// Mock data for studio rooms
const studioRooms = [
  {
    id: 1,
    name: "Studio A",
    type: "Recording",
    capacity: 8,
    status: "Occupied",
    currentSession: "Drake - New Album Session",
    equipment: ["Neumann U87", "Pro Tools HD", "SSL Console"],
    hourlyRate: 150
  },
  {
    id: 2,
    name: "Studio B",
    type: "Recording",
    capacity: 6,
    status: "Available",
    currentSession: null,
    equipment: ["Neumann U67", "Logic Pro", "Neve Console"],
    hourlyRate: 120
  },
  {
    id: 3,
    name: "Studio C",
    type: "Mixing",
    capacity: 4,
    status: "Available",
    currentSession: null,
    equipment: ["Pro Tools HD", "SSL Console", "Outboard Gear"],
    hourlyRate: 100
  }
];

const getStatusConfig = (status: string): { variant: any; icon: any } => {
  switch (status) {
    case 'In Progress':
      return { variant: 'info', icon: Loader2 };
    case 'Scheduled':
      return { variant: 'warning', icon: Calendar };
    case 'Completed':
      return { variant: 'success', icon: CheckCircle2 };
    case 'Cancelled':
      return { variant: 'destructive', icon: XCircle };
    default:
      return { variant: 'secondary', icon: Clock };
  }
};

const getEquipmentStatusConfig = (status: string): { variant: any; icon: any } => {
  switch (status) {
    case 'Available':
      return { variant: 'success', icon: CheckCircle2 };
    case 'In Use':
      return { variant: 'info', icon: Loader2 };
    case 'Maintenance':
      return { variant: 'destructive', icon: AlertTriangle };
    default:
      return { variant: 'secondary', icon: XCircle };
  }
};

const getRoomStatusConfig = (status: string): { variant: any; icon: any } => {
  switch (status) {
    case 'Available':
      return { variant: 'success', icon: CheckCircle2 };
    case 'Occupied':
      return { variant: 'info', icon: Users };
    default:
      return { variant: 'secondary', icon: XCircle };
  }
};

export default function Studio() {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  const filteredSessions = studioSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Studio Management</h1>
            <p className="text-muted-foreground">Manage studio sessions, equipment, and room bookings</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Studio Session</DialogTitle>
                  <DialogDescription>
                    Schedule a new recording, mixing, or mastering session
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="session-title">Session Title</Label>
                      <Input id="session-title" placeholder="Enter session title" />
                    </div>
                    <div>
                      <Label htmlFor="artist">Artist</Label>
                      <Input id="artist" placeholder="Enter artist name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="producer">Producer</Label>
                      <Input id="producer" placeholder="Enter producer name" />
                    </div>
                    <div>
                      <Label htmlFor="engineer">Engineer</Label>
                      <Input id="engineer" placeholder="Enter engineer name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time">Start Time</Label>
                      <Input id="start-time" type="datetime-local" />
                    </div>
                    <div>
                      <Label htmlFor="end-time">End Time</Label>
                      <Input id="end-time" type="datetime-local" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="studio">Studio</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select studio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio-a">Studio A</SelectItem>
                        <SelectItem value="studio-b">Studio B</SelectItem>
                        <SelectItem value="studio-c">Studio C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Enter session notes" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowNewSessionDialog(false)}>
                    Create Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Studios</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">1 in maintenance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Status</CardTitle>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,400</div>
              <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Session Management</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search sessions..." 
                        className="pl-10 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[200px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sessions Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Studio Sessions</h3>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Studio</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => {
                      const statusConfig = getStatusConfig(session.status);
                      return (
                        <TableRow key={session.id} className="hover-lift transition-smooth">
                          <TableCell>
                            <div>
                              <div className="font-medium">{session.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {session.producer} • {session.engineer}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{session.artist}</TableCell>
                          <TableCell>{session.studio}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(session.startTime).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(session.completedTracks / session.tracks) * 100} className="w-20" />
                              <span className="text-sm text-muted-foreground">
                                {session.completedTracks}/{session.tracks}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {session.status === 'In Progress' && (
                                <Button variant="ghost" size="sm">
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Equipment Management</h3>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      <TableHead>Next Maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => {
                      const statusConfig = getEquipmentStatusConfig(item.status);
                      return (
                        <TableRow key={item.id} className="hover-lift transition-smooth">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(item.lastMaintenance).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(item.nextMaintenance).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studioRooms.map((room) => {
                const statusConfig = getRoomStatusConfig(room.status);
                return (
                  <Card key={room.id} className="hover-lift transition-smooth">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{room.name}</CardTitle>
                        <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                          {room.status}
                        </Badge>
                      </div>
                      <CardDescription>{room.type} Studio • ${room.hourlyRate}/hour</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Capacity:</span>
                          <span>{room.capacity} people</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Current Session:</span>
                          <span className="text-muted-foreground">
                            {room.currentSession || 'None'}
                          </span>
                        </div>
                        <div className="pt-2">
                          <h4 className="text-sm font-medium mb-1">Equipment:</h4>
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.map((item, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 