import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ 
  to = null, 
  className = '', 
  showText = false,
  text = 'Back',
  variant = 'default' // 'default', 'minimal', 'floating'
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      // Go back in history, or to home if no history
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2";
  
  const variants = {
    default: "p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-border hover:bg-primary/5 hover:border-primary/20 text-primary hover:text-primary-600 shadow-sm",
    minimal: "p-2 rounded-lg hover:bg-primary/10 text-primary hover:text-primary-600",
    floating: "fixed top-4 left-4 z-50 p-3 rounded-full bg-white/90 backdrop-blur-md border border-border hover:bg-primary/5 hover:border-primary/20 text-primary hover:text-primary-600 shadow-lg hover:shadow-xl"
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <button
      onClick={handleBack}
      className={`${baseClasses} ${variantClass} ${className}`}
      aria-label={showText ? text : 'Go back'}
      title={showText ? text : 'Go back'}
    >
      <ArrowLeft className="w-5 h-5" />
      {showText && (
        <span className="ml-2 text-sm font-medium">{text}</span>
      )}
    </button>
  );
};

export default BackButton;