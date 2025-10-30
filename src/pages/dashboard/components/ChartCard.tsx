
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Download, Maximize2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle: string;
  type: 'area' | 'donut' | 'bar' | 'map';
}

const areaData = [
  { month: 'Jan', revenue: 32000 },
  { month: 'Feb', revenue: 38000 },
  { month: 'Mar', revenue: 35000 },
  { month: 'Apr', revenue: 42000 },
  { month: 'May', revenue: 39000 },
  { month: 'Jun', revenue: 45000 },
];

const donutData = [
  { name: 'Active', value: 65, color: '#10b981' },
  { name: 'Pending', value: 20, color: '#f59e0b' },
  { name: 'Expired', value: 10, color: '#ef4444' },
  { name: 'Draft', value: 5, color: '#6b7280' },
];

const barData = [
  { track: 'Summer Vibes', revenue: 12500 },
  { track: 'City Lights', revenue: 9800 },
  { track: 'Midnight Hour', revenue: 8200 },
  { track: 'Ocean Dreams', revenue: 7400 },
  { track: 'Electric Soul', revenue: 6900 },
];

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, type }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleExport = () => {
    console.log('Export chart data:', type);
    // Could export to CSV/PNG
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'donut':
        return (
          <div className="flex items-center justify-between h-[200px]">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {donutData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-slate-600">{entry.name}</span>
                  <span className="text-sm font-medium ml-auto">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="track"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'map':
        return (
          <div className="h-[200px] bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-2xl font-semibold text-slate-900">Global Revenue</div>
              <div className="space-y-1">
                <div className="flex justify-between items-center min-w-[200px]">
                  <span className="text-sm text-slate-600">🇺🇸 United States</span>
                  <span className="text-sm font-medium">$18.2k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">🇬🇧 United Kingdom</span>
                  <span className="text-sm font-medium">$12.1k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">🇩🇪 Germany</span>
                  <span className="text-sm font-medium">$8.4k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">🇨🇦 Canada</span>
                  <span className="text-sm font-medium">$6.5k</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className="hover-lift transition-smooth"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {isHovered && (
            <div className="flex gap-1 fade-in">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExport}
                aria-label="Export chart data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};
