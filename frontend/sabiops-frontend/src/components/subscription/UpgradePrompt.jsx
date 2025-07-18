import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
    Crown,
    TrendingUp,
    Zap,
    Users,
    BarChart3,
    FileText,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { usePlanLimits } from '../../contexts/PlanLimitContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Intelligent upgrade prompt component that shows contextual upgrade messages
 * based on user's current usage patterns and plan limits
 */
export const UpgradePrompt = ({
    trigger = 'usage', // 'usage', 'feature', 'limit', 'general'
    feature = null,
    className = '',
    compact = false,
    showDismiss = true
}) => {
    const { subscription } = useAuth();
    const { getUsageSummary, getPlanLimits } = usePlanLimits();

    const currentPlan = subscription?.plan || 'free';
    const usageSummary = getUsageSummary();
    const limits = getPlanLimits();

    // Don't show upgrade prompt if already on a paid plan
    if (currentPlan !== 'free') {
        return null;
    }

    const getUpgradeMessage = () => {
        switch (trigger) {
            case 'usage':
                return getUsageBasedMessage();
            case 'feature':
                return getFeatureBasedMessage(feature);
            case 'limit':
                return getLimitBasedMessage();
            default:
                return getGeneralMessage();
        }
    };

    const getUsageBasedMessage = () => {
        const highUsageResources = usageSummary.warnings.concat(usageSummary.blocked);

        if (highUsageResources.length > 0) {
            const resource = highUsageResources[0];
            return {
                title: `You're ${resource.percentage >= 100 ? 'at' : 'approaching'} your ${resource.resource} limit`,
                description: `${resource.usage}/${resource.limit} ${resource.resource} used this month`,
                urgency: resource.percentage >= 100 ? 'high' : 'medium',
                benefits: [
                    `${resource.resource === 'invoices' ? '100 invoices' : '100 expenses'} per week`,
                    'Advanced analytics & reporting',
                    'Team collaboration features'
                ]
            };
        }

        return getGeneralMessage();
    };

    const getFeatureBasedMessage = (feature) => {
        const featureMessages = {
            analytics: {
                title: 'Unlock Advanced Analytics',
                description: 'Get detailed insights into your business performance',
                urgency: 'medium',
                benefits: [
                    'Revenue & expense trends',
                    'Customer analytics',
                    'Product performance insights',
                    'Custom reports & exports'
                ]
            },
            reports: {
                title: 'Advanced Reporting Available',
                description: 'Generate detailed business reports and insights',
                urgency: 'medium',
                benefits: [
                    'Automated report generation',
                    'Custom date ranges',
                    'Export to PDF/Excel',
                    'Scheduled reports'
                ]
            },
            team: {
                title: 'Add Team Members',
                description: 'Collaborate with your team on business management',
                urgency: 'low',
                benefits: [
                    'Up to 5 team members',
                    'Role-based permissions',
                    'Activity tracking',
                    'Shared workspace'
                ]
            }
        };

        return featureMessages[feature] || getGeneralMessage();
    };

    const getLimitBasedMessage = () => {
        return {
            title: 'Upgrade to Remove Limits',
            description: 'Scale your business without restrictions',
            urgency: 'high',
            benefits: [
                '100 invoices & expenses weekly',
                'Unlimited customers & products',
                'Advanced features unlocked',
                'Priority support'
            ]
        };
    };

    const getGeneralMessage = () => {
        return {
            title: 'Upgrade to Silver Weekly',
            description: 'Unlock the full potential of your business management',
            urgency: 'low',
            benefits: [
                '100 invoices & expenses per week',
                'Advanced analytics dashboard',
                'Team collaboration (5 members)',
                'Priority customer support'
            ]
        };
    };

    const message = getUpgradeMessage();

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-orange-200 bg-orange-50';
            default: return 'border-blue-200 bg-blue-50';
        }
    };

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case 'high': return { text: 'Action Required', variant: 'destructive' };
            case 'medium': return { text: 'Recommended', variant: 'default' };
            default: return { text: 'Available', variant: 'secondary' };
        }
    };

    if (compact) {
        return (
            <Alert className={`${getUrgencyColor(message.urgency)} ${className}`}>
                <Crown className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                    <div>
                        <strong>{message.title}</strong>
                        <p className="text-sm mt-1">{message.description}</p>
                    </div>
                    <Button
                        size="sm"
                        className="ml-4"
                        onClick={() => window.location.href = '/subscription-upgrade'}
                    >
                        Upgrade
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className={`${getUrgencyColor(message.urgency)} ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white shadow-sm">
                            <Crown className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {message.title}
                                <Badge variant={getUrgencyBadge(message.urgency).variant}>
                                    {getUrgencyBadge(message.urgency).text}
                                </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {message.description}
                            </p>
                        </div>
                    </div>
                    {showDismiss && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            ×
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Current Plan Status */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                        <div className="font-medium">Current: Basic Plan</div>
                        <div className="text-sm text-muted-foreground">
                            {limits.invoices} invoices • {limits.expenses} expenses monthly
                        </div>
                    </div>
                    <Badge variant="outline">Free</Badge>
                </div>

                {/* Benefits List */}
                <div className="space-y-2">
                    <div className="font-medium text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        Upgrade Benefits:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {message.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {benefit}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Preview */}
                <div className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Silver Weekly Plan</div>
                            <div className="text-sm text-muted-foreground">
                                Perfect for growing businesses
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">$9.99</div>
                            <div className="text-xs text-muted-foreground">per week</div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        onClick={() => window.location.href = '/subscription-upgrade'}
                    >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/pricing'}
                    >
                        Compare Plans
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Instant activation
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Cancel anytime
                    </div>
                    <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        7-day free trial
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Smart upgrade prompt that automatically determines the best message
 * based on user's current state and usage patterns
 */
export const SmartUpgradePrompt = ({ className = '', ...props }) => {
    const { getUsageSummary } = usePlanLimits();
    const usageSummary = getUsageSummary();

    // Determine the best trigger based on current state
    let trigger = 'general';
    let feature = null;

    if (usageSummary.blocked.length > 0) {
        trigger = 'limit';
    } else if (usageSummary.warnings.length > 0) {
        trigger = 'usage';
    }

    return (
        <UpgradePrompt
            trigger={trigger}
            feature={feature}
            className={className}
            {...props}
        />
    );
};

export default UpgradePrompt;