
import React from 'react';
import { KPICard } from './KPICard';
import { ChartCard } from './ChartCard';
import { AlertsList } from './AlertsList';
import { TasksList } from './TasksList';
import { DollarSign, FileText, PenTool, Music } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening in your studio.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Monthly Net Revenue"
          value="$45,230"
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Unpaid Royalties"
          value="$8,450"
          change="-5.2%"
          changeType="negative"
          icon={DollarSign}
          variant="warning"
        />
        <KPICard
          title="Contracts Out for Signature"
          value="7"
          change="+2"
          changeType="neutral"
          icon={PenTool}
        />
        <KPICard
          title="Top Track This Month"
          value="Summer Vibes"
          change="2.1M streams"
          changeType="positive"
          icon={Music}
          valueSubtext="by Artist XYZ"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Cashflow Overview"
          subtitle="Net revenue over the last 12 months"
          type="area"
        />
        <ChartCard
          title="Contract Status"
          subtitle="Current contract distribution"
          type="donut"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top 5 Tracks"
          subtitle="By streaming revenue this month"
          type="bar"
        />
        <ChartCard
          title="Revenue by Territory"
          subtitle="Geographic distribution"
          type="map"
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsList />
        <TasksList />
      </div>
    </div>
  );
};
