import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase'; // Import your auth instance

import './WelcomeScreen.scss';
import Navbar from '../../components/NavBar';
import AnimatedBackground from '../../components/AnimatedBackground/AnimatedBackground';

import { BookText, CalendarDays, ClipboardList, NotebookPen, UploadCloud } from 'lucide-react';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

// Check auth state on component mount
React.useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    setIsLoggedIn(!!user);
  });

  return () => unsubscribe(); // Cleanup subscription
}, []);

const handleButtonClick = () => {
  if (isLoggedIn) {
    navigate('/dashboard');
  } else {
    navigate('/register');
  }
};
  return (
    <div>
     <div className="welcome-container">
      <Navbar />
      
      <div className="scroll-content">
        <div className="hero-section">
          <div className="animated-bg-wrapper">
            <AnimatedBackground />
          </div>
          <div className="content-wrapper">
            <div className="hero-content">
              <h1 className="gradient-heading">
                Organize Your<br />
                <span className="highlight">Academic Success</span>
              </h1>
              
              <p className="subtitle">
                Your all-in-one platform for smarter studying, better organization, 
                and academic achievement
              </p>
              
              <button 
                className="cta-button"
                onClick={handleButtonClick}
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Start Learning Smarter'}
              </button>
            </div>
          </div>
        </div>


    <div className="features-section">
      <div className="features-grid">
        <div className="feature-card">
          <div className="icon-wrapper bg-purple">
            <NotebookPen size={28} />
          </div>
          <h3>Smart Notes</h3>
          <p>Create, organize, and search through your digital notes effortlessly</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper bg-blue">
            <UploadCloud size={28} />
          </div>
          <h3>PDF Integration</h3>
          <p>Upload textbooks and automatically extract key concepts</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper bg-green">
            <ClipboardList size={28} />
          </div>
          <h3>Practice Exams</h3>
          <p>Create custom practice exams to test yourself📜.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper bg-orange">
            <CalendarDays size={28} />
          </div>
          <h3>Study Planner</h3>
          <p>Smart scheduling that adapts to your academic calendar</p>
        </div>
      </div>
    </div>
  </div>
  </div>
  </div>
  );
};

export default WelcomeScreen;