import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, 
  setDoc, deleteDoc, updateDoc, orderBy, limit 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FiBook, FiFileText, FiUploadCloud, FiSearch, FiCalendar, FiCheck, FiPlus } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Dashboard.scss';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUploads, setRecentUploads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'homework',
    dueTime: '',
    completed: false
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchRecentUploads(currentUser.uid);
        fetchEvents(currentUser.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchRecentUploads = async (userId) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'semesters'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const uploads = [];
      
      querySnapshot.forEach(semesterDoc => {
        const semesterData = semesterDoc.data();
        semesterData.classes?.forEach(cls => {
          ['textbook', 'notes'].forEach(type => {
            cls[type]?.forEach(item => {
              uploads.push({
                id: item.id,
                name: item.name,
                type,
                className: cls.name,
                semesterName: semesterData.name,
                uploadedAt: item.addedAt,
                url: item.url
              });
            });
          });
        });
      });
      
      // Sort by upload date (newest first)
      uploads.sort((a, b) => b.uploadedAt?.toDate() - a.uploadedAt?.toDate());
      setRecentUploads(uploads.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent uploads: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (userId) => {
    try {
      const q = query(
        collection(db, 'events'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
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
    } catch (error) {
      console.error("Error searching: ", error);
    }
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowEventModal(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) return;

    try {
      const eventRef = doc(collection(db, 'events'));
      const eventData = {
        ...newEvent,
        userId: user.uid,
        date: selectedDate,
        createdAt: new Date()
      };
      
      await setDoc(eventRef, eventData);
      
      setEvents([...events, {
        id: eventRef.id,
        ...eventData
      }]);
      
      setNewEvent({
        title: '',
        type: 'homework',
        dueTime: '',
        completed: false
      });
      setShowEventModal(false);
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  const toggleEventCompletion = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      await updateDoc(doc(db, 'events', eventId), {
        completed: !event.completed
      });
      
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, completed: !e.completed } : e
      ));
    } catch (error) {
      console.error("Error updating event: ", error);
    }
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error) {
        console.error("Error deleting event: ", error);
      }
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="calendar-grid">
        <div className="calendar-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {daysInMonth.map(day => {
            const dayEvents = events.filter(event => isSameDay(event.date, day));
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <div 
                key={day.toString()}
                className={`calendar-day 
                  ${isCurrentMonth ? '' : 'other-month'} 
                  ${isSelected ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {dayEvents.length > 0 && (
                  <div className="day-events">
                    {dayEvents.slice(0, 2).map(event => (
                      <div 
                        key={event.id} 
                        className={`event-dot ${event.type} ${event.completed ? 'completed' : ''}`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="more-events">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEventModal = () => {
    if (!showEventModal) return null;

    const dayEvents = events.filter(event => isSameDay(event.date, selectedDate));

    return (
      <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>{format(selectedDate, 'MMMM d, yyyy')}</h3>
          
          <div className="events-list">
            {dayEvents.length > 0 ? (
              dayEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-info">
                    <span className={`event-type ${event.type}`}>
                      {event.type === 'exam' ? 'Exam' : 'Homework'}
                    </span>
                    <span className="event-title">{event.title}</span>
                    {event.dueTime && (
                      <span className="event-time">{event.dueTime}</span>
                    )}
                  </div>
                  <div className="event-actions">
                    <button 
                      className={`complete-btn ${event.completed ? 'completed' : ''}`}
                      onClick={() => toggleEventCompletion(event.id)}
                    >
                      <FiCheck />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-events">No events scheduled for this day</p>
            )}
          </div>
          
          <div className="add-event-form">
            <h4>Add New Event</h4>
            <input
              type="text"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
            />
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
            >
              <option value="homework">Homework</option>
              <option value="exam">Exam</option>
            </select>
            <input
              type="time"
              value={newEvent.dueTime}
              onChange={(e) => setNewEvent({...newEvent, dueTime: e.target.value})}
              placeholder="Due time (optional)"
            />
            <button onClick={handleAddEvent} className="add-btn">
              <FiPlus /> Add Event
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search your notes and textbooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
              <FiSearch />
            </button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Recent Uploads Section */}
          <div className="recent-uploads card">
            <div className="card-header">
              <h2>Recent Uploads</h2>
              <button 
                className="upload-btn"
                onClick={() => navigate('/upload')}
              >
                <FiUploadCloud /> Upload
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : recentUploads.length === 0 ? (
              <div className="empty-state">
                <FiFileText size={48} />
                <p>No recent uploads</p>
              </div>
            ) : (
              <div className="uploads-list">
                {recentUploads.map((item) => (
                  <div key={item.id} className="upload-item">
                    <div className="upload-icon">
                      {item.type === 'textbook' ? <FiBook /> : <FiFileText />}
                    </div>
                    <div className="upload-details">
                      <h3>{item.name}</h3>
                      <p>
                        <span className={`type-badge ${item.type}`}>
                          {item.type === 'textbook' ? 'Textbook' : 'Notes'}
                        </span>
                        <span>{item.className} • {item.semesterName}</span>
                      </p>
                    </div>
                    <div className="upload-date">
                      {item.uploadedAt?.toDate().toLocaleDateString()}
                    </div>
                    <button 
                      className="view-btn"
                      onClick={() => navigate('/view', { state: { file: item.url } })}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Section */}
          <div className="calendar-section card">
            <div className="card-header">
              <h2>Study Calendar</h2>
              <div className="month-navigation">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  &lt;
                </button>
                <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  &gt;
                </button>
              </div>
            </div>
            
            {renderCalendar()}
            {renderEventModal()}
          </div>

          {/* Search Results Section (only shown when searching) */}
          {searchResults.length > 0 && (
            <div className="search-results card">
              <div className="card-header">
                <h2>Search Results</h2>
                <button onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}>
                  Clear
                </button>
              </div>
              
              <div className="results-list">
                {searchResults.map((item) => (
                  <div key={item.id} className="result-item">
                    <div className="result-icon">
                      {item.type === 'textbook' ? <FiBook /> : <FiFileText />}
                    </div>
                    <div className="result-details">
                      <h3>{item.name}</h3>
                      <p>
                        <span className={`type-badge ${item.type}`}>
                          {item.type === 'textbook' ? 'Textbook' : 'Notes'}
                        </span>
                        <span>{item.className} • {item.semesterName}</span>
                      </p>
                    </div>
                    <button 
                      className="view-btn"
                      onClick={() => navigate('/view', { state: { file: item.url } })}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;