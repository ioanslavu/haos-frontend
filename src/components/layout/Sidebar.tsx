
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Layout,
  BarChart3,
  Users,
  Music,
  Calendar,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronDown,
  UserCircle,
  Shield,
  LogOut,
  Briefcase,
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
  FileCheck,
  Handshake,
  Palette,
  Package,
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
  tourId?: string; // data-tour attribute for onboarding tours
}

const navigation: NavigationItem[] = [
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
    tourId: 'dashboard-nav',
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    show: (user) => user?.role === 'administrator', // Only admins
    tourId: 'contracts-nav',
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: Layout,
    show: (user) => user?.role === 'administrator', // Only admins
    tourId: 'templates-nav',
  },
  // { name: 'BI & Analytics', href: '/analytics', icon: BarChart3, tourId: 'analytics-nav' },
  {
    name: 'CRM',
    href: '/crm',
    icon: Briefcase,
    show: (user) => {
      // Hide CRM for digital department users - they get Digital Dashboard instead
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      return user?.role !== 'guest' && (user?.department || user?.role === 'administrator') && !isDigital;
    },
    tourId: 'crm-nav',
  },
  // { name: 'Studio', href: '/studio', icon: Calendar },
  // { name: 'Tasks', href: '/tasks', icon: CheckSquare },
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
      return isDigital && user?.role !== 'administrator';
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

// Bottom navigation items - shown at the bottom for everyone
const bottomNavigation: NavigationItem[] = [
  {
    name: 'Catalog',
    href: '/catalog',
    icon: Music,
    show: (user) => {
      const isDigital = user?.department?.name?.toLowerCase() === 'digital' ||
                        user?.department?.toLowerCase() === 'digital';
      // Hide for digital users, but show for admins even if they're in digital department
      return user?.role !== 'guest' && (!isDigital || user?.role === 'administrator');
    },
    tourId: 'catalog-nav',
  },
  {
    name: 'Entities',
    href: '/entities',
    icon: Users,
    show: (user) => user?.role !== 'guest', // All non-guests
    tourId: 'entities-nav',
  },
  {
    name: 'Activities',
    href: '/activities',
    icon: Activity,
    show: (user) => user?.role !== 'guest', // All non-guests
    tourId: 'activities-nav',
  },
];

const digitalSubmenu: NavigationItem[] = [
  { name: 'Overview', href: '/digital/overview', icon: LayoutDashboard },
  { name: 'Campanii', href: '/digital/campaigns', icon: Megaphone },
  // { name: 'Servicii', href: '/digital/services', icon: Settings2 },
  { name: 'Distributions', href: '/digital/distributions', icon: TrendingUp },
  { name: 'Financiar', href: '/digital/financial', icon: DollarSign },
  { name: 'Task-uri', href: '/digital/tasks', icon: CheckSquare },
  { name: 'Raportare & Insights', href: '/digital/reporting', icon: BarChart3 },
];

const artistSalesSubmenu: NavigationItem[] = [
  { name: 'Briefs', href: '/artist-sales/briefs', icon: ClipboardList },
  { name: 'Opportunities', href: '/artist-sales/opportunities', icon: Target },
  { name: 'Proposals', href: '/artist-sales/proposals', icon: FileCheck },
  { name: 'Deals', href: '/artist-sales/deals', icon: Handshake },
  { name: 'Deliverable Packs', href: '/artist-sales/admin/deliverable-packs', icon: Package },
  { name: 'Usage Terms', href: '/artist-sales/admin/usage-terms', icon: FileText },
];

const adminNavigation: NavigationItem[] = [
  { name: 'User Management', href: '/users/management', icon: UserCog, tourId: 'users-nav' },
  { name: 'Entity Requests', href: '/admin/entity-requests', icon: ClipboardList, tourId: 'entity-requests-nav' },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield, tourId: 'roles-nav' },
  { name: 'Company Settings', href: '/company-settings', icon: Settings, tourId: 'company-settings-nav' },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const { user, logout, isGuest, isAdminOrManager } = useAuthStore();
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
      "backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-r border-white/20 dark:border-white/10 transition-all duration-300 flex flex-col shadow-2xl overflow-hidden z-30",
      "m-4 rounded-3xl",
      "lg:relative fixed inset-y-0 left-0",
      collapsed ? "w-20 -translate-x-full lg:translate-x-0" : "w-72 translate-x-0"
    )}>
      {/* Glassmorphic Header with Gradient */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-foreground text-lg">HaOS</div>
                <div className="text-[10px] text-muted-foreground font-medium">Studio Platform</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className="h-12 w-12 md:h-9 md:w-9 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 hidden lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => {
            // Check if item should be shown based on user role
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  data-tour={item.tourId}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
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
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
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
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 w-full",
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
                    {digitalSubmenu.map((item) => (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          aria-label={`Navigate to ${item.name}`}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
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

          {/* Artist Sales Dropdown - Show for non-guest users */}
          {(() => {
            const canSeeArtistSales = user?.role !== 'guest';

            return canSeeArtistSales && (
              <li>
                <button
                  onClick={() => setArtistSalesOpen(!artistSalesOpen)}
                  aria-label={artistSalesOpen ? "Collapse artist sales menu" : "Expand artist sales menu"}
                  aria-expanded={artistSalesOpen}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 w-full",
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
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300",
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

          {/* Bottom Navigation - Catalog, Entities, and Activities */}
          {bottomNavigation.map((item) => {
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  data-tour={item.tourId}
                  aria-label={`Navigate to ${item.name}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300",
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

          {/* Department Requests - For admins and managers only */}
          {isAdminOrManager() && (
            <li>
              <NavLink
                to="/department-requests"
                aria-label={`Department Requests${pendingCount && pendingCount > 0 ? ` - ${pendingCount} pending` : ''}`}
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

          {/* Admin section */}
          {isAdmin && (
            <>
              {!collapsed && (
                <li className="mt-4 mb-2">
                  <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                </li>
              )}
              {adminNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    data-tour={item.tourId}
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
      </nav>

      <div className="p-4 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-tour="profile-menu"
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
