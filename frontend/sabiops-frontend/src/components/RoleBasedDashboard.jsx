import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimitContext } from '../contexts/PlanLimitContext';
import { Crown, AlertTriangle, TrendingUp, Users, Package, FileText, DollarSign, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { toast } from 'react-hot-toast';

const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const { planLimits, usage, checkLimit } = usePlanLimitContext();
  const navigate = useNavigate();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/dashboard/financials');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const isOwner = user?.role === 'Owner' || user?.role === 'owner';
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';
  const isSalesperson = user?.role === 'Salesperson' || user?.role === 'salesperson';
  
  const isTrialUser = user?.subscription_status === 'trial';
  const isFreePlan = user?.subscription_plan === 'free';
  const isWeeklyPlan = user?.subscription_plan === 'weekly';
  
  const showCrown = isOwner && isWeeklyPlan && isTrialUser;
  const showUpgradePrompts = isOwner && (isFreePlan || checkLimit('invoices') > 0.8);

  const getTrialDaysLeft = () => {
    if (!user?.trial_ends_at) return 0;
    const trialEnd = new Date(user.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysLeft = getTrialDaysLeft();

  if (loading) {
    return (
      <div className=\"flex items-center justify-center min-h-screen\">
        <div className=\"animate-spin rounded-full h-32 w-32 border-b-2 border-green-600\"></div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-green-50 p-4 md:p-6\">
      {/* Header Section */}
      <div className=\"mb-6\">
        <div className=\"flex items-center justify-between mb-4\">
          <div className=\"flex items-center space-x-3\">
            <h1 className=\"text-2xl md:text-3xl font-bold text-green-900\">
              Welcome back, {user?.full_name}
            </h1>
            {showCrown && (
              <div className=\"flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full\">
                <Crown className=\"w-5 h-5 text-yellow-600\" />
                <span className=\"text-sm font-medium text-yellow-800\">
                  Trial: {trialDaysLeft} days left
                </span>
              </div>
            )}
          </div>
          
          {/* Social Links */}
          <div className=\"flex items-center space-x-2\">
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => window.open('https://x.com/Caleb0533', '_blank')}
              className=\"text-blue-600 hover:text-blue-700\"
            >
              Follow CEO
            </Button>
            <Button
              variant=\"ghost\"
              size=\"sm\"
              onClick={() => window.open('https://wa.me/2348158025887', '_blank')}
              className=\"text-green-600 hover:text-green-700\"
            >
              Contact Support
            </Button>
          </div>
        </div>

        {/* Role Badge */}
        <div className=\"flex items-center space-x-2 mb-4\">
          <Badge variant=\"outline\" className=\"bg-green-100 text-green-800 border-green-300\">
            {user?.role}
          </Badge>
          <Badge variant=\"outline\" className=\"bg-blue-100 text-blue-800 border-blue-300\">
            {user?.subscription_plan?.charAt(0).toUpperCase() + user?.subscription_plan?.slice(1)} Plan
          </Badge>
        </div>

        {/* Upgrade Prompts */}
        {showUpgradePrompts && (
          <Alert className=\"mb-4 border-orange-200 bg-orange-50\">
            <AlertTriangle className=\"h-4 w-4 text-orange-600\" />
            <AlertDescription className=\"text-orange-800\">
              {isFreePlan 
                ? \"You're on the free plan. Upgrade to unlock unlimited features!\"
                : \"You're approaching your plan limits. Consider upgrading for unlimited access.\"
              }
              <Button 
                variant=\"link\" 
                className=\"ml-2 text-orange-600 hover:text-orange-700 p-0\"
                onClick={() => navigate('/pricing')}
              >
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Dashboard Content Based on Role */}
      {isOwner && <OwnerDashboard data={dashboardData} />}
      {isAdmin && <AdminDashboard data={dashboardData} />}
      {isSalesperson && <SalespersonDashboard data={dashboardData} />}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className=\"mt-6 border-green-200\">
          <CardHeader>
            <CardTitle className=\"flex items-center text-green-900\">
              <Bell className=\"w-5 h-5 mr-2\" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-2\">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className=\"flex items-start justify-between\">
                    <div>
                      <p className=\"font-medium text-gray-900\">{notification.title}</p>
                      <p className=\"text-sm text-gray-600\">{notification.message}</p>
                    </div>
                    <span className=\"text-xs text-gray-500\">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Owner Dashboard Component
const OwnerDashboard = ({ data }) => {
  const navigate = useNavigate();
  
  return (
    <div className=\"space-y-6\">
      {/* Financial Overview Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
        <MetricCard
          title=\"Total Revenue\"
          value={`₦${data?.revenue?.total?.toLocaleString() || '0'}`}
          change=\"+12% from last month\"
          icon={<TrendingUp className=\"w-6 h-6 text-green-600\" />}
          bgColor=\"bg-green-50\"
          borderColor=\"border-green-200\"
        />
        
        <MetricCard
          title=\"Net Profit\"
          value={`₦${data?.net_profit?.total?.toLocaleString() || '0'}`}
          change=\"+8% from last month\"
          icon={<DollarSign className=\"w-6 h-6 text-blue-600\" />}
          bgColor=\"bg-blue-50\"
          borderColor=\"border-blue-200\"
        />
        
        <MetricCard
          title=\"Total Customers\"
          value={data?.customers?.total || '0'}
          change={`+${data?.customers?.new_this_month || 0} this month`}
          icon={<Users className=\"w-6 h-6 text-purple-600\" />}
          bgColor=\"bg-purple-50\"
          borderColor=\"border-purple-200\"
        />
        
        <MetricCard
          title=\"Products\"
          value={data?.products?.total || '0'}
          change={`${data?.low_stock?.length || 0} low stock`}
          icon={<Package className=\"w-6 h-6 text-orange-600\" />}
          bgColor=\"bg-orange-50\"
          borderColor=\"border-orange-200\"
        />
      </div>

      {/* Quick Actions */}
      <Card className=\"border-green-200\">
        <CardHeader>
          <CardTitle className=\"text-green-900\">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
            <QuickActionButton
              title=\"New Invoice\"
              icon={<FileText className=\"w-5 h-5\" />}
              onClick={() => navigate('/invoices/new')}
            />
            <QuickActionButton
              title=\"Add Customer\"
              icon={<Users className=\"w-5 h-5\" />}
              onClick={() => navigate('/customers/new')}
            />
            <QuickActionButton
              title=\"Add Product\"
              icon={<Package className=\"w-5 h-5\" />}
              onClick={() => navigate('/products/new')}
            />
            <QuickActionButton
              title=\"View Analytics\"
              icon={<TrendingUp className=\"w-5 h-5\" />}
              onClick={() => navigate('/analytics')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Owner-specific sections */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Team Management */}
        <Card className=\"border-green-200\">
          <CardHeader>
            <CardTitle className=\"text-green-900\">Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-2\">
              <p className=\"text-sm text-gray-600\">
                Active team members: {data?.team?.active_count || 0}
              </p>
              <Button 
                variant=\"outline\" 
                size=\"sm\"
                onClick={() => navigate('/team')}
                className=\"border-green-300 text-green-700 hover:bg-green-50\"
              >
                Manage Team
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Earnings */}
        <Card className=\"border-green-200\">
          <CardHeader>
            <CardTitle className=\"text-green-900\">Referral Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-2\">
              <p className=\"text-lg font-semibold text-green-700\">
                ₦{data?.referral_earnings?.total_earnings?.toLocaleString() || '0'}
              </p>
              <p className=\"text-sm text-gray-600\">
                Available for withdrawal: ₦{data?.referral_earnings?.available_for_withdrawal?.toLocaleString() || '0'}
              </p>
              <Button 
                variant=\"outline\" 
                size=\"sm\"
                onClick={() => navigate('/referrals')}
                className=\"border-green-300 text-green-700 hover:bg-green-50\"
              >
                View Referrals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ data }) => {
  const navigate = useNavigate();
  
  return (
    <div className=\"space-y-6\">
      {/* Operational Metrics */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
        <MetricCard
          title=\"Monthly Revenue\"
          value={`₦${data?.revenue?.this_month?.toLocaleString() || '0'}`}
          change=\"Operational view\"
          icon={<TrendingUp className=\"w-6 h-6 text-green-600\" />}
          bgColor=\"bg-green-50\"
          borderColor=\"border-green-200\"
        />
        
        <MetricCard
          title=\"Total Expenses\"
          value={`₦${data?.expenses?.this_month?.toLocaleString() || '0'}`}
          change=\"This month\"
          icon={<DollarSign className=\"w-6 h-6 text-red-600\" />}
          bgColor=\"bg-red-50\"
          borderColor=\"border-red-200\"
        />
        
        <MetricCard
          title=\"Inventory Value\"
          value={`₦${data?.inventory_value?.toLocaleString() || '0'}`}
          change={`${data?.low_stock?.length || 0} items low`}
          icon={<Package className=\"w-6 h-6 text-orange-600\" />}
          bgColor=\"bg-orange-50\"
          borderColor=\"border-orange-200\"
        />
      </div>

      {/* Admin Quick Actions */}
      <Card className=\"border-green-200\">
        <CardHeader>
          <CardTitle className=\"text-green-900\">Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 md:grid-cols-3 gap-4\">
            <QuickActionButton
              title=\"Manage Products\"
              icon={<Package className=\"w-5 h-5\" />}
              onClick={() => navigate('/products')}
            />
            <QuickActionButton
              title=\"View Customers\"
              icon={<Users className=\"w-5 h-5\" />}
              onClick={() => navigate('/customers')}
            />
            <QuickActionButton
              title=\"Sales Reports\"
              icon={<TrendingUp className=\"w-5 h-5\" />}
              onClick={() => navigate('/sales')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Salesperson Dashboard Component
const SalespersonDashboard = ({ data }) => {
  const navigate = useNavigate();
  
  return (
    <div className=\"space-y-6\">
      {/* Sales Metrics */}
      <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
        <MetricCard
          title=\"My Sales Today\"
          value={`₦${data?.sales?.today?.toLocaleString() || '0'}`}
          change=\"Today's performance\"
          icon={<TrendingUp className=\"w-6 h-6 text-green-600\" />}
          bgColor=\"bg-green-50\"
          borderColor=\"border-green-200\"
        />
        
        <MetricCard
          title=\"Total Sales\"
          value={`₦${data?.sales?.total?.toLocaleString() || '0'}`}
          change=\"All time\"
          icon={<DollarSign className=\"w-6 h-6 text-blue-600\" />}
          bgColor=\"bg-blue-50\"
          borderColor=\"border-blue-200\"
        />
        
        <MetricCard
          title=\"Customers Served\"
          value={data?.customers?.served || '0'}
          change=\"This month\"
          icon={<Users className=\"w-6 h-6 text-purple-600\" />}
          bgColor=\"bg-purple-50\"
          borderColor=\"border-purple-200\"
        />
      </div>

      {/* Sales Actions */}
      <Card className=\"border-green-200\">
        <CardHeader>
          <CardTitle className=\"text-green-900\">Sales Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"grid grid-cols-2 gap-4\">
            <QuickActionButton
              title=\"Create Invoice\"
              icon={<FileText className=\"w-5 h-5\" />}
              onClick={() => navigate('/invoices/new')}
            />
            <QuickActionButton
              title=\"View Customers\"
              icon={<Users className=\"w-5 h-5\" />}
              onClick={() => navigate('/customers')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility Components
const MetricCard = ({ title, value, change, icon, bgColor, borderColor }) => (
  <Card className={`${bgColor} ${borderColor} border`}>
    <CardContent className=\"p-4\">
      <div className=\"flex items-center justify-between\">
        <div>
          <p className=\"text-sm font-medium text-gray-600\">{title}</p>
          <p className=\"text-2xl font-bold text-gray-900\">{value}</p>
          <p className=\"text-xs text-gray-500\">{change}</p>
        </div>
        <div className=\"flex-shrink-0\">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const QuickActionButton = ({ title, icon, onClick }) => (
  <Button
    variant=\"outline\"
    className=\"h-auto p-4 flex flex-col items-center space-y-2 border-green-300 text-green-700 hover:bg-green-50\"
    onClick={onClick}
  >
    {icon}
    <span className=\"text-sm\">{title}</span>
  </Button>
);

export default RoleBasedDashboard;

