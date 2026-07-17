import React from 'react';

const Button = ({ children, variant = 'primary', size = 'default', onClick, type = 'button', style, disabled }) => {
  const baseStyle = {
    fontFamily: 'var(--font-family-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease',
    opacity: disabled ? 0.5 : 1,
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-on-primary)',
      borderRadius: 'var(--rounded-pill)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary)',
      borderRadius: 'var(--rounded-pill)',
    },
    utility: {
      backgroundColor: 'var(--color-ink)',
      color: 'var(--color-on-dark)',
      borderRadius: 'var(--rounded-sm)',
    }
  };

  const sizes = {
    default: {
      padding: '11px 22px',
      fontSize: '17px',
    },
    utility: {
      padding: '8px 15px',
      fontSize: '14px',
    }
  };

  const combinedStyle = {
    ...baseStyle,
    ...variants[variant],
    ...(variant === 'utility' ? sizes.utility : sizes.default),
    ...(size === 'utility' ? sizes.utility : {}),
    ...style
  };

  return (
    <button
      type={type}
      style={combinedStyle}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
};

export default Button;
