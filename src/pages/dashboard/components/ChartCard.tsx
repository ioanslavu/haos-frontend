
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

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
  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#colorRevenue)" 
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
              <XAxis 
                type="number" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis 
                type="category" 
                dataKey="track" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                width={80}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};
