import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Users, DollarSign, TrendingUp, Share2, Copy, Gift } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/index.js';
import { useAuth } from '../../contexts/AuthContext';

const ReferralWidget = ({ referralData, loading, onWithdraw }) => {
  const { user, isOwner, isPaidPlan } = useAuth();
  const [copied, setCopied] = useState(false);

  // Only show for Owners with paid plans
  if (!isOwner || !isPaidPlan) return null;

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200 shadow-lg">
        <CardHeader>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockReferralData = referralData || {
    total_earnings: 45000,
    active_referrals: 8,
    available_for_withdrawal: 12000,
    monthly_earnings: 8500,
    referral_code: user?.referral_code || 'SABIOPS2025',
    commission_rate: 20
  };

  const {
    total_earnings = 0,
    active_referrals = 0,
    available_for_withdrawal = 0,
    monthly_earnings = 0,
    referral_code = 'SABIOPS2025',
    commission_rate = 20
  } = mockReferralData;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = () => {
    const referralLink = `https://sabiops.vercel.app/register?ref=${referral_code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join SabiOps',
        text: 'Manage your business with SabiOps - Get 20% commission!',
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 via-white to-emerald-50 border-green-200 shadow-lg overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-sm" />
      <CardHeader className="pb-3 bg-gradient-to-r from-green-100 to-emerald-100">
        <CardTitle className="text-sm font-bold text-green-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-green-600 rounded-lg">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <span>Referral Earnings</span>
          </div>
          <Badge className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            {commission_rate}% Commission
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4 bg-gradient-to-br from-white to-green-50">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl">
            <div className="text-lg font-bold text-green-900">
              {formatCurrency(total_earnings)}
            </div>
            <p className="text-xs text-green-700 font-medium">Total Earned</p>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl">
            <div className="text-lg font-bold text-emerald-900">
              {active_referrals}
            </div>
            <p className="text-xs text-emerald-700 font-medium">Active Referrals</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-100">
            <span className="text-xs text-green-700 font-medium">Available for withdrawal:</span>
            <span className="font-bold text-green-900 text-sm">
              {formatCurrency(available_for_withdrawal)}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-100">
            <span className="text-xs text-green-700 font-medium">This month:</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="font-bold text-green-900 text-sm">
                {formatCurrency(monthly_earnings)}
              </span>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="mb-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
          <p className="text-xs text-green-700 font-medium mb-2">Your Referral Code:</p>
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-green-900 text-sm">{referral_code}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyReferralCode}
              className="text-green-600 hover:text-green-700 hover:bg-green-200"
            >
              {copied ? (
                <span className="text-xs">Copied!</span>
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button 
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
            disabled={available_for_withdrawal < 3000}
            onClick={onWithdraw}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Withdraw
          </Button>
          <Button 
            size="sm"
            variant="outline" 
            className="border-green-300 text-green-700 hover:bg-green-50 text-xs font-medium"
            onClick={shareReferralLink}
          >
            <Share2 className="h-3 w-3 mr-1" />
            Share Link
          </Button>
        </div>

        {/* Withdrawal Notice */}
        {available_for_withdrawal < 3000 && (
          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs text-orange-700 text-center font-medium">
              Minimum withdrawal: ₦3,000
            </p>
          </div>
        )}

        {/* How it Works */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h4 className="text-xs font-bold text-blue-900 mb-2">How Referrals Work:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Share your referral code with businesses</li>
            <li>• Earn {commission_rate}% commission on their subscriptions</li>
            <li>• Get paid monthly for active referrals</li>
            <li>• Minimum withdrawal: ₦3,000</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Badge component if not available
const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

export { ReferralWidget };
export default ReferralWidget;