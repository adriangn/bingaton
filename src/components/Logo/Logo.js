import React from 'react';
import './Logo.css';

const Logo = ({ size = 'default', className = '', onClick, printVersion = false }) => {
  const sizeClass = size === 'small' ? 'logo-small' : 
                    size === 'large' ? 'logo-large' : 
                    'logo-default';
  
  // Usar una clase diferente para la versión de impresión
  const printClass = printVersion ? 'print-version' : '';

  return (
    <div 
      className={`bingaton-logo ${sizeClass} ${printClass} ${className}`}
      onClick={onClick}
    >
      Bingaton
    </div>
  );
};

export default Logo;
