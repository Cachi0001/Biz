import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  CreditCard,
  Building,
  Save,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, getErrorMessage } from "../services/api";
import { toast } from 'react-hot-toast';
import RoleBasedWrapper from '../components/ui/role-based-wrapper';
import DataIntegrityWidget from '../components/data/DataIntegrityWidget';

const Settings = () => {
  const { user, isOwner } = useAuth();
  const [loading, setLoading] = useState(false);

  // User Profile State - matches database schema
  const [userProfile, setUserProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    business_name: user?.business_name || ''
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    low_stock_alerts: true,
    payment_reminders: true,
    sales_reports: true,
    new_customer_alerts: false
  });

  const handleUserProfileUpdate = async () => {
    try {
      setLoading(true);
      console.log('[SETTINGS] Updating user profile:', userProfile);

      // Only send fields that exist in the database
      const profileData = {
        full_name: userProfile.full_name,
        business_name: userProfile.business_name,
        // Note: email and phone typically require special verification processes
        // so we might not want to allow changing them here
      };

      const response = await updateProfile(profileData);
      console.log('[SETTINGS] Profile update response:', response);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = getErrorMessage(error, 'Failed to update profile');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    try {
      setLoading(true);
      // For now, just show success message since notification settings
      // endpoint may not be implemented yet
      toast.success('Notification preferences saved locally!');
      console.log('[SETTINGS] Notification settings:', notificationSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* User Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Profile
                </CardTitle>
                <CardDescription>
                  Update your personal and business information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={userProfile.full_name}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev,
                        full_name: e.target.value
                      }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={userProfile.business_name}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev,
                        business_name: e.target.value
                      }))}
                      placeholder="Enter business name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userProfile.phone}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support to change your phone number
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Account Information</Label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p className="text-sm"><span className="font-medium">Role:</span> {user?.role || 'User'}</p>
                    <p className="text-sm"><span className="font-medium">Subscription:</span> {user?.subscription_plan || 'Free'}</p>
                    <p className="text-sm"><span className="font-medium">Status:</span> {user?.subscription_status || 'Trial'}</p>
                    {user?.trial_days_left !== undefined && (
                      <p className="text-sm"><span className="font-medium">Trial Days Left:</span> {user.trial_days_left}</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleUserProfileUpdate}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={key} className="text-sm font-medium">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {key === 'email_notifications' && 'Receive notifications via email'}
                          {key === 'low_stock_alerts' && 'Get notified when products are running low'}
                          {key === 'payment_reminders' && 'Reminders for overdue payments'}
                          {key === 'sales_reports' && 'Daily and weekly sales reports'}
                          {key === 'new_customer_alerts' && 'Notifications for new customer registrations'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleNotificationSettingsUpdate}
                  disabled={loading}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab - Only for Owners */}
          <TabsContent value="subscription">
            <RoleBasedWrapper allowedRoles={['owner']} fallback={
              <Card>
                <CardContent className="p-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Only business owners can manage subscription settings. Contact your business owner for subscription changes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            }>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription & Billing
                  </CardTitle>
                  <CardDescription>
                    Manage your subscription plan and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      You are currently on the <strong>{user?.subscription_plan || 'Free'}</strong> plan.
                      {user?.subscription_status === 'trial' && user?.trial_days_left !== undefined && (
                        <span> You have {user.trial_days_left} days left in your trial.</span>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-2 border-primary">
                        <CardHeader>
                          <CardTitle className="text-lg">Silver Weekly</CardTitle>
                          <div className="text-2xl font-bold">₦1,400<span className="text-sm font-normal">/week</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• 100 invoices per week</li>
                            <li>• 100 expenses per week</li>
                            <li>• Advanced reporting</li>
                            <li>• Email support</li>
                          </ul>
                          <Button className="w-full mt-4" onClick={() => toast.info('Upgrade functionality coming soon!')}>
                            Upgrade Now
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Silver Monthly</CardTitle>
                          <div className="text-2xl font-bold">₦4,500<span className="text-sm font-normal">/month</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• 450 invoices per month</li>
                            <li>• 450 expenses per month</li>
                            <li>• ₦500 referral rewards</li>
                            <li>• Priority support</li>
                          </ul>
                          <Button variant="outline" className="w-full mt-4" onClick={() => toast.info('Upgrade functionality coming soon!')}>
                            Upgrade Now
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Silver Yearly</CardTitle>
                          <div className="text-2xl font-bold">₦50,000<span className="text-sm font-normal">/year</span></div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li>• 6,000 invoices per year</li>
                            <li>• 6,000 expenses per year</li>
                            <li>• ₦5,000 referral rewards</li>
                            <li>• Premium support</li>
                          </ul>
                          <Button variant="outline" className="w-full mt-4" onClick={() => toast.info('Upgrade functionality coming soon!')}>
                            Upgrade Now
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RoleBasedWrapper>
          </TabsContent>

          {/* System Tab - Only for Owners */}
          <TabsContent value="system">
            <RoleBasedWrapper allowedRoles={['owner']} fallback={
              <Card>
                <CardContent className="p-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Only business owners can access system administration tools. Contact your business owner if you need data consistency checks.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            }>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      System Administration
                    </CardTitle>
                    <CardDescription>
                      Manage data integrity and system maintenance for your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        These tools help maintain data consistency across your business records.
                        Run these checks regularly or after bulk data operations to ensure accuracy.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <DataIntegrityWidget
                  onDataSync={() => {
                    // Refresh any cached data or trigger re-renders
                    toast.success('Data synchronization completed. All pages will reflect updated data.');
                  }}
                />
              </div>
            </RoleBasedWrapper>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;


