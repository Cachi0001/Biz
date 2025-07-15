import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationCenter from './NotificationCenter';
import OnlineStatusIndicator from './ui/online-status-indicator';
import SearchDropdown from './SearchDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  Menu,
  User,
  LogOut,
  Bell,
  Search,
  Twitter,
  MessageCircle,
  TrendingUp,
  Receipt,
} from 'lucide-react';

// Tooltip component for Twitter icon
const Tooltip = ({ children, message }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        className="outline-none"
      >
        {children}
      </div>
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 z-50 flex flex-col items-center">
          <div className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap font-medium">
            {message}
          </div>
          <div className="w-3 h-3 bg-primary rotate-45 -mt-1 shadow-md"></div>
        </div>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const { user, logout, isOwner, isAdmin, isSalesperson, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Initialize notifications and real-time updates
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        title: 'New Sale Recorded',
        message: 'A new sale of N15,000 has been recorded',
        time: '2 minutes ago',
        type: 'success'
      },
      {
        id: 2,
        title: 'Low Stock Alert',
        message: 'Product "Office Chair" is running low (2 items left)',
        time: '1 hour ago',
        type: 'warning'
      },
      {
        id: 3,
        title: 'Invoice Payment Received',
        message: 'Payment received for Invoice #INV-001',
        time: '3 hours ago',
        type: 'success'
      }
    ];
    
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.length);

    const interval = setInterval(() => {
      const randomNotifications = [
        {
          id: Date.now(),
          title: 'New Customer Added',
          message: 'A new customer has been added to your database',
          time: 'Just now',
          type: 'info'
        },
        {
          id: Date.now() + 1,
          title: 'Expense Recorded',
          message: 'New expense of N5,000 has been recorded',
          time: 'Just now',
          type: 'info'
        },
        {
          id: Date.now() + 2,
          title: 'Trial Reminder',
          message: 'Your trial expires in 3 days. Upgrade now!',
          time: 'Just now',
          type: 'warning'
        }
      ];

      if (Math.random() < 0.3) {
        const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        setNotifications(prev => [randomNotification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
  };

  // Role-based navigation
  const getNavigationItems = () => {
    const baseNavigation = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'salesperson'] },
      { name: 'Customers', href: '/customers', icon: Users, roles: ['owner', 'admin', 'salesperson'] },
      { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['owner', 'admin', 'salesperson'] },
      { name: 'Sales Report', href: '/sales/report', icon: TrendingUp, roles: ['owner', 'admin', 'salesperson'] },
    ];

    // Owner-only items
    if (isOwner) {
      baseNavigation.push(
        { name: 'Products', href: '/products', icon: Package, roles: ['owner'] },
        { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['owner'] },
        { name: 'Team', href: '/team', icon: Users, roles: ['owner'] },
        { name: 'Transactions', href: '/transactions', icon: CreditCard, roles: ['owner'] },
      );
    }

    // Admin items (can manage products and expenses)
    if (isAdmin) {
      baseNavigation.push(
        { name: 'Products', href: '/products', icon: Package, roles: ['admin'] },
        { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['admin'] },
      );
    }

    // Always add settings for all roles
    baseNavigation.push(
      { name: 'Settings', href: '/settings', icon: Settings, roles: ['owner', 'admin', 'salesperson'] }
    );

    const userRole = user?.role?.toLowerCase() || '';
    return baseNavigation.filter(item => item.roles.includes(userRole));
  };

  const navigation = getNavigationItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Online/Offline Indicator for authenticated users */}
      {isAuthenticated && <OnlineStatusIndicator />}
      {/* Header */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="fixed top-0 left-0 w-full z-40 flex h-14 lg:h-[60px] items-center bg-primary text-primary-foreground px-2 lg:px-6 shadow-sm rounded-b-xl">
          {/* Hamburger menu (mobile only) inside SheetTrigger */}
          <div className="flex items-center md:hidden w-10">
        <SheetTrigger asChild>
          <Button
                variant="ghost"
            size="icon"
                className="shrink-0 md:hidden border-none bg-transparent hover:bg-gray-100 focus:ring-2 focus:ring-primary h-10 w-10 rounded-full"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
          </div>
          {/* Logo (mobile and desktop) */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold ml-2 md:ml-0 md:block"
            style={{ minWidth: 'fit-content' }}
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="hidden sm:inline">SabiOps SME</span>
            <span className="inline sm:hidden">SabiOps</span>
          </Link>
          {/* Search bar (responsive width, limited on mobile) */}
          <div className="flex-1 flex justify-center px-2 min-w-0">
            <div ref={searchRef} className="relative w-full max-w-[140px] xs:max-w-[180px] sm:max-w-sm md:max-w-md lg:max-w-lg">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-foreground/70" />
                <input
                  type="search"
                  placeholder="Search customers, products, invoices..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="w-full appearance-none bg-primary/90 text-primary-foreground pl-8 shadow-none h-9 rounded-md border border-primary/30 px-3 py-1 text-sm transition-all focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-primary-foreground/70 min-w-0"
                  style={{ minWidth: '80px' }}
                />
              </div>
              <SearchDropdown
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          </div>
          {/* Icons (Twitter, notifications, profile) */}
          <div className="flex items-center gap-2 md:gap-4 ml-2 min-w-fit">
            {/* Twitter icon with always-visible message below, styled as a standard tooltip dropdown */}
            <div className="flex flex-col items-center relative" style={{ minWidth: '48px' }}>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="https://x.com/Caleb0533" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 text-blue-100" />
                </a>
              </Button>
              {/* Standard tooltip: black rounded rectangle with small triangle below */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 flex flex-col items-center">
                <div className="bg-black/90 text-white text-xs px-3 py-1 rounded-lg shadow-lg whitespace-nowrap font-medium relative">
                  Follow our CEO
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-3 h-3 bg-black/90 rotate-45" style={{ marginTop: '-6px' }}></span>
                </div>
              </div>
            </div>
            {/* Notifications */}
            <div className="flex items-center">
              <NotificationCenter />
            </div>
            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
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
        {/* Mobile sidebar content */}
        <SheetContent side="left" className="flex flex-col w-[260px] p-0 bg-white z-50">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 pt-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              SabiOps
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${
                    location.pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
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

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-muted/40 md:block fixed left-0 top-0 z-30 h-full w-64 bg-white">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">S</span>
              </div>
              <span className="">SabiOps SME</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                      location.pathname === item.href
                        ? 'bg-muted text-primary'
                        : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 px-2 lg:px-4">
              <a
                href="https://wa.me/2348158025887"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-900 transition-all shadow-sm"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:ml-64">
        <main className="flex-1 pt-14 lg:pt-[60px] py-4 md:py-6">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

