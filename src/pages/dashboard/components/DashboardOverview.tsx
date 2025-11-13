
import React from 'react';
import { TasksList } from './TasksList';

export const DashboardOverview: React.FC = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Header - matching other pages style */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Overview
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Welcome back! Here's what's happening in your studio.
        </p>
      </div>

      {/* Tasks & Notifications Inbox */}
      <div className="max-w-6xl">
        <TasksList />
      </div>
    </div>
  );
};
