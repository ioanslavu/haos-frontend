import React, { useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock, Users, CheckSquare, AlertTriangle, CheckCircle2, Clock as ClockIcon, User, Tag, Flag, Eye, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

// Mock data for tasks
const tasks = [
  {
    id: 1,
    title: "Review Drake's new album mix",
    description: "Listen to the final mix of Drake's upcoming album and provide feedback",
    assignee: "John Smith",
    assigneeAvatar: "JS",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-01-20",
    project: "Drake Album",
    tags: ["Mixing", "Review"],
    progress: 75,
    estimatedHours: 8,
    actualHours: 6,
    dependencies: ["Track 4 vocals", "Mastering"],
    comments: [
      { user: "John Smith", comment: "Vocals need more presence in the mix", date: "2024-01-15" },
      { user: "Sarah Johnson", comment: "Bass is too heavy in the low end", date: "2024-01-16" }
    ]
  },
  {
    id: 2,
    title: "Finalize Taylor Swift contract",
    description: "Complete the contract negotiations and prepare final documents",
    assignee: "Sarah Johnson",
    assigneeAvatar: "SJ",
    priority: "Critical",
    status: "Pending",
    dueDate: "2024-01-18",
    project: "Taylor Swift Deal",
    tags: ["Legal", "Contract"],
    progress: 90,
    estimatedHours: 12,
    actualHours: 10,
    dependencies: ["Legal review", "Artist approval"],
    comments: [
      { user: "Sarah Johnson", comment: "Waiting for legal team review", date: "2024-01-15" }
    ]
  },
  {
    id: 3,
    title: "Setup studio equipment for session",
    description: "Prepare Studio A for tomorrow's recording session",
    assignee: "Mike Wilson",
    assigneeAvatar: "MW",
    priority: "Medium",
    status: "Completed",
    dueDate: "2024-01-15",
    project: "Studio Setup",
    tags: ["Equipment", "Setup"],
    progress: 100,
    estimatedHours: 4,
    actualHours: 3.5,
    dependencies: [],
    comments: [
      { user: "Mike Wilson", comment: "All equipment tested and ready", date: "2024-01-15" }
    ]
  },
  {
    id: 4,
    title: "Update catalog metadata",
    description: "Update metadata for all tracks in the catalog system",
    assignee: "Lisa Chen",
    assigneeAvatar: "LC",
    priority: "Low",
    status: "Not Started",
    dueDate: "2024-01-25",
    project: "Catalog Management",
    tags: ["Metadata", "Catalog"],
    progress: 0,
    estimatedHours: 16,
    actualHours: 0,
    dependencies: ["System access", "Data validation"],
    comments: []
  }
];

// Mock data for projects
const projects = [
  {
    id: 1,
    name: "Drake Album",
    description: "Production and release of Drake's upcoming album",
    status: "In Progress",
    progress: 65,
    startDate: "2024-01-01",
    endDate: "2024-03-01",
    team: ["John Smith", "Sarah Johnson", "Mike Wilson"],
    budget: 500000,
    spent: 325000
  },
  {
    id: 2,
    name: "Taylor Swift Deal",
    description: "Contract negotiations and deal finalization",
    status: "Pending",
    progress: 85,
    startDate: "2024-01-10",
    endDate: "2024-01-25",
    team: ["Sarah Johnson", "Legal Team"],
    budget: 100000,
    spent: 85000
  },
  {
    id: 3,
    name: "Studio Renovation",
    description: "Renovation and upgrade of Studio B",
    status: "Planning",
    progress: 20,
    startDate: "2024-02-01",
    endDate: "2024-04-01",
    team: ["Mike Wilson", "Lisa Chen"],
    budget: 200000,
    spent: 40000
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-100 text-red-800';
    case 'High':
      return 'bg-orange-100 text-orange-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-100 text-gray-800';
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Not Started':
      return <ClockIcon className="h-4 w-4" />;
    case 'In Progress':
      return <AlertTriangle className="h-4 w-4" />;
    case 'Pending':
      return <Clock className="h-4 w-4" />;
    case 'Completed':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

export default function Tasks() {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Management</h1>
            <p className="text-muted-foreground">Track projects, manage tasks, and collaborate with your team</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Create a new task and assign it to team members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input id="task-title" placeholder="Enter task title" />
                  </div>
                  <div>
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea id="task-description" placeholder="Enter task description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignee">Assignee</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john-smith">John Smith</SelectItem>
                          <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                          <SelectItem value="mike-wilson">Mike Wilson</SelectItem>
                          <SelectItem value="lisa-chen">Lisa Chen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input id="due-date" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="project">Project</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drake-album">Drake Album</SelectItem>
                          <SelectItem value="taylor-swift-deal">Taylor Swift Deal</SelectItem>
                          <SelectItem value="studio-renovation">Studio Renovation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="estimated-hours">Estimated Hours</Label>
                    <Input id="estimated-hours" type="number" placeholder="Enter estimated hours" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowNewTaskDialog(false)}>
                    Create Task
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
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'In Progress').length}</div>
              <p className="text-xs text-muted-foreground">-1 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'Completed').length}</div>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">+1 from yesterday</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Task Management</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search tasks..." 
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
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger className="w-[200px] h-9">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Table */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Tasks</h3>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.description.substring(0, 50)}...
                            </div>
                            <div className="flex gap-1 mt-1">
                              {task.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {task.assigneeAvatar}
                            </div>
                            <span className="text-sm">{task.assignee}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={task.progress} className="w-20" />
                            <span className="text-sm text-muted-foreground">
                              {task.progress}%
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
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{project.name}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Start Date:</span>
                          <div>{new Date(project.startDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">End Date:</span>
                          <div>{new Date(project.endDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <div>${project.budget.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spent:</span>
                          <div>${project.spent.toLocaleString()}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Team:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.team.map((member, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {member}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Task Calendar</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <p>Calendar view coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 