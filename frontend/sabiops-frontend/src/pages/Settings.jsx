import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Plus,
  Edit,
  Trash2,
  User,
  Settings as SettingsIcon,
  Users,
  Bell,
  Shield,
  CreditCard,
  Building,
  Mail,
  Phone,
  MapPin,
  Save,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, updateProfile, put } from "../services/api";

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    business_name: user?.business_name || '',
    business_email: user?.business_email || '',
    business_phone: user?.business_phone || '',
    business_address: user?.business_address || '',
    business_description: '',
    business_website: ''
  });

  // Team Member Form State
  const [newTeamMember, setNewTeamMember] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'salesperson',
    permissions: {
      can_create_sales: true,
      can_view_customers: true,
      can_create_customers: false,
      can_view_products: true,
      can_create_products: false,
      can_view_reports: false,
      can_manage_team: false
    }
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    low_stock_alerts: true,
    payment_reminders: true,
    sales_reports: true,
    new_customer_alerts: false
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await getTeamMembers();
      setTeamMembers(response.team_members || response || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamMember = async () => {
    try {
      setLoading(true);
      const response = await createTeamMember(newTeamMember);
      
      // Add the new team member to the list
      setTeamMembers(prev => [...prev, response.team_member || response]);
      
      // Reset form and close dialog
      setNewTeamMember({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'salesperson',
        permissions: {
          can_create_sales: true,
          can_view_customers: true,
          can_create_customers: false,
          can_view_products: true,
          can_create_products: false,
          can_view_reports: false,
          can_manage_team: false
        }
      });
      setShowAddTeamDialog(false);
    } catch (error) {
      console.error('Failed to create team member:', error);
      alert('Failed to create team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeamMember = async () => {
    try {
      setLoading(true);
      const response = await updateTeamMember(editingMember.id, editingMember);
      
      // Update the team member in the list
      setTeamMembers(prev => 
        prev.map(member => 
          member.id === editingMember.id ? (response.team_member || response) : member
        )
      );
      
      setShowEditDialog(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update team member:', error);
      alert('Failed to update team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeamMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await deleteTeamMember(memberId);
        setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      } catch (error) {
        console.error('Failed to delete team member:', error);
        alert('Failed to remove team member. Please try again.');
      }
    }
  };

  const handleBusinessProfileUpdate = async () => {
    try {
      setLoading(true);
      // Update business profile via API
      await updateProfile(businessProfile);
      alert('Business profile updated successfully!');
    } catch (error) {
      console.error('Failed to update business profile:', error);
      alert('Failed to update business profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    try {
      setLoading(true);
      // Update notification settings via API
      // Assuming there's an endpoint for notification settings update, using generic 'put' for now
      await put('/users/notifications', notificationSettings);
      alert('Notification settings updated successfully!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      alert('Failed to update notification settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'salesperson': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your business settings and team</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Profile
              </CardTitle>
              <CardDescription>
                Update your business information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={businessProfile.business_name}
                    onChange={(e) => setBusinessProfile(prev => ({
                      ...prev,
                      business_name: e.target.value
                    }))}
                    placeholder="Enter business name"
                  />
                </div>
                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    value={businessProfile.business_email}
                    onChange={(e) => setBusinessProfile(prev => ({
                      ...prev,
                      business_email: e.target.value
                    }))}
                    placeholder="business@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    value={businessProfile.business_phone}
                    onChange={(e) => setBusinessProfile(prev => ({
                      ...prev,
                      business_phone: e.target.value
                    }))}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="business_website">Website (Optional)</Label>
                  <Input
                    id="business_website"
                    value={businessProfile.business_website}
                    onChange={(e) => setBusinessProfile(prev => ({
                      ...prev,
                      business_website: e.target.value
                    }))}
                    placeholder="https://www.yourbusiness.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  value={businessProfile.business_address}
                  onChange={(e) => setBusinessProfile(prev => ({
                    ...prev,
                    business_address: e.target.value
                  }))}
                  placeholder="Enter complete business address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="business_description">Business Description</Label>
                <Textarea
                  id="business_description"
                  value={businessProfile.business_description}
                  onChange={(e) => setBusinessProfile(prev => ({
                    ...prev,
                    business_description: e.target.value
                  }))}
                  placeholder="Describe your business and services"
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleBusinessProfileUpdate} 
                disabled={loading}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Business Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Management
                  </CardTitle>
                  <CardDescription>
                    Manage your sales team and their permissions
                  </CardDescription>
                </div>
                <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Team Member</DialogTitle>
                      <DialogDescription>
                        Create a new salesperson account for your team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={newTeamMember.first_name}
                            onChange={(e) => setNewTeamMember(prev => ({
                              ...prev,
                              first_name: e.target.value
                            }))}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={newTeamMember.last_name}
                            onChange={(e) => setNewTeamMember(prev => ({
                              ...prev,
                              last_name: e.target.value
                            }))}
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newTeamMember.email}
                            onChange={(e) => setNewTeamMember(prev => ({
                              ...prev,
                              email: e.target.value
                            }))}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newTeamMember.phone}
                            onChange={(e) => setNewTeamMember(prev => ({
                              ...prev,
                              phone: e.target.value
                            }))}
                            placeholder="+234 xxx xxx xxxx"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select 
                          value={newTeamMember.role} 
                          onValueChange={(value) => setNewTeamMember(prev => ({
                            ...prev,
                            role: value
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salesperson">Salesperson</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowAddTeamDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateTeamMember}
                          disabled={loading || !newTeamMember.first_name || !newTeamMember.email}
                        >
                          {loading ? 'Creating...' : 'Create Team Member'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-600 mb-4">Start building your sales team by adding your first team member.</p>
                  <Button onClick={() => setShowAddTeamDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Team Member
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMember(member);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTeamMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                        {key === 'sms_notifications' && 'Receive notifications via SMS'}
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

        {/* Subscription Tab */}
        <TabsContent value="subscription">
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
                  You are currently on the <strong>7-Day Free Trial</strong>. 
                  Upgrade to a paid plan to continue using all features after your trial expires.
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
                      <Button className="w-full mt-4">Upgrade Now</Button>
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
                      <Button variant="outline" className="w-full mt-4">Upgrade Now</Button>
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
                      <Button variant="outline" className="w-full mt-4">Upgrade Now</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;


