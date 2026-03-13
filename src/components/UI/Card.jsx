import React from 'react';

const Card = ({ children, className = '', title, icon: Icon, color = 'amber' }) => {
  const variantMap = {
    amber: 'widget-card--amber',
    orange: 'widget-card--amber',
    emerald: 'widget-card--emerald',
    green: 'widget-card--emerald',
    violet: 'widget-card--violet',
    indigo: 'widget-card--violet',
    blue: 'widget-card--violet',
    red: 'widget-card--coral',
    coral: 'widget-card--coral'
  };

  const variant = variantMap[color] || '';

  return (
    <div className={`widget-card ${variant} ${className}`}>
      {(title || Icon) && (
        <div className="widget-card__header">
          <div className="widget-card__title">
            {Icon && (
              <span className="shrink-0 opacity-80">
                {React.isValidElement(Icon) ? Icon : <Icon className="w-4 h-4" />}
              </span>
            )}
            {title && <span>{title}</span>}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
};

export default Card;
