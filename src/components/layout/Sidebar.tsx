
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Layout,
  BarChart3,
  Users,
  Music2,
  Calendar,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronDown,
  UserCircle,
  Shield,
  LogOut,
  Bell,
  UserCog,
  Sparkles,
  Megaphone,
  Settings2,
  DollarSign,
  ClipboardList,
  Activity,
  TrendingUp,
  Target,
  Palette,
  Package,
  StickyNote,
  Music,
  CheckCircle2,
  FolderKanban,
  UsersRound,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { usePendingRequestsCount } from '@/api/hooks/useUsers';
import { usePendingEntityRequests } from '@/api/hooks/useEntityRequests';
import { useActivitiesNeedingFollowUp } from '@/api/hooks/useActivities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  show?: (user: any) => boolean;
}

// Navigation items organized by workflow sections
// DAILY WORK - What do I need to do today?
const dailyWorkNavigation: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    show: (user) => {
      // Hide general overview for digital users - they get Digital Overview instead
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      return user?.role !== 'guest' && !isDigital;
    },
  },
  {
    name: 'Workboard',
    href: '/workboard',
    icon: FolderKanban,
    show: (user) => user?.role !== 'guest' && (user?.department || user?.role === 'administrator'),
  },
  {
    name: 'Task Management',
    href: '/task-management',
    icon: CheckSquare,
    show: (user) => {
      // Hide for digital department users (they have their own tasks page)
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      return user?.role !== 'guest' && (user?.department || user?.role === 'administrator') && !isDigital;
    },
  },
  {
    name: 'Notes',
    href: '/notes',
    icon: StickyNote,
    show: (user) => user?.role !== 'guest',
  },
];

// MUSIC & CONTENT - Core creative work
const musicNavigation: NavigationItem[] = [
  {
    name: 'Camps',
    href: '/camps',
    icon: Calendar,
    show: (user) => {
      // Hide Camps for digital and marketing department users
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                          user?.department?.toLowerCase() === 'marketing';
      // Only show for managers and admins (level >= 300)
      const canManageCamps = (user?.role_detail?.level ?? 0) >= 300;
      return canManageCamps && (user?.department || user?.role === 'administrator') && !isDigital && !isMarketing;
    },
  },
  {
    name: 'Songs',
    href: '/songs',
    icon: Music2,
    show: (user) => {
      // Hide Songs for digital and marketing department users
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                          user?.department?.toLowerCase() === 'marketing';
      return user?.role !== 'guest' && (user?.department || user?.role === 'administrator') && !isDigital && !isMarketing;
    },
  },
];

// BUSINESS & SALES - Revenue-generating activities
const businessNavigation: NavigationItem[] = [
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    show: (user) => user?.role === 'administrator' || (user?.role_detail?.level ?? 0) >= 300, // Admins and managers
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: Layout,
    show: (user) => user?.role === 'administrator' || (user?.role_detail?.level ?? 0) >= 300, // Admins and managers
  },
  {
    name: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    show: (user) => {
      // Show for managers and admins (level >= 300) - all departments
      return user?.role === 'administrator' || (user?.role_detail?.level ?? 0) >= 300;
    },
  },
];

// CRM & DATA - Reference information
const crmNavigation: NavigationItem[] = [
  {
    name: 'Entities',
    href: '/entities',
    icon: Users,
    show: (user) => {
      // Hide for marketing department
      const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                          user?.department?.toLowerCase() === 'marketing';
      return user?.role !== 'guest' && !isMarketing;
    },
  },
  {
    name: 'Activities',
    href: '/activities',
    icon: Activity,
    show: (user) => {
      // Hide for marketing department
      const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                          user?.department?.toLowerCase() === 'marketing';
      return user?.role !== 'guest' && !isMarketing;
    },
  },
  {
    name: 'Teams',
    href: '/teams',
    icon: UsersRound,
    show: (user) => {
      // Only show for managers and admins (level >= 300)
      const canManageTeams = (user?.role_detail?.level ?? 0) >= 300;
      return canManageTeams && (user?.department || user?.role === 'administrator');
    },
  },
];

// Digital navigation items - shown as regular nav items for digital users
const digitalNavigation: NavigationItem[] = [
  {
    name: 'Digital Overview',
    href: '/digital/overview',
    icon: LayoutDashboard,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      // Show as regular nav item only for digital users (not admins)
      return isDigital && user?.role !== 'administrator';
    },
  },
  {
    name: 'Campaigns',
    href: '/digital/campaigns',
    icon: Megaphone,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      return isDigital && user?.role !== 'administrator';
    },
  },
  {
    name: 'Distributions',
    href: '/digital/distributions',
    icon: Settings2,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      // Hide for digital_employee, show only for digital_manager
      return isDigital && user?.role !== 'administrator' && user?.role !== 'digital_employee';
    },
  },
  {
    name: 'Financial',
    href: '/digital/financial',
    icon: DollarSign,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      // Hide for digital_employee, show only for digital_manager
      return isDigital && user?.role !== 'administrator' && user?.role !== 'digital_employee';
    },
  },
  {
    name: 'Tasks',
    href: '/digital/tasks',
    icon: CheckSquare,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      return isDigital && user?.role !== 'administrator';
    },
  },
  {
    name: 'Reporting & Insights',
    href: '/digital/reporting',
    icon: BarChart3,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      // Hide for digital_employee, show only for digital_manager
      return isDigital && user?.role !== 'administrator' && user?.role !== 'digital_employee';
    },
  },
];

