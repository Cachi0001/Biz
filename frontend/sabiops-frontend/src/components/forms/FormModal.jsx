import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import StandardForm from './StandardForm';

/**
 * FormModal - Responsive modal/drawer for forms
 * Uses drawer on mobile, dialog on desktop for better UX
 */
const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  fields,
  data,
  onChange,
  onSubmit,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  className = "",
  errors = {},
  touched = {},
  onFieldBlur,
  onFieldFocus,
  disabled = false,
  maxWidth = "2xl" // sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSubmit = (e) => {
    if (onSubmit) {
      onSubmit(e);
    }
  };

  const formProps = {
    fields,
    data,
    onChange,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    loading,
    submitText,
    cancelText,
    errors,
    touched,
    onFieldBlur,
    onFieldFocus,
    disabled,
    layout: isDesktop ? "default" : "mobile",
    className
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-${maxWidth} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4">
            <StandardForm {...formProps} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          <StandardForm {...formProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default FormModal;