import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import {
  Menu,
  X,
  LogOut,
  Search,
  Twitter,
  MessageCircle,
  BarChart3,
  History,
  Crown,
  Bed
} from 'lucide-react';

const ModernHeader = () => {
  const { user, logout, subscription, role } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTwitterClick = () => {
    window.open('https://x.com/Caleb0533', '_blank');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/2348158025887', '_blank');
  };

  const handleAnalyticsClick = () => {
    if (user?.subscription_plan === 'free') {
      alert('Upgrade to access advanced analytics');
      return;
    }
    navigate('/analytics');
  };

  const handleTransactionsClick = () => {
    if (user?.subscription_plan === 'free') {
      alert('Upgrade to access transaction history');
      return;
    }
    navigate('/transactions');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="bg-green-500 border-b border-green-400 sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-300 rounded-lg flex items-center justify-center">
              <span className="text-green-900 font-bold text-sm">S</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white">SabiOps</h1>
              <p className="text-xs text-green-200">Business Dashboard</p>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile for free plan */}
          {user?.subscription_plan !== 'free' && (
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-200" />
                <input
                  type="search"
                  placeholder="Search customers, products, invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-green-600/50 text-white pl-10 pr-4 py-2 rounded-lg border border-green-400/30 placeholder:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Analytics & Transactions for Desktop - Paid Plans */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyticsClick}
                className={`text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1 ${
                  user?.subscription_plan === 'free' ? 'opacity-60' : ''
                }`}
                title={user?.subscription_plan === 'free' ? 'Upgrade to access Analytics' : 'Advanced Analytics'}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Analytics</span>
                {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-1" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTransactionsClick}
                className={`text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1 ${
                  user?.subscription_plan === 'free' ? 'opacity-60' : ''
                }`}
                title={user?.subscription_plan === 'free' ? 'Upgrade to access Transactions' : 'Transaction History'}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Transactions</span>
                {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-1" />}
              </Button>
            </div>

            {/* Social Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTwitterClick}
                className="text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1"
                title="Follow our CEO"
              >
                <Bed className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Follow our CEO</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWhatsAppClick}
                className="text-white hover:text-green-100 hover:bg-green-600"
                title="Contact us for feedback"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>

            {/* Logout - Desktop */}
            <div className="hidden md:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </div>

            {/* Notifications */}
            <div className="hidden md:block">
              <NotificationCenter />
            </div>

            {/* Trial Indicator */}
            {user?.subscription_status === 'trial' && (
              <div className="flex items-center space-x-1 bg-yellow-500 px-2 py-1 rounded-full">
                <Crown className="h-3 w-3 text-yellow-900" />
                <span className="text-xs font-medium text-yellow-900">
                  {user?.trial_days_left || 0} days
                </span>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-green-600">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-green-500 border-green-400">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Menu</h2>
                  <SheetClose asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-green-600">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="space-y-4">
                  {/* Search Bar - Only for paid plans */}
                  {user?.subscription_plan !== 'free' && (
                    <div className="w-full">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-200" />
                        <input
                          type="search"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-green-600/50 text-white pl-10 pr-4 py-2 rounded-lg border border-green-400/30 placeholder:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Reports & Analytics for Mobile */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-green-100">Reports & Analytics</h3>
                    <Button
                      variant="ghost"
                      onClick={handleAnalyticsClick}
                      className={`w-full justify-start text-white hover:text-green-100 hover:bg-green-600 ${
                        user?.subscription_plan === 'free' ? 'opacity-60' : ''
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Advanced Analytics
                      {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-auto" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleTransactionsClick}
                      className={`w-full justify-start text-white hover:text-green-100 hover:bg-green-600 ${
                        user?.subscription_plan === 'free' ? 'opacity-60' : ''
                      }`}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Transaction History
                      {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-auto" />}
                    </Button>
                  </div>
                  
                  {/* Social Links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-green-100">Connect</h3>
                    <Button
                      variant="ghost"
                      onClick={handleTwitterClick}
                      className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                    >
                      <Bed className="h-4 w-4 mr-2" />
                      Follow our CEO
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleWhatsAppClick}
                      className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                  
                  {/* Logout */}
                  <div className="pt-2 border-t border-green-400">
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                  
                  {/* Notifications */}
                  <div className="pt-2 border-t border-green-400">
                    <NotificationCenter />
                  </div>
                  
                  {/* User Info */}
                  <div className="pt-2 border-t border-green-400">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{user?.full_name}</p>
                      <p className="text-xs text-green-200">{role}</p>
                      {user?.subscription_plan && (
                        <p className="text-xs text-green-300 capitalize">
                          {user.subscription_plan === 'free' ? 'Free Plan' : `${user.subscription_plan} Plan`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Good {getGreeting()}, {user?.full_name?.split(' ')[0]}!
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-green-100">Business at a glance</span>
                <span className="w-1 h-1 bg-green-200 rounded-full hidden sm:block"></span>
                <span className="text-xs bg-green-600 text-green-100 px-2 py-0.5 rounded-full">
                  {role}
                </span>
                {user?.subscription_plan === 'free' && (
                  <>
                    <span className="w-1 h-1 bg-green-200 rounded-full hidden sm:block"></span>
                    <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Free Plan
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {user?.subscription_plan === 'free' && role === 'Owner' && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg mt-2 sm:mt-0"
              >
                <Crown className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Upgrade Now</span>
                <span className="sm:hidden">Upgrade</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search - Only for paid plans */}
        {user?.subscription_plan !== 'free' && (
          <div className="md:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-200" />
              <input
                type="search"
                placeholder="Search customers, products, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-green-600/50 text-white pl-10 pr-4 py-2 rounded-lg border border-green-400/30 placeholder:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ModernHeader };
export default ModernHeader;