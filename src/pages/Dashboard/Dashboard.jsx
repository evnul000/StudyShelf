import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './Dashboard.scss';

// PDF Card Component with Drag capability
const PDFCard = ({ pdf, onView, onDelete, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PDF',
    item: { id: pdf.id, type: pdf.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag}
      className={`pdf-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="pdf-thumbnail">
        <img 
          src="/pdf-icon.png"
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
        <button className="view-button" onClick={() => onView(pdf)}>
          View
        </button>
        <button className="delete-button" onClick={() => onDelete(pdf.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

// PDF Container Component with Drop capability
const PDFContainer = ({ title, type, pdfs, onView, onDelete, onMove }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: 'PDF',
    drop: (item) => {
      if (item.type !== type) {
        onMove(item.id, type);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const filteredPdfs = pdfs.filter(pdf => pdf.type === type);

  return (
    <div 
      ref={drop}
      className={`pdf-container ${canDrop ? 'can-drop' : ''} ${isOver ? 'is-over' : ''}`}
    >
      <h2>{title}</h2>
      {filteredPdfs.length > 0 ? (
        <div className="pdf-grid">
          {filteredPdfs.map(pdf => (
            <PDFCard 
              key={pdf.id} 
              pdf={pdf} 
              onView={onView}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      ) : (
        <div className="no-pdfs">
          <img src="/empty-folder.png" alt="No PDFs" className="empty-icon" />
          <p>No {type === 'textbook' ? 'textbooks' : 'notes'} yet</p>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
        navigate('/login');
      }
    };
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPdfs(user.uid); // Your existing PDF fetching function
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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

  const handleMovePDF = async (pdfId, newType) => {
    try {
      await updateDoc(doc(db, 'pdfs', pdfId), {
        type: newType
      });
      setPdfs(pdfs.map(pdf => 
        pdf.id === pdfId ? { ...pdf, type: newType } : pdf
      ));
    } catch (error) {
      console.error("Error moving PDF:", error);
      alert("Failed to move PDF. Please try again.");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
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

        <div className="pdf-containers">
          <PDFContainer 
            title="Textbooks" 
            type="textbook" 
            pdfs={pdfs} 
            onView={handleViewPdf}
            onDelete={handleDeletePdf}
            onMove={handleMovePDF}
          />
          <PDFContainer 
            title="Notes" 
            type="notes" 
            pdfs={pdfs} 
            onView={handleViewPdf}
            onDelete={handleDeletePdf}
            onMove={handleMovePDF}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default Dashboard;