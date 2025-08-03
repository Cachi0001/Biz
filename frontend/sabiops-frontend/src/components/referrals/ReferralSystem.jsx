import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Crown, Users, DollarSign, Calendar, Copy, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ReferralSystem = () => {
  const { user, role } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Only show for owners with paid plans
  if (role !== 'Owner' || user?.subscription_plan === 'free') {
    return null;
  }

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referrals/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setReferralData(data);
        } else {
          console.warn('Referral API returned non-JSON response');
          // Set default/mock data
          setReferralData({
            referral_code: user?.referral_code || 'REF123',
            total_referrals: 0,
            total_earnings: 0,
            pending_earnings: 0,
            available_earnings: 0
          });
        }
      } else {
        console.warn('Referral API not available');
        // Set default/mock data
        setReferralData({
          referral_code: user?.referral_code || 'REF123',
          total_referrals: 0,
          total_earnings: 0,
          pending_earnings: 0,
          available_earnings: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      // Set default/mock data on error
      setReferralData({
        referral_code: user?.referral_code || 'REF123',
        total_referrals: 0,
        total_earnings: 0,
        pending_earnings: 0,
        available_earnings: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      const referralLink = `https://sabiops.vercel.app/register?ref=${referralData?.referral_code || ''}`;
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral link');
    }
  };

  const requestWithdrawal = async () => {
    try {
      const response = await fetch('/api/referrals/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Withdrawal request submitted successfully!');
        fetchReferralData();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Withdrawal request failed');
      }
    } catch (error) {
      toast.error('Failed to process withdrawal request');
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canWithdraw = referralData?.available_earnings >= 3000;
  const activeReferrals = referralData?.referrals?.filter(ref => ref.months_earned < 3) || [];

  return (
    <div className="space-y-4">
      {/* Referral Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
            <Crown className="h-4 w-4 mr-2 text-yellow-600" />
            Referral System - Premium Feature
          </CardTitle>
          <CardDescription className="text-blue-600">
            Earn 10% commission for the first 3 months from each referred user
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Earnings */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                ₦{(referralData?.total_earnings || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Earned</p>
            </div>

            {/* Available for Withdrawal */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                ₦{(referralData?.available_earnings || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Available</p>
            </div>

            {/* Active Referrals */}
            <div className="text-center p-4 bg-white rounded-lg border">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">
                {activeReferrals.length}
              </p>
              <p className="text-sm text-gray-600">Active Referrals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with others to earn commissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={`https://sabiops.vercel.app/register?ref=${referralData?.referral_code || ''}`}
              readOnly
              className="font-mono text-center text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralCode}
              className="flex items-center space-x-1"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Earn 10% commission for the first 3 months from each user who subscribes using your code
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Withdrawal</CardTitle>
          <CardDescription>
            Minimum withdrawal amount: ₦3,000
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-green-600">
                ₦{(referralData?.available_earnings || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Available for withdrawal</p>
            </div>
            <Button
              onClick={requestWithdrawal}
              disabled={!canWithdraw}
              className={canWithdraw ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}
            >
              {canWithdraw ? 'Request Withdrawal' : 'Minimum ₦3,000'}
            </Button>
          </div>
          {!canWithdraw && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700">
                You need at least ₦3,000 in earnings to request a withdrawal.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Referrals List */}
      {activeReferrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
            <CardDescription>
              Users you've referred who are still generating earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {activeReferrals.map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{referral.user_name}</p>
                    <p className="text-sm text-gray-600">
                      Plan: {referral.current_plan} • Joined: {new Date(referral.joined_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      Month {referral.months_earned + 1}/3
                    </Badge>
                    <p className="text-sm text-green-600 font-medium">
                      ₦{referral.total_earned.toLocaleString()} earned
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">How Referral Earnings Work:</p>
              <ul className="space-y-1 text-xs">
                <li>• Earn 10% commission from Monthly (₦450) and Yearly (₦5,000) plans only</li>
                <li>• Earnings are limited to the first 3 months per referred user</li>
                <li>• After 3 months, you stop earning from that specific user</li>
                <li>• You can refer unlimited users and earn from each for 3 months</li>
                <li>• Minimum withdrawal amount is ₦3,000</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { ReferralSystem };
export default ReferralSystem;