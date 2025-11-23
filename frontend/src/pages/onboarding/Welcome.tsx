import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding/currency');
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-form-inner">
          <div className="onboarding-header">
            <h1 className="onboarding-title">WELCOME TO CASH</h1>
            <p className="onboarding-subtitle">A Cloud Access Synchronized Hub Expense Tracker</p>
          </div>
          <div className="onboarding-button-wrapper">
            <button className="onboarding-button-primary" type="button" onClick={handleGetStarted}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
