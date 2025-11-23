import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaUser } from 'react-icons/fa';

interface Achievement {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  dateEarned?: string;
}

const ACHIEVEMENTS: Achievement[] = Array.from({ length: 16 }).map((_, idx) => ({
  id: `first-payday-${idx + 1}`,
  title: 'First Payday!',
  description: 'Add your first income to an account.',
  achieved: idx === 0,
  dateEarned: idx === 0 ? 'Nov 12, 2025' : undefined,
}));

export default function Achievements() {
  const navigate = useNavigate();
  const achievements = ACHIEVEMENTS;

  const handleTabChange = (page: 'Dashboard' | 'Personal Plan' | 'Shared Plan' | 'Achievements') => {
    if (page === 'Achievements') return;
    const target = page === 'Dashboard' ? '/dashboard' : page === 'Personal Plan' ? '/personal' : '/shared';
    navigate(target);
  };

  return (
    <div className="achievements-page">
      <Navbar activePage="Achievements" onPageChange={handleTabChange} />

      <div className="achievements-content">
        <div className="achievements-grid" role="list">
          {achievements.map(a => (
            <div
              key={a.id}
              className={`achievement-card ${a.achieved ? 'achieved' : ''}`}
              role="listitem"
              aria-label={`${a.title} ${a.achieved ? 'achieved' : 'locked'}`}
            >
              <div className="achievement-icon" aria-hidden="true">
                <FaUser />
              </div>
              <h3 className="achievement-title">{a.title}</h3>
              <p className="achievement-desc">{a.description}</p>
              {a.achieved && (
                <p className="achievement-earned">Earned on {a.dateEarned}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
