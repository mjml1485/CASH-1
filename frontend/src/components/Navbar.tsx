import { FaBell, FaUser } from 'react-icons/fa';

interface NavbarProps {
  activePage: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements';
  onPageChange: (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => void;
}

export default function Navbar({ activePage, onPageChange }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">CASH</div>
      <div className="navbar-menu">
        <button
          className={`navbar-link ${activePage === 'Dashboard' ? 'active' : ''}`}
          onClick={() => onPageChange('Dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`navbar-link ${activePage === 'Personal Plan' ? 'active' : ''}`}
          onClick={() => onPageChange('Personal Plan')}
        >
          Personal Plan
        </button>
        <button
          className={`navbar-link ${activePage === 'Shared Plan' ? 'active' : ''}`}
          onClick={() => onPageChange('Shared Plan')}
        >
          Shared Plan
        </button>
        <button
          className={`navbar-link ${activePage === 'Achievements' ? 'active' : ''}`}
          onClick={() => onPageChange('Achievements')}
        >
          Achievements
        </button>
      </div>
      <div className="navbar-actions">
        <button className="navbar-icon" aria-label="Notifications">
          <FaBell />
          <span className="navbar-badge">1</span>
        </button>
        <button className="navbar-icon" aria-label="Profile">
          <FaUser />
        </button>
      </div>
    </nav>
  );
}
