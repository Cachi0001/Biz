import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationCenter from './NotificationCenter';
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

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const markNotificationsAsRead = () => {
    setUnreadCount(0);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Sales Report', href: '/sales/report', icon: TrendingUp },
    { name: 'Transactions', href: '/transactions', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">B</span>
              </div>
              Bizflow
            </Link>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${
                    location.pathname === item.href
                      ? 'bg-muted text-foreground'
                      : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden border-r bg-muted/40 md:block fixed left-0 top-0 z-30 h-full w-64">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">B</span>
              </div>
              <span className="">Bizflow SME</span>
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
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:ml-64">
        {/* Header */}
        <div className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3 h-9 rounded-md border border-input px-3 py-1 text-sm"
                />
              </div>
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </Button>
            </div>

            {/* Notifications */}
            <NotificationCenter />

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
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

        {/* Page Content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;