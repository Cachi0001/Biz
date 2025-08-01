import React, { useState, useContext } from 'react';
import { Copy, Share2, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AuthContext } from '../../contexts/AuthContext';

const FixedReferralWidget = () => {
  const { user } = useContext(AuthContext);
  const [copied, setCopied] = useState(false);

  // Generate the actual referral link using the user's referral code
  const referralLink = user?.referral_code 
    ? `https://sabiops.vercel.app/register?ref=${user.referral_code}`
    : '';

  const copyToClipboard = async () => {
    if (!referralLink) {
      alert('Referral code not available yet. Please refresh the page.');
      return;
    }

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = async () => {
    if (!referralLink) {
      alert('Referral code not available yet. Please refresh the page.');
      return;
    }

    const shareData = {
      title: 'Join SabiOps - Business Management Made Easy',
      text: 'Start your business management journey with SabiOps! Use my referral link to get started.',
      url: referralLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        copyToClipboard(); // Fallback to copy
      }
    } else {
      copyToClipboard(); // Fallback to copy
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <Gift className="h-5 w-5 mr-2" />
          Refer Friends & Earn Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code Display */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Your Referral Code
          </label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={user?.referral_code || 'Loading...'}
              readOnly
              className="font-mono text-center text-lg font-bold bg-white"
              placeholder="Generating referral code..."
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              disabled={!user?.referral_code}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Your Referral Link
          </label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={referralLink || 'Generating referral link...'}
              readOnly
              className="pr-20 text-sm"
              placeholder="Your referral link will appear here"
            />
            <Button
              onClick={copyToClipboard}
              variant={copied ? "default" : "outline"}
              size="sm"
              disabled={!referralLink}
              className={copied ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {copied ? "Copied!" : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              onClick={shareReferral}
              variant="outline"
              size="sm"
              disabled={!referralLink}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white p-3 rounded-lg border border-purple-100">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            How Referrals Work
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• They sign up using your link</li>
            <li>• You both get rewards when they join!</li>
            <li>• Track your referrals in the dashboard</li>
          </ul>
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 p-2 rounded text-xs">
            <strong>Debug Info:</strong><br />
            User ID: {user?.id || 'Not loaded'}<br />
            Referral Code: {user?.referral_code || 'Not generated'}<br />
            Link: {referralLink || 'Not available'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FixedReferralWidget;