// Marketing navigation items - shown as regular nav items for marketing users
const marketingNavigation: NavigationItem[] = [
  {
    name: 'Artist Assignments',
    href: '/marketing/team',
    icon: Users,
    show: (user) => {
      const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                         user?.department?.toLowerCase() === 'marketing';
      // Hide for marketing_employee, show only for marketing_manager
      return isMarketing && user?.role !== 'administrator' && user?.role !== 'marketing_employee';
    },
  },
];


const digitalSubmenu: NavigationItem[] = [
  { name: 'Overview', href: '/digital/overview', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/digital/campaigns', icon: Megaphone },
  // { name: 'Servicii', href: '/digital/services', icon: Settings2 },
  {
    name: 'Distributions',
    href: '/digital/distributions',
    icon: TrendingUp,
    show: (user) => user?.role !== 'digital_employee' // Hide for digital_employee
  },
  {
    name: 'Financiar',
    href: '/digital/financial',
    icon: DollarSign,
    show: (user) => user?.role !== 'digital_employee' // Hide for digital_employee
  },
  { name: 'Task-uri', href: '/digital/tasks', icon: CheckSquare },
  { name: 'Raportare & Insights', href: '/digital/reporting', icon: BarChart3 },
];

// Opportunities submenu (unified artist sales system)
const artistSalesSubmenu: NavigationItem[] = [
  { name: 'Pipeline', href: '/opportunities', icon: Target },
];

const adminNavigation: NavigationItem[] = [
  { name: 'User Management', href: '/users/management', icon: UserCog },
  { name: 'Entity Requests', href: '/admin/entity-requests', icon: ClipboardList },
  { name: 'Checklist Templates', href: '/admin/checklist-templates', icon: CheckSquare },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield },
  { name: 'Company Settings', href: '/company-settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const { user, logout, isAdminOrManager } = useAuthStore();
  const [digitalOpen, setDigitalOpen] = React.useState(false);
  const [artistSalesOpen, setArtistSalesOpen] = React.useState(false);

  // Get pending requests count for admins/managers
  const { data: pendingCount } = usePendingRequestsCount();
  const { data: entityRequestsData } = usePendingEntityRequests();
  const pendingEntityRequestsCount = entityRequestsData?.results?.length || 0;

  // Get follow-up activities count for badge
  const { data: followUpActivitiesData } = useActivitiesNeedingFollowUp();
  const followUpCount = followUpActivitiesData?.count || 0;

  // Check if user has admin role
  const isAdmin = user?.role === 'administrator';
  
  return (
    <aside className={cn(
      "backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-r border-white/20 dark:border-white/10 transition-all duration-300 shadow-2xl z-30",
      "m-2 rounded-2xl flex flex-col h-full max-h-screen overflow-hidden",
      "lg:relative fixed inset-y-0 left-0",
      collapsed ? "w-20 -translate-x-full lg:translate-x-0" : "w-60 translate-x-0"
    )}>
      {/* Glassmorphic Header with Gradient */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-foreground text-base">HaOS</div>
                <div className="text-[10px] text-muted-foreground font-medium">Studio Platform</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className="h-9 w-9 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 hidden lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-h-0">
        <ul className="space-y-1.5">
          {/* DAILY WORK Section */}
          {dailyWorkNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* Digital pages as regular nav items for digital users */}
          {digitalNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* Marketing pages as regular nav items for marketing users */}
          {marketingNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* MUSIC & CONTENT Section - only show label if any items visible */}
          {musicNavigation.some((item) => !item.show || item.show(user)) && !collapsed && (
            <li className="mt-3 mb-1.5">
              <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Music
              </div>
            </li>
          )}
          {musicNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* Artist Sales Dropdown - Hide for digital and marketing users */}
          {(() => {
            const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                              user?.department?.toLowerCase() === 'digital';
            const isMarketing = user?.department?.name?.toLowerCase() === 'marketing' ||
                                user?.department?.toLowerCase() === 'marketing';
            const canSeeArtistSales = user?.role !== 'guest' && !isDigital && !isMarketing;

            return canSeeArtistSales && (
              <li>
                <button
                  onClick={() => setArtistSalesOpen(!artistSalesOpen)}
                  aria-label={artistSalesOpen ? "Collapse artist sales menu" : "Expand artist sales menu"}
                  aria-expanded={artistSalesOpen}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 w-full",
                    "hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm text-foreground hover:scale-105",
                    collapsed && "justify-center px-3"
                  )}
                >
                  <Palette className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Artist Sales</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          artistSalesOpen && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && artistSalesOpen && (
                  <ul className="ml-4 mt-2 space-y-1.5">
                    {artistSalesSubmenu.map((item) => (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          aria-label={`Navigate to ${item.name}`}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300",
                              "hover:bg-white/10 dark:hover:bg-white/5 backdrop-blur-sm",
                              isActive
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-foreground font-semibold"
                                : "text-muted-foreground"
                            )
                          }
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.name}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })()}

          {/* BUSINESS & SALES Section - only show label if any items visible */}
          {businessNavigation.some((item) => !item.show || item.show(user)) && !collapsed && (
            <li className="mt-3 mb-1.5">
              <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Business
              </div>
            </li>
          )}
          {businessNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* CRM & DATA Section - only show label if any items visible */}
          {crmNavigation.some((item) => !item.show || item.show(user)) && !collapsed && (
            <li className="mt-3 mb-1.5">
              <div className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                CRM
              </div>
            </li>
          )}
          {crmNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300",
                      "hover:scale-105",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                      collapsed && "justify-center px-3"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.name === 'Activities' && followUpCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 text-xs bg-orange-500 text-white" aria-label={`${followUpCount} activities need follow-up`}>
                          {followUpCount}
                        </Badge>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}

          {/* Digital Dropdown - Show only for admins (digital users get regular nav items above) */}
          {(() => {
            const canSeeDigital = user?.role === 'administrator';

            return canSeeDigital && (
              <li>
                <button
                  onClick={() => setDigitalOpen(!digitalOpen)}
                  aria-label={digitalOpen ? "Collapse digital menu" : "Expand digital menu"}
                  aria-expanded={digitalOpen}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 w-full",
                    "hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm text-foreground hover:scale-105",
                    collapsed && "justify-center px-3"
                  )}
                >
                  <Sparkles className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Digital</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          digitalOpen && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && digitalOpen && (
                  <ul className="ml-4 mt-2 space-y-1.5">
                    {digitalSubmenu.map((item) => {
                      // Check if item should be shown based on user role
                      const shouldShow = !item.show || item.show(user);
                      if (!shouldShow) return null;

                      return (
                        <li key={item.name}>
                          <NavLink
                            to={item.href}
                            aria-label={`Navigate to ${item.name}`}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300",
                                "hover:bg-white/10 dark:hover:bg-white/5 backdrop-blur-sm",
                                isActive
                                  ? "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-foreground font-semibold"
                                  : "text-muted-foreground"
                              )
                            }
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.name}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })()}

          {/* Department Requests - For admins and managers only */}
          {isAdminOrManager() && (
            <li>
              <NavLink
                to="/department-requests"
                aria-label={`Department Requests${pendingCount && pendingCount > 0 ? ` - ${pendingCount} pending` : ''}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-300 relative",
                    "hover:scale-105",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                    collapsed && "justify-center px-3"
                  )
                }
              >
                <Bell className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">Department Requests</span>
                    {pendingCount && pendingCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-xs bg-yellow-500 text-white" aria-label={`${pendingCount} pending requests`}>
                        {pendingCount}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && pendingCount && pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center transition-all" aria-label={`${pendingCount} pending requests`}>
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            </li>
          )}

          {/* Task Reviews - Hidden for now */}

          {/* Admin section */}
          {isAdmin && (
            <>
              {!collapsed && (
                <li className="mt-3 mb-1.5">
                  <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                </li>
              )}
              {adminNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    aria-label={`Navigate to ${item.name}${item.name === 'Entity Requests' && pendingEntityRequestsCount > 0 ? ` - ${pendingEntityRequestsCount} pending` : ''}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative",
                        "hover:scale-105",
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-foreground hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm",
                        collapsed && "justify-center px-3"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.name === 'Entity Requests' && pendingEntityRequestsCount > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-xs bg-yellow-500 text-white" aria-label={`${pendingEntityRequestsCount} pending requests`}>
                            {pendingEntityRequestsCount}
                          </Badge>
                        )}
                      </>
                    )}
                    {collapsed && item.name === 'Entity Requests' && pendingEntityRequestsCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center transition-all" aria-label={`${pendingEntityRequestsCount} pending requests`}>
                        {pendingEntityRequestsCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl min-h-[72px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User profile menu"
              className={cn(
                "flex items-center gap-3 w-full hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl p-2 transition-all duration-300",
                collapsed && "justify-center p-0"
              )}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
                {user?.first_name?.charAt(0) || 'U'}{user?.last_name?.charAt(0) || ''}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.full_name || user?.name || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate capitalize">
                    {user?.role?.replace(/_/g, ' ') || user?.roles?.[0]?.replace(/_/g, ' ') || 'User'}
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "center" : "end"} className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
