
import React from 'react';
import { KPICard } from './KPICard';
import { ChartCard } from './ChartCard';
import { AlertsList } from './AlertsList';
import { TasksList } from './TasksList';
import { SetupProgressCard } from '@/components/onboarding/SetupProgressCard';
import { DollarSign, FileText, PenTool, Music } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-8 pb-8">
      {/* Modern Glassmorphic Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Overview
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Welcome back! Here's what's happening in your studio.
          </p>
        </div>
      </div>

      {/* Setup Progress Card - Only shows for digital/sales departments */}
      {/* TEMPORARILY DISABLED - Uncomment to re-enable onboarding progress */}
      {/* <SetupProgressCard /> */}

      {/* Bento Grid Layout - 2025 Modern Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {/* Large Revenue Card - spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2">
          <KPICard
            title="Monthly Net Revenue"
            value="$45,230"
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
          />
        </div>

        {/* Warning Card */}
        <div>
          <KPICard
            title="Unpaid Royalties"
            value="$8,450"
            change="-5.2%"
            changeType="negative"
            icon={DollarSign}
            variant="warning"
          />
        </div>

        {/* Contracts Card */}
        <div>
          <KPICard
            title="Contracts Out for Signature"
            value="7"
            change="+2"
            changeType="neutral"
            icon={PenTool}
          />
        </div>

        {/* Cashflow Chart - Large, spans 2 columns and 2 rows */}
        <div className="md:col-span-2 lg:row-span-2">
          <ChartCard
            title="Cashflow Overview"
            subtitle="Net revenue over the last 12 months"
            type="area"
          />
        </div>

        {/* Top Track - spans 2 columns */}
        <div className="md:col-span-2">
          <KPICard
            title="Top Track This Month"
            value="Summer Vibes"
            change="2.1M streams"
            changeType="positive"
            icon={Music}
            valueSubtext="by Artist XYZ"
          />
        </div>

        {/* Contract Status Donut */}
        <div className="lg:row-span-2">
          <ChartCard
            title="Contract Status"
            subtitle="Current contract distribution"
            type="donut"
          />
        </div>

        {/* Alerts List - spans full width on mobile, 2 cols on desktop */}
        <div className="md:col-span-2">
          <AlertsList />
        </div>

        {/* Top Tracks Bar Chart */}
        <div className="md:col-span-2 lg:col-span-2">
          <ChartCard
            title="Top 5 Tracks"
            subtitle="By streaming revenue this month"
            type="bar"
          />
        </div>

        {/* Territory Map */}
        <div className="md:col-span-2">
          <ChartCard
            title="Revenue by Territory"
            subtitle="Geographic distribution"
            type="map"
          />
        </div>

        {/* Tasks List */}
        <div className="md:col-span-2 lg:col-span-2">
          <TasksList />
        </div>
      </div>
    </div>
  );
};
