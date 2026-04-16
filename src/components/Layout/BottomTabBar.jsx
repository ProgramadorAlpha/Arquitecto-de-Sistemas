import React from 'react';
import { Activity, Globe, ClipboardList, Box, Users, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const PRIMARY_TABS = [
  { id: 'dashboard', icon: Activity, labelKey: 'nav_dashboard' },
  { id: 'languages', icon: Globe, labelKey: 'nav_languages' },
  { id: 'weekly', icon: ClipboardList, labelKey: 'nav_weekly' },
  { id: 'systems', icon: Box, labelKey: 'nav_systems' },
];

const BottomTabBar = ({ activeTab, onTabChange, onOpenMore }) => {
  const { actions } = useAppContext();

  return (
    <nav className="bottom-tab-bar">
      {PRIMARY_TABS.map(({ id, icon: Icon, labelKey }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`bottom-tab-bar__item ${isActive ? 'bottom-tab-bar__item--active' : ''}`}
            aria-label={actions.t(labelKey)}
          >
            <span className="bottom-tab-bar__icon-wrap">
              <Icon className="bottom-tab-bar__icon" />
              {isActive && <span className="bottom-tab-bar__dot" />}
            </span>
            <span className="bottom-tab-bar__label">{actions.t(labelKey)}</span>
          </button>
        );
      })}

      {/* More button opens sidebar for secondary tabs */}
      <button
        onClick={onOpenMore}
        className="bottom-tab-bar__item"
        aria-label="Más opciones"
      >
        <span className="bottom-tab-bar__icon-wrap">
          <MoreHorizontal className="bottom-tab-bar__icon" />
        </span>
        <span className="bottom-tab-bar__label">Más</span>
      </button>
    </nav>
  );
};

export default BottomTabBar;