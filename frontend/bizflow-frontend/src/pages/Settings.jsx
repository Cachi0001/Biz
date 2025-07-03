import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User,
  Building,
  CreditCard,
  Bell,
  Shield,
  Users,
  Gift,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    low_stock_alerts: true,
    payment_reminders: true,
    invoice_updates: true,
    trial_reminders: true
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        business_name: user.business_name || '',
        business_type: user.business_type || '',
        business_address: user.business_address || '',
        business_phone: user.business_phone || '',
        business_email: user.business_email || ''
      });
    }
    fetchSubscriptionData();
    fetchReferralData();
    fetchTeamMembers();
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await apiService.getSubscriptionStatus();
      setSubscriptionData(response);
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
      // Don't redirect on error, just set default data
      setSubscriptionData({
        subscription_plan: user?.subscription_plan || 'free',
        subscription_status: user?.subscription_status || 'active',
        is_trial_active: user?.is_trial_active || false
      });
    }
  };

  const fetchReferralData = async () => {
    try {
      const response = await apiService.getReferrals();
      setReferralData(response);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      // Set default referral data from user object
      setReferralData({
        referral_earnings: user?.referral_earnings || 0,
        total_referrals: user?.total_referrals || 0,
        total_withdrawn: user?.total_withdrawn || 0
      });
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await apiService.getTeamMembers();
      setTeamMembers(response.team_members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      // Set empty array as default
      setTeamMembers([]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(profileForm);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await apiService.changePassword(passwordForm);
      toast.success('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error('Failed to change password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const getTrialDaysRemaining = () => {
    if (!user?.trial_end_date) return 0;
    const endDate = new Date(user.trial_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getSubscriptionStatusBadge = () => {
    if (!subscriptionData) return null;
    
    const { subscription_plan, subscription_status, is_trial_active } = subscriptionData;
    
    if (is_trial_active) {
      const daysLeft = getTrialDaysRemaining();
      return (
        <Badge variant={daysLeft > 3 ? "default" : "destructive"}>
          Trial - {daysLeft} days left
        </Badge>
      );
    }
    
    const statusColors = {
      active: "default",
      expired: "destructive",
      cancelled: "secondary"
    };
    
    return (
      <Badge variant={statusColors[subscription_status] || "secondary"}>
        {subscription_plan} - {subscription_status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    required
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Configure your business details for invoices and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={profileForm.business_name}
                    onChange={(e) => setProfileForm({...profileForm, business_name: e.target.value})}
                    placeholder="Your Business Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select
                    value={profileForm.business_type}
                    onValueChange={(value) => setProfileForm({...profileForm, business_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={profileForm.business_address}
                    onChange={(e) => setProfileForm({...profileForm, business_address: e.target.value})}
                    placeholder="Your business address"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Business Phone</Label>
                    <Input
                      id="business_phone"
                      value={profileForm.business_phone}
                      onChange={(e) => setProfileForm({...profileForm, business_phone: e.target.value})}
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_email">Business Email</Label>
                    <Input
                      id="business_email"
                      type="email"
                      value={profileForm.business_email}
                      onChange={(e) => setProfileForm({...profileForm, business_email: e.target.value})}
                      placeholder="business@example.com"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Business Info'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Settings */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Status
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.subscription_plan || 'Free'}
                  </p>
                </div>
                {getSubscriptionStatusBadge()}
              </div>
              
              {user?.is_trial_active && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your free trial expires in {getTrialDaysRemaining()} days. 
                    Upgrade now to continue using all features.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Free Plan */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Free Plan</CardTitle>
                    <div className="text-2xl font-bold">₦0<span className="text-sm font-normal">/month</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• 5 invoices/month</li>
                      <li>• 5 expenses/month</li>
                      <li>• Basic reporting</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      {user?.subscription_plan === 'free' && !user?.is_trial_active ? 'Current Plan' : 'Downgrade'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Silver Weekly Plan */}
                <Card className="border-2 border-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Silver Weekly</CardTitle>
                    <div className="text-2xl font-bold">₦1,400<span className="text-sm font-normal">/week</span></div>
                    {user?.is_trial_active && <Badge className="bg-green-100 text-green-800">7-Day Free Trial</Badge>}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• 100 invoices/week</li>
                      <li>• 100 expenses/week</li>
                      <li>• Unlimited clients</li>
                      <li>• Advanced reporting</li>
                      <li>• Sales report downloads</li>
                      <li>• Team management</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      {user?.is_trial_active ? 'Current Trial (Weekly Features)' : 
                       user?.subscription_plan === 'weekly' ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg">Silver Monthly</CardTitle>
                    <div className="text-2xl font-bold">₦4,500<span className="text-sm font-normal">/month</span></div>
                    <Badge>Most Popular</Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• 450 invoices/month</li>
                      <li>• 450 expenses/month</li>
                      <li>• Unlimited clients</li>
                      <li>• Advanced reporting</li>
                      <li>• Sales report downloads</li>
                      <li>• Team management</li>
                      <li>• ₦500 referral rewards</li>
                    </ul>
                    <Button className="w-full mt-4">
                      {user?.subscription_plan === 'monthly' ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Silver Yearly</CardTitle>
                    <div className="text-2xl font-bold">₦50,000<span className="text-sm font-normal">/year</span></div>
                    <Badge variant="secondary">Best Value</Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• 6,000 invoices/year</li>
                      <li>• 6,000 expenses/year</li>
                      <li>• Unlimited clients</li>
                      <li>• Advanced reporting</li>
                      <li>• Sales report downloads</li>
                      <li>• Team management</li>
                      <li>• Priority support</li>
                      <li>• ₦5,000 referral rewards</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      {user?.subscription_plan === 'yearly' ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Settings */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Referral Program
              </CardTitle>
              <CardDescription>
                Earn 10% commission on referrals. Share your code and earn money!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">₦{user?.referral_earnings?.toFixed(2) || '0.00'}</div>
                      <p className="text-sm text-muted-foreground">Available Earnings</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{user?.total_referrals || 0}</div>
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">₦{user?.total_withdrawn?.toFixed(2) || '0.00'}</div>
                      <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Your Referral Code</Label>
                  <div className="flex gap-2">
                    <Input value={user?.referral_code || ''} readOnly />
                    <Button variant="outline" size="icon" onClick={copyReferralCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Referral Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={`${window.location.origin}/register?ref=${user?.referral_code || ''}`} 
                      readOnly 
                    />
                    <Button variant="outline" size="icon" onClick={copyReferralLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {user?.referral_earnings >= 3000 && (
                  <Button className="w-full">
                    Request Withdrawal (Min. ₦3,000)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage your team members and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.subscription_plan !== 'free' || user?.is_trial_active ? (
                <div className="space-y-4">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                  
                  {teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{member.first_name} {member.last_name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No team members added yet.</p>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Team management is available with paid plans (Weekly, Monthly, or Yearly). 
                    {user?.is_trial_active ? 
                      'You can use this feature during your trial period.' : 
                      <Button variant="link" className="p-0 h-auto">Upgrade now</Button>
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key} className="text-sm font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'email_notifications' && 'Receive general email notifications'}
                      {key === 'low_stock_alerts' && 'Get notified when products are low in stock'}
                      {key === 'payment_reminders' && 'Receive payment reminder notifications'}
                      {key === 'invoice_updates' && 'Get notified about invoice status changes'}
                      {key === 'trial_reminders' && 'Receive trial expiration reminders'}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, [key]: checked})
                    }
                  />
                </div>
              ))}
              
              <Button>Save Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;