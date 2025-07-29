import React, { useState, useEffect } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import usePlanLimitEnforcement from '../../hooks/usePlanLimitEnforcement';
import UsageLimitPrompt from './UsageLimitPrompt';

/**
 * Component to guard actions based on plan limits
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to render if limits are not exceeded
 * @param {string} props.featureType - The feature type to check (invoices, expenses, sales, products)
 * @param {boolean} props.showModal - Whether to show a modal when limit is reached
 * @param {boolean} props.blockAction - Whether to block the action when limit is reached
 * @param {function} props.onLimitReached - Callback when limit is reached
 * @param {function} props.onValidationComplete - Callback with validation result
 */
const PlanLimitGuard = ({
  children,
  featureType,
  showModal = true,
  blockAction = true,
  onLimitReached,
  onValidationComplete,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isValidating, setIsValidating] = useState(true);
  const [canProceed, setCanProceed] = useState(false);
  const { validateAction, getUsageStatusMessage } = usePlanLimitEnforcement();

  // Action details for different feature types
  const actionDetails = {
    invoices: {
      title: 'Invoice Limit Reached',
      description: 'You have reached your invoice creation limit. Upgrade your plan to create more invoices and access additional features.',
      upgradeFeatures: [
        'Create more invoices',
        'Access to invoice analytics',
        'Custom invoice templates',
        'Bulk invoice operations',
      ],
    },
    expenses: {
      title: 'Expense Limit Reached',
      description: 'You have reached your expense tracking limit. Upgrade your plan to track more expenses and access additional features.',
      upgradeFeatures: [
        'Track more expenses',
        'Expense categorization',
        'Expense reports',
        'Receipt scanning',
      ],
    },
    sales: {
      title: 'Sales Limit Reached',
      description: 'You have reached your sales tracking limit. Upgrade your plan to record more sales and access additional features.',
      upgradeFeatures: [
        'Record more sales',
        'Sales analytics',
        'Customer insights',
        'Sales forecasting',
      ],
    },
    products: {
      title: 'Product Limit Reached',
      description: 'You have reached your product catalog limit. Upgrade your plan to add more products and access additional features.',
      upgradeFeatures: [
        'Add more products',
        'Inventory management',
        'Product categories',
        'Barcode generation',
      ],
    },
    access_analytics: {
      title: 'Analytics Access Restricted',
      description: 'Advanced analytics are available on paid plans. Upgrade to access detailed business insights and reports.',
      upgradeFeatures: [
        'Sales trends analysis',
        'Customer behavior insights',
        'Financial performance metrics',
        'Custom report generation',
      ],
    },
    generate_reports: {
      title: 'Report Generation Restricted',
      description: 'Report generation is available on paid plans. Upgrade to create and export detailed business reports.',
      upgradeFeatures: [
        'PDF report generation',
        'Excel export',
        'Scheduled reports',
        'Custom report templates',
      ],
    },
  };

  useEffect(() => {
    const checkAccess = async () => {
      setIsValidating(true);
      try {
        // Don't show toast here since we'll show our own UI
        const result = await validateAction(featureType, { showToastMessage: false });
        setCanProceed(result);
        
        if (onValidationComplete) {
          onValidationComplete(result);
        }
        
        if (!result && showModal) {
          onOpen();
          if (onLimitReached) onLimitReached();
        }
      } catch (error) {
        console.error('Error validating action:', error);
        setCanProceed(false);
        if (onValidationComplete) {
          onValidationComplete(false);
        }
      } finally {
        setIsValidating(false);
      }
    };

    checkAccess();
  }, [featureType, validateAction, onOpen, showModal, onLimitReached, onValidationComplete]);

  // If still validating, show nothing or a loading state
  if (isValidating) {
    return null;
  }

  // If blocking is enabled and user can't proceed, show nothing
  if (blockAction && !canProceed) {
    return (
      <>
        {showModal && (
          <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalBody py={6}>
                <UsageLimitPrompt
                  featureType={featureType}
                  title={actionDetails[featureType]?.title}
                  description={actionDetails[featureType]?.description}
                  showUpgradeButton={true}
                  onClose={onClose}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </>
    );
  }

  // User can proceed or blocking is disabled
  return <>{children}</>;
};

export default PlanLimitGuard;