import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, CardHeader, Progress, Text, Heading, Box, Flex, Icon } from '@chakra-ui/react';
import { WarningIcon, InfoIcon, CheckCircleIcon } from '@chakra-ui/icons';
import useUsageTracking from '../../hooks/useUsageTracking';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component to display usage limits and prompt for upgrades
 * @param {Object} props - Component props
 * @param {string} props.featureType - The feature type (invoices, expenses, sales, products)
 * @param {string} props.title - Custom title for the prompt
 * @param {string} props.description - Custom description for the prompt
 * @param {boolean} props.showUpgradeButton - Whether to show the upgrade button
 * @param {function} props.onClose - Function to call when the prompt is closed
 */
const UsageLimitPrompt = ({
  featureType,
  title,
  description,
  showUpgradeButton = true,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCurrentUsage, getFeatureLimit, getUsagePercentage } = useUsageTracking();

  const currentUsage = getCurrentUsage(featureType);
  const limit = getFeatureLimit(featureType);
  const percentage = getUsagePercentage(featureType);

  // Determine the status based on usage percentage
  const getStatus = () => {
    if (percentage >= 100) {
      return {
        color: 'red.500',
        icon: WarningIcon,
        title: title || `${featureType} Limit Reached`,
        description: description || `You've reached your ${featureType} limit. Upgrade your plan to continue creating ${featureType}.`,
        buttonText: 'Upgrade Now',
      };
    } else if (percentage >= 80) {
      return {
        color: 'orange.500',
        icon: InfoIcon,
        title: title || `${featureType} Limit Approaching`,
        description: description || `You're approaching your ${featureType} limit. Consider upgrading your plan.`,
        buttonText: 'View Plans',
      };
    } else {
      return {
        color: 'green.500',
        icon: CheckCircleIcon,
        title: title || `${featureType} Usage`,
        description: description || `You're using ${currentUsage} out of ${limit} ${featureType}.`,
        buttonText: 'View Plans',
      };
    }
  };

  const status = getStatus();

  // Get the next tier plan based on current subscription
  const getNextTierPlan = () => {
    const currentPlan = user?.subscription_plan?.toLowerCase() || 'free';
    
    if (currentPlan === 'free') return 'silver_weekly';
    if (currentPlan === 'silver_weekly') return 'silver_monthly';
    if (currentPlan === 'silver_monthly') return 'silver_yearly';
    
    return 'silver_weekly'; // Default fallback
  };

  // Get features included in the next tier plan
  const getNextTierFeatures = () => {
    const nextTier = getNextTierPlan();
    
    const features = {
      silver_weekly: [
        '50 invoices per week',
        '100 expenses per week',
        '200 sales per week',
        '100 products',
        'Email support',
      ],
      silver_monthly: [
        '200 invoices per month',
        '500 expenses per month',
        '1000 sales per month',
        '500 products',
        'Priority email support',
      ],
      silver_yearly: [
        '1000 invoices per year',
        '2000 expenses per year',
        '5000 sales per year',
        '2000 products',
        'Priority email & phone support',
        '2 months free',
      ],
    };
    
    return features[nextTier] || features.silver_weekly;
  };

  const handleUpgrade = () => {
    navigate('/settings?tab=subscription');
    if (onClose) onClose();
  };

  return (
    <Card borderColor={status.color} borderWidth="1px" boxShadow="md">
      <CardHeader bg={`${status.color}10`} borderBottomWidth="1px" borderColor={status.color}>
        <Flex alignItems="center">
          <Icon as={status.icon} color={status.color} boxSize={5} mr={2} />
          <Heading size="sm">{status.title}</Heading>
        </Flex>
      </CardHeader>
      
      <CardBody>
        <Text mb={4}>{status.description}</Text>
        
        <Box mb={4}>
          <Flex justify="space-between" mb={1}>
            <Text fontSize="sm">{currentUsage} used</Text>
            <Text fontSize="sm">{limit} limit</Text>
          </Flex>
          <Progress
            value={percentage}
            colorScheme={percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green'}
            size="sm"
            borderRadius="full"
          />
        </Box>
        
        {percentage >= 80 && (
          <Box bg="gray.50" p={3} borderRadius="md">
            <Text fontWeight="medium" mb={2}>Upgrade to {getNextTierPlan().replace('_', ' ')} to get:</Text>
            <Box as="ul" pl={5}>
              {getNextTierFeatures().map((feature, index) => (
                <Box as="li" key={index} fontSize="sm" mb={1}>
                  {feature}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardBody>
      
      {showUpgradeButton && (
        <CardFooter borderTopWidth="1px" borderColor="gray.200">
          <Button
            colorScheme={percentage >= 100 ? 'red' : 'blue'}
            size="sm"
            onClick={handleUpgrade}
            width="full"
          >
            {status.buttonText}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UsageLimitPrompt;