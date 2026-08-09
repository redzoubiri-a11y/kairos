import { NavLink } from 'react-router-dom';

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Tableau de bord',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7.5" height="8" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
        <rect x="3" y="14" width="7.5" height="7" rx="1.5" />
        <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/transporters',
    label: 'Transporteurs',
    badgeKey: 'pending',
    icon: (
      <svg {...iconProps}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18.5" r="1.8" />
        <circle cx="17.5" cy="18.5" r="1.8" />
      </svg>
    ),
  },
  {
    to: '/trips',
    label: 'Trajets',
    icon: (
      <svg {...iconProps}>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 6h5a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 0 0 7h5" />
      </svg>
    ),
  },
  {
    to: '/missions',
    label: 'Missions',
    icon: (
      <svg {...iconProps}>
        <path d="M9 4h6v3H9z" />
        <path d="M15 5.5h3.5v15H5.5v-15H9" />
        <path d="M8.8 12.4l2 2 4.2-4.2" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Utilisateurs',
    icon: (
      <svg {...iconProps}>
        <circle cx="9.5" cy="8" r="3.3" />
        <path d="M3.5 20a6 6 0 0 1 12 0" />
        <path d="M16.5 5.4a3.3 3.3 0 0 1 0 6.2M17.5 14.6a6 6 0 0 1 3 5.4" />
      </svg>
    ),
  },
];

export default function Sidebar({ pendingCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">TS</span>
        <span className="sidebar__titles">
          <span className="sidebar__title">TruckSpot</span>
          <span className="sidebar__subtitle">Admin</span>
        </span>
      </div>

      <nav className="sidebar__nav">
        <span className="sidebar__section">Pilotage</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
          >
            <span className="nav-item__icon">{item.icon}</span>
            <span className="nav-item__label">{item.label}</span>
            {item.badgeKey === 'pending' && pendingCount > 0 && (
              <span className="nav-item__badge">{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
