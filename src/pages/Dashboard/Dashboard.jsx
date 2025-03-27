import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import './Dashboard.scss';

const Dashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('You have been signed out successfully!');
      navigate('/');
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  // Fetch user's PDFs from Firestore/Storage
  useEffect(() => {
    const fetchPdfs = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(collection(db, 'pdfs'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const pdfList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPdfs(pdfList);
        } catch (error) {
          console.error("Error fetching PDFs: ", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPdfs();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome to StudyShelf</h1>
        <div className="header-actions">
          <Link to="/upload" className="upload-button">
            Upload PDF
          </Link>
          <button onClick={handleSignOut} className="signout-button">
            Sign Out
          </button>
        </div>
      </header>

      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {pdfs.length > 0 ? (
            pdfs.slice(0, 3).map(pdf => (
              <div key={pdf.id} className="activity-item">
                <span className="pdf-name">{pdf.name}</span>
                <span className="pdf-date">{new Date(pdf.uploadedAt).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <div className="no-items">No recent activity</div>
          )}
        </div>
      </section>

      <section className="pdf-list">
        <h2>Your PDFs</h2>
        {loading ? (
          <p className="loading-message">Loading your PDFs...</p>
        ) : pdfs.length > 0 ? (
          <div className="pdf-grid">
            {pdfs.map(pdf => (
              <div key={pdf.id} className="pdf-card">
                <div className="pdf-thumbnail">
                  <img src="/pdf-icon.png" alt="PDF Icon" />
                </div>
                <div className="pdf-info">
                  <h3>{pdf.name}</h3>
                  <p>Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}</p>
                  <p>Size: {(pdf.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="pdf-actions">
                  <button className="view-button">View</button>
                  <button className="delete-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-pdfs">
            <img src="/empty-folder.png" alt="No PDFs" className="empty-icon" />
            <p>No books uploaded yet</p>
            <Link to="/upload" className="upload-link">
              Upload your first PDF
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;