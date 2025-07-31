import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import RealTimeUsageCards from '../components/subscription/RealTimeUsageCards';
import UnifiedSubscriptionStatus from '../components/subscription/UnifiedSubscriptionStatus';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import {
  User,
  Building2,
  Mail,
  Phone,
  Crown,
  Shield,
  Settings as SettingsIcon,
  Bell,
  Lock,
  CreditCard,
  Users,
  BarChart3,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const FixedSettings = () => {
  const { user, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        business_name: user.business_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setSubscriptionLoading(true);
      const response = await fetch('/api/subscription/unified-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
          variant: "success"
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle subscription upgrade navigation
  const handleUpgradeSubscription = () => {
    navigate('/subscription-upgrade');
  };

  // Handle team management navigation
  const handleTeamManagement = () => {
    navigate('/team');
  };

  // Handle analytics navigation
  const handleAnalytics = () => {
    if (user?.subscription_plan === 'free') {
      toast({
        title: "Upgrade Required",
        description: "Analytics is available for premium subscribers only.",
        variant: "destructive"
      });
      return;
    }
    navigate('/analytics');
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">
                Manage your account, subscription, and preferences
              </p>
            </div>
          </div>
          <Badge className={getRoleBadgeColor(user?.role)}>
            <Shield className="h-3 w-3 mr-1" />
            {user?.role}
          </Badge>
        </div>

        {/* Subscription Status - Only for Owners */}
        {isOwner && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription Management</h2>
            </div>
            
            <UnifiedSubscriptionStatus onUpgrade={handleUpgradeSubscription} />
            
            {/* Real-time Usage Cards */}
            <RealTimeUsageCards />
          </div>
        )}

        {/* Team Member Subscription Info */}
        {!isOwner && subscriptionData && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Team Member Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-blue-700">
                  You have access to <strong>{subscriptionData.plan_config?.name || 'Current Plan'}</strong> features 
                  through your business owner's subscription.
                </p>
                <div className="flex items-center space-x-4 text-xs text-blue-600">
                  <span>Plan: {subscriptionData.subscription_plan}</span>
                  <span>Status: {subscriptionData.unified_status}</span>
                  {subscriptionData.remaining_days >= 0 && (
                    <span>Days left: {subscriptionData.remaining_days}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    placeholder="Enter your business name"
                    disabled={!isOwner}
                  />
                  {!isOwner && (
                    <p className="text-xs text-gray-500">
                      Only business owners can modify the business name
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions - Owner Only */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={handleUpgradeSubscription}
                  className="flex items-center justify-center space-x-2 h-16"
                >
                  <CreditCard className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Manage Subscription</div>
                    <div className="text-xs text-gray-500">Upgrade or change plan</div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleTeamManagement}
                  className="flex items-center justify-center space-x-2 h-16"
                >
                  <Users className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Team Management</div>
                    <div className="text-xs text-gray-500">Add or manage team members</div>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleAnalytics}
                  className="flex items-center justify-center space-x-2 h-16"
                  disabled={user?.subscription_plan === 'free'}
                >
                  <BarChart3 className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-gray-500">
                      {user?.subscription_plan === 'free' ? 'Premium feature' : 'View detailed reports'}
                    </div>
                  </div>
                  {user?.subscription_plan !== 'free' && <ExternalLink className="h-4 w-4" />}
                  {user?.subscription_plan === 'free' && <Crown className="h-4 w-4 text-yellow-500" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Account Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Email Verified</div>
                    <div className="text-sm text-gray-500">Your email address is verified</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-gray-500">Change your account password</div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Owner Only */}
        {isOwner && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-700">Delete Account</div>
                      <div className="text-sm text-red-600">
                        Permanently delete your account and all associated data
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FixedSettings;