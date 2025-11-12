
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
          <div className="h-[200px] bg-muted/30 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">Global Revenue</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center min-w-[200px] px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground font-medium">🇺🇸 United States</span>
                  <span className="text-sm font-bold">$18.2k</span>
                </div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground font-medium">🇬🇧 United Kingdom</span>
                  <span className="text-sm font-bold">$12.1k</span>
                </div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground font-medium">🇩🇪 Germany</span>
                  <span className="text-sm font-bold">$8.4k</span>
                </div>
                <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm">
                  <span className="text-sm text-muted-foreground font-medium">🇨🇦 Canada</span>
                  <span className="text-sm font-bold">$6.5k</span>
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
      className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{subtitle}</p>
          </div>
          {isHovered && (
            <div className="flex gap-1 animate-in fade-in duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
                onClick={handleExport}
                aria-label="Export chart data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        {renderChart()}
      </CardContent>
    </Card>
  );
};
