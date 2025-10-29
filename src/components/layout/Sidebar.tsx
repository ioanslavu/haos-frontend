
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
  Building2,
  User,
  FilePlus,
  Briefcase,
  Bell,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { usePendingRequestsCount } from '@/api/hooks/useUsers';
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

const navigation: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/',
    icon: LayoutDashboard,
    show: (user) => user?.role !== 'guest'
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    show: (user) => user?.role === 'administrator' // Only admins
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: Layout,
    show: (user) => user?.role === 'administrator' // Only admins
  },
  // { name: 'BI & Analytics', href: '/analytics', icon: BarChart3 },
  {
    name: 'CRM',
    href: '/crm',
    icon: Briefcase,
    show: (user) => user?.role !== 'guest' && (user?.department || user?.role === 'administrator')
  },
  {
    name: 'Catalog',
    href: '/catalog',
    icon: Music,
    show: (user) => user?.role === 'administrator' // Only admins
  },
  // { name: 'Studio', href: '/studio', icon: Calendar },
  // { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  {
    name: 'Company Settings',
    href: '/company-settings',
    icon: Settings,
    show: (user) => user?.role === 'administrator' // Only admins
  },
];

const entitySubmenu: NavigationItem[] = [
  { name: 'All Entities', href: '/entities', icon: Users },
  { name: 'Clients', href: '/entities/clients', icon: User },
  { name: 'Artists', href: '/entities/artists', icon: User },
  { name: 'Writers', href: '/entities/writers', icon: User },
  { name: 'Producers', href: '/entities/producers', icon: User },
  { name: 'Labels', href: '/entities/labels', icon: Building2 },
  { name: 'Publishers', href: '/entities/publishers', icon: Building2 },
];

const adminNavigation: NavigationItem[] = [
  { name: 'User Management', href: '/users/management', icon: UserCog },
  { name: 'Roles & Permissions', href: '/roles', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const { user, logout, isGuest, isAdminOrManager } = useAuthStore();
  const [entitiesOpen, setEntitiesOpen] = React.useState(false);

  // Get pending requests count for admins/managers
  const { data: pendingCount } = usePendingRequestsCount();

  // Check if user has admin role
  const isAdmin = user?.role === 'administrator';
  
  return (
    <aside className={cn(
      "bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="font-semibold text-white">Studio OS</div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapse(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:flex"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            // Check if item should be shown based on user role
            const shouldShow = !item.show || item.show(user);
            if (!shouldShow) return null;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-slate-800 hover:text-white",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300",
                      collapsed && "justify-center px-2"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}

          {/* Entities Dropdown - Only show for admins */}
          {user?.role === 'administrator' && (
            <li>
              <button
                onClick={() => setEntitiesOpen(!entitiesOpen)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full",
                  "hover:bg-slate-800 hover:text-white text-slate-300",
                  collapsed && "justify-center px-2"
                )}
              >
                <Users className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Entities</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        entitiesOpen && "rotate-180"
                      )}
                    />
                  </>
                )}
              </button>
              {!collapsed && entitiesOpen && (
                <ul className="ml-4 mt-1 space-y-1">
                  {entitySubmenu.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            "hover:bg-slate-800 hover:text-white",
                            isActive
                              ? "bg-blue-600 text-white"
                              : "text-slate-300"
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
          )}

          {/* Department Requests - For admins and managers only */}
          {isAdminOrManager() && (
            <li>
              <NavLink
                to="/department-requests"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                    "hover:bg-slate-800 hover:text-white",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300",
                    collapsed && "justify-center px-2"
                  )
                }
              >
                <Bell className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">Department Requests</span>
                    {pendingCount && pendingCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-xs bg-yellow-500 text-white">
                        {pendingCount}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && pendingCount && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
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
                  <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Administration
                  </div>
                </li>
              )}
              {adminNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-slate-800 hover:text-white",
                        isActive 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-300",
                        collapsed && "justify-center px-2"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full hover:bg-slate-800 rounded-md p-2 transition-colors",
              collapsed && "justify-center p-0"
            )}>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.first_name?.charAt(0) || 'U'}{user?.last_name?.charAt(0) || ''}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium text-white truncate">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.full_name || user?.name || 'User'}
                  </div>
                  <div className="text-xs text-slate-400 truncate capitalize">
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
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
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
