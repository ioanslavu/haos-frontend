import React, { useState } from 'react';
import { Upload, Download, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartCard } from '@/pages/dashboard/components/ChartCard';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock data
const importHistory = [
  { id: 1, source: 'Spotify', date: '2024-01-15', status: 'Success', records: 1250, revenue: 4320.50 },
  { id: 2, source: 'Apple Music', date: '2024-01-14', status: 'Success', records: 892, revenue: 3240.75 },
  { id: 3, source: 'YouTube Music', date: '2024-01-13', status: 'Error', records: 0, revenue: 0 },
  { id: 4, source: 'Amazon Music', date: '2024-01-12', status: 'Success', records: 567, revenue: 1890.25 }
];

const recoupmentData = [
  { artist: 'Drake', advance: 500000, earned: 387500, percentage: 77.5 },
  { artist: 'Taylor Swift', advance: 750000, earned: 920000, percentage: 100 },
  { artist: 'The Weeknd', advance: 300000, earned: 245000, percentage: 81.7 },
  { artist: 'Ariana Grande', advance: 400000, earned: 156000, percentage: 39 }
];

const payoutQueue = [
  { id: 1, party: 'Drake', amount: 12500.00, period: 'Q4 2023', status: 'Ready' },
  { id: 2, party: 'Producer A', amount: 3750.00, period: 'Q4 2023', status: 'Ready' },
  { id: 3, party: 'Universal Music', amount: 8900.00, period: 'Q4 2023', status: 'Pending' },
  { id: 4, party: 'Taylor Swift', amount: 45000.00, period: 'Q4 2023', status: 'Ready' }
];

export default function Analytics() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStep, setImportStep] = useState(1);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">BI & Analytics</h1>
            <p className="text-muted-foreground">Import statements, track cashflow, and manage payouts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Statement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Royalty Statement</DialogTitle>
                  <DialogDescription>
                    Upload and process royalty statements from DSPs and collecting societies
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={`step-${importStep}`} className="w-full">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="step-1" disabled={importStep < 1}>Upload</TabsTrigger>
                    <TabsTrigger value="step-2" disabled={importStep < 2}>Map Fields</TabsTrigger>
                    <TabsTrigger value="step-3" disabled={importStep < 3}>Validate</TabsTrigger>
                    <TabsTrigger value="step-4" disabled={importStep < 4}>Preview</TabsTrigger>
                    <TabsTrigger value="step-5" disabled={importStep < 5}>Complete</TabsTrigger>
                  </TabsList>

                  <TabsContent value="step-1" className="space-y-4 mt-6">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Upload Statement File</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Support for CSV, Excel, and PDF files from major DSPs
                      </p>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setSelectedFile(e.target.files[0]);
                            setImportStep(2);
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button asChild variant="outline">
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>
                  </TabsContent>

                  <TabsContent value="step-2" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Map Statement Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Artist Name</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="artist">Artist</SelectItem>
                              <SelectItem value="performer">Performer</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Track Title</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="title">Title</SelectItem>
                              <SelectItem value="track">Track</SelectItem>
                              <SelectItem value="song">Song</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Revenue</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="revenue">Revenue</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                              <SelectItem value="earnings">Earnings</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Period</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="period">Period</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="month">Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setImportStep(1)}>
                          Back
                        </Button>
                        <Button onClick={() => setImportStep(3)}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="step-3" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Validate Data</h3>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Validation Complete</span>
                          </div>
                          <Badge variant="secondary">1,250 records</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Valid records:</span>
                            <span className="font-medium text-green-600">1,245</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Records with warnings:</span>
                            <span className="font-medium text-yellow-600">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Invalid records:</span>
                            <span className="font-medium text-red-600">2</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setImportStep(2)}>
                          Back
                        </Button>
                        <Button onClick={() => setImportStep(4)}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="step-4" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Preview Import</h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Artist</TableHead>
                              <TableHead>Track</TableHead>
                              <TableHead>Revenue</TableHead>
                              <TableHead>Period</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Drake</TableCell>
                              <TableCell>God's Plan</TableCell>
                              <TableCell>$12,450.00</TableCell>
                              <TableCell>Q4 2023</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Taylor Swift</TableCell>
                              <TableCell>Anti-Hero</TableCell>
                              <TableCell>$9,800.00</TableCell>
                              <TableCell>Q4 2023</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Harry Styles</TableCell>
                              <TableCell>As It Was</TableCell>
                              <TableCell>$8,750.00</TableCell>
                              <TableCell>Q4 2023</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setImportStep(3)}>
                          Back
                        </Button>
                        <Button onClick={() => setImportStep(5)}>
                          Import Data
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="step-5" className="space-y-4 mt-6">
                    <div className="text-center space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <h3 className="text-xl font-medium">Import Complete!</h3>
                      <p className="text-muted-foreground">
                        Successfully imported 1,245 records from your statement.
                      </p>
                      <div className="pt-4">
                        <Button onClick={() => setImportDialogOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$945,230</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> from last quarter
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tracks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.2%</span> from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$67,890</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-600">15</span> parties awaiting payment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recoupment Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78.3%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last quarter
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartCard />
            </CardContent>
          </Card>

          {/* Recoupment Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Recoupment Progress</CardTitle>
              <CardDescription>Advance recoupment status by artist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recoupmentData.map((item) => (
                  <div key={item.artist} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.artist}</span>
                      <span className="text-muted-foreground">
                        ${item.earned.toLocaleString()} / ${item.advance.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {item.percentage}% recouped
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>Latest statement imports and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importHistory.map((import_) => (
                  <TableRow key={import_.id}>
                    <TableCell className="font-medium">{import_.source}</TableCell>
                    <TableCell>{import_.date}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={import_.status === 'Success' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {import_.status === 'Success' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {import_.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{import_.records.toLocaleString()}</TableCell>
                    <TableCell>${import_.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payout Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Queue</CardTitle>
            <CardDescription>Pending payments for the current period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Party</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutQueue.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.party}</TableCell>
                    <TableCell>${payout.amount.toLocaleString()}</TableCell>
                    <TableCell>{payout.period}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={payout.status === 'Ready' ? 'default' : 'secondary'}
                      >
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}