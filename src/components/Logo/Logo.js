import React from 'react';
import './Logo.css';

const Logo = ({ size = 'default', className = '', onClick }) => {
  const sizeClass = size === 'small' ? 'logo-small' : 
                    size === 'large' ? 'logo-large' : 
                    'logo-default';

  return (
    <div 
      className={`bingaton-logo ${sizeClass} ${className}`}
      onClick={onClick}
    >
      Bingaton
    </div>
  );
};

export default Logo;
