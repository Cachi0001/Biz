import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationCenter } from '../notifications/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';
import {
  Menu,
  User,
  LogOut,
  Search,
  Twitter,
  MessageCircle,
  Settings,
  Home,
  Users,
  Package,
  FileText,
  CreditCard,
  Receipt,
  UserPlus,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils/index.js';

const ModernHeader = () => {
  const { user, logout, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const searchRef = useRef(null);

  // Handle search functionality
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setSearchOpen(true);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      setSearchOpen(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-based navigation for sidebar
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Invoices', href: '/invoices', icon: FileText },
      { name: 'Sales Report', href: '/sales/report', icon: TrendingUp },
    ];

    // Owner-only items
    if (isOwner) {
      baseNavigation.push(
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Expenses', href: '/expenses', icon: Receipt },
        { name: 'Team', href: '/team', icon: UserPlus },
        { name: 'Transactions', href: '/transactions', icon: CreditCard },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      );
    }

    // Admin items (can manage products and expenses)
    if (isAdmin) {
      baseNavigation.push(
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Expenses', href: '/expenses', icon: Receipt },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      );
    }

    // Always add settings for all roles
    baseNavigation.push(
      { name: 'Settings', href: '/settings', icon: Settings }
    );

    return baseNavigation;
  };

  const navigation = getNavigationItems();

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-40 flex h-14 lg:h-[60px] items-center bg-green-500 text-white px-2 lg:px-6 shadow-sm">
        {/* Hamburger menu (mobile only) */}
        <div className="flex items-center md:hidden w-10">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden border-none bg-transparent hover:bg-green-600 focus:ring-2 focus:ring-green-300 h-10 w-10 rounded-full text-white"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            
            {/* Mobile sidebar content */}
            <SheetContent side="left" className="flex flex-col w-[280px] p-0 bg-white z-50">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 pt-6">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold text-gray-900"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold">S</span>
                  </div>
                  SabiOps SME
                </Link>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-green-50 hover:text-green-700 text-gray-700"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-3 pb-6 pt-2">
                <a
                  href="https://wa.me/2348158025887"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-900 transition-all shadow-sm"
                >
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Contact us
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo (mobile and desktop) */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold ml-2 md:ml-0"
          style={{ minWidth: 'fit-content' }}
        >
          <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="hidden sm:inline">SabiOps SME</span>
          <span className="inline sm:hidden">SabiOps</span>
        </Link>

        {/* Search bar (responsive width, limited on mobile) */}
        <div className="flex-1 flex justify-center px-2 min-w-0">
          <div ref={searchRef} className="relative w-full max-w-[140px] xs:max-w-[180px] sm:max-w-sm md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/70" />
              <input
                type="search"
                placeholder="Search customers, products, invoices..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-full appearance-none bg-green-600/50 text-white pl-8 shadow-none h-9 rounded-md border border-green-400/30 px-3 py-1 text-sm transition-all focus:ring-2 focus:ring-green-300 focus:border-green-300 placeholder:text-white/70 min-w-0"
                style={{ minWidth: '80px' }}
              />
            </div>
            {/* Search dropdown would go here */}
          </div>
        </div>

        {/* Icons (Twitter, notifications, profile) */}
        <div className="flex items-center gap-2 md:gap-4 ml-2 min-w-fit">
          {/* Twitter icon with tooltip */}
          <div className="flex flex-col items-center relative" style={{ minWidth: '48px' }}>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-600" asChild>
              <a href="https://x.com/Caleb0533" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4 text-blue-100" />
              </a>
            </Button>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col items-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/90 text-white text-xs px-3 py-1 rounded-lg shadow-lg whitespace-nowrap font-medium relative">
                Follow our CEO
                <span className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-black/90 rotate-45" style={{ marginTop: '-6px' }}></span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center">
            <NotificationBell 
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="h-8 w-8 hover:bg-green-600 text-white"
            />
            <NotificationCenter 
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />
          </div>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-green-600">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.full_name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Role: {user?.role || 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

export { ModernHeader };
export default ModernHeader;