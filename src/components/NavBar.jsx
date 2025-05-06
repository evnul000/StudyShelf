import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.scss';
import { signOut } from "firebase/auth";
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { FiSearch, FiBook, FiFileText, FiBell } from 'react-icons/fi';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Track authentication state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsLoggedIn(!!user);
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
// Add this useEffect to fetch notifications
useEffect(() => {
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      
      const q = query(
        collection(db, 'events'),
        where('userId', '==', user.uid),
        where('date', '>=', now),
        where('date', '<=', tomorrow)
      );
      
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      
      setNotifications(eventsList);
    } catch (error) {
      console.error("Error fetching notifications: ", error);
    }
  };

  fetchNotifications();
}, [user]);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'semesters'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const results = [];
      
      querySnapshot.forEach(semesterDoc => {
        const semesterData = semesterDoc.data();
        semesterData.classes?.forEach(cls => {
          ['textbook', 'notes'].forEach(type => {
            cls[type]?.forEach(item => {
              if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                results.push({
                  id: item.id,
                  name: item.name,
                  type,
                  className: cls.name,
                  semesterName: semesterData.name,
                  url: item.url
                });
              }
            });
          });
        });
      });
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching: ", error);
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/semester') return 'My Semesters';
    if (path === '/account') return 'Account Settings';
    if (path === '/studycards') return 'Study Sets';
    if (path === '/upload') return 'Upload Files';
    return '';
  };

  return (
    <nav className="navbar">
       <div className="navbar-full-width">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-logo">
            StudyShelf
          </Link>
          {getPageTitle() && (
            <div className="page-title">
              <span className="divider">/</span>
              <span>{getPageTitle()}</span>
            </div>
          )}
        </div>

        <div className="navbar-center">
         
        </div>

        <div className="navbar-right">
        {isLoggedIn && (
            <div className="search-bar" ref={searchResultsRef}>
              <input
                type="text"
                placeholder="Search your notes and textbooks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === '') {
                    setShowSearchResults(false);
                  }
                }}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch}>
                <FiSearch />
              </button>
              
              {showSearchResults && (
                <div className="search-results-dropdown">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="results-header">Search results</div>
                      <div className="results-list">
                        {searchResults.map((item) => (
                          <div 
                            key={item.id} 
                            className="result-item"
                            onClick={() => {
                              navigate('/view', { state: { file: item.url } });
                              setShowSearchResults(false);
                            }}
                          >
                            <div className="result-checkbox">
                              <input type="checkbox" />
                            </div>
                            <div className="result-details">
                              <h3>{item.name}</h3>
                              <p>{item.className} • {item.semesterName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="results-header">Search results</div>
                      <div className="results-list">
                        <div className="result-item">
                          <div className="result-checkbox">
                            <input type="checkbox" />
                          </div>
                          <div className="result-details">
                            <h3>No results found</h3>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="create-new-section">
                    <div className="results-header">Common actions</div>
                    <div className="result-item">
                      <div className="result-details">
                        <h3>Create new document</h3>
                      </div>
                    </div>
                    <div className="result-item">
                      <div className="result-details">
                        <h3>Create new project</h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
             {/* Add this notifications section */}

             {isLoggedIn && (
    <div className="notifications-container">
      <button 
        className="notification-icon"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FiBell />
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="results-header">Upcoming Events</div>
          <div className="results-list">
            {notifications.length > 0 ? (
              notifications.map(event => {
                const now = new Date();
                const eventTime = new Date(event.date);
                if (event.dueTime) {
                  const [hours, minutes] = event.dueTime.split(':');
                  eventTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                }
                
                const timeDiff = eventTime - now;
                const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                
                let timeMessage = '';
                if (hoursDiff > 24) {
                  timeMessage = `due in ${Math.floor(hoursDiff / 24)} days`;
                } else if (hoursDiff > 0) {
                  timeMessage = `due in ${hoursDiff} hours`;
                } else if (minutesDiff > 0) {
                  timeMessage = `due in ${minutesDiff} minutes`;
                } else {
                  timeMessage = 'due now';
                }
                
                const isUrgent = hoursDiff < 3;
                
                return (
                  <div 
                    key={event.id}
                    className={`notification-item ${isUrgent ? 'urgent' : ''}`}
                    onClick={() => {
                      navigate('/dashboard');
                      setShowNotifications(false);
                    }}
                  >
                    <div className="notification-type">
                      {event.type === 'exam' ? 'Exam' : 'Homework'}
                    </div>
                    <div className="notification-details">
                      <h3>{event.title}</h3>
                      <p>Your {event.type} is {timeMessage}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="notification-item">
                <div className="notification-details">
                  <h3>No upcoming events</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )}
          <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
            {isLoggedIn ? (
              <button 
                className="navbar-link logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="navbar-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="navbar-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </nav>
  );
};

export default Navbar;