import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  icon,
}) => {
  const baseClasses =
    'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center';

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
    secondary:
      'bg-white border-2 border-gray-300 hover:border-gray-400 active:border-gray-500 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 shadow-sm',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
    success:
      'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white focus:ring-green-500 shadow-sm hover:shadow-md',
    ghost:
      'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const disabledClasses =
    disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClasses} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
