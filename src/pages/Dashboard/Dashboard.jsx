import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
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

  // Fetch user's PDFs from Firestore
  useEffect(() => {
    const fetchPdfs = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          setLoading(true);
          const q = query(
            collection(db, 'pdfs'), 
            where('userId', '==', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const pdfList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPdfs(pdfList);
        } catch (error) {
          console.error("Error fetching PDFs: ", error);
          alert("Error loading PDFs. Please refresh the page.");
        } finally {
          setLoading(false);
        }
      } else {
        // User not logged in (shouldn't happen since Dashboard is protected)
        navigate('/login');
      }
    };
  
    fetchPdfs();
  }, [navigate]); // Add navigate to dependencies

  const handleViewPdf = (pdf) => {
    navigate('/view', { 
      state: { 
        file: pdf.url,
        pdfId: pdf.id
      } 
    });
  };

  const handleDeletePdf = async (pdfId) => {
    if (window.confirm('Are you sure you want to delete this PDF?')) {
      try {
        await deleteDoc(doc(db, 'pdfs', pdfId));
        setPdfs(pdfs.filter(pdf => pdf.id !== pdfId));
        alert('PDF deleted successfully');
      } catch (error) {
        alert('Error deleting PDF: ' + error.message);
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome to StudyShelf</h1>
        <div className="header-actions">
        <button 
  onClick={() => navigate('/upload')}
  className="upload-button"
>
  Upload PDF
</button>
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
                <span className="pdf-date">{new Date(pdf.uploadedAt?.toDate()).toLocaleDateString()}</span>
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
                  <img 
                    src="/pdf-icon.png" // or your CDN URL
                    alt="PDF Icon"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                    }}
                  />
                </div>
                <div className="pdf-info">
                  <h3>{pdf.name}</h3>
                  <p>Uploaded: {new Date(pdf.uploadedAt?.toDate()).toLocaleDateString()}</p>
                  <p>Size: {(pdf.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="pdf-actions">
                  <button 
                    className="view-button"
                    onClick={() => handleViewPdf(pdf)}
                  >
                    View
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeletePdf(pdf.id, pdf.name)}
                  >
                    Delete
                  </button>
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