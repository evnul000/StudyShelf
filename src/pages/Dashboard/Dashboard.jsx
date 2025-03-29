import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { FiBook, FiFileText, FiFolder, FiUploadCloud } from 'react-icons/fi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Dashboard.scss';

const DraggablePDFCard = ({ id, children, onView, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`draggable-pdf-card ${isDragging ? 'dragging' : ''}`}
      aria-pressed={isDragging}
    >
      <div 
        className="drag-handle" 
        {...listeners} 
        {...attributes}
        aria-label="Drag handle"
        tabIndex={0}
      >
        <span className="drag-icon" aria-hidden="true">☰</span>
      </div>
      <div className="card-content">
        {React.cloneElement(children, { onView, onDelete })}
      </div>
    </div>
  );
};

const DroppableContainer = ({ id, children }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="droppable-container">
      {children}
    </div>
  );
};

const PDFCard = ({ pdf, onView, onDelete }) => {
  return (
    <div className="pdf-card">
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
        <button className="view-button" onClick={(e) => {
          e.stopPropagation();
          onView();
        }}>
          View
        </button>
        <button className="delete-button" onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}>
          Delete
        </button>
      </div>
    </div>
  );
};

const PDFContainer = ({ title, type, pdfs, onView, onDelete }) => {
  return (
    <DroppableContainer id={type}>
      <div className={`pdf-container ${type}`}>
        <h2>{title}</h2>
        {pdfs.length > 0 ? (
          <SortableContext 
            items={pdfs.map(pdf => pdf.id)} 
            strategy={horizontalListSortingStrategy}
          >
            <div className="pdf-grid">
              {pdfs.map(pdf => (
                <DraggablePDFCard 
                  key={pdf.id} 
                  id={pdf.id}
                  onView={() => onView(pdf)}
                  onDelete={() => onDelete(pdf.id)}
                >
                  <PDFCard pdf={pdf} />
                </DraggablePDFCard>
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className="no-pdfs">
            {type === 'textbook' ? (
              <>
                <FiBook className="empty-icon" size={48} />
                <p>No textbooks uploaded yet</p>
                <button 
                  className="upload-cta"
                  onClick={() => navigate('/upload')}
                >
                  <FiUploadCloud size={16} />
                  <span>Upload Textbook</span>
                </button>
              </>
            ) : (
              <>
                <FiFileText className="empty-icon" size={48} />
                <p>No notes uploaded yet</p>
                <button 
                  className="upload-cta"
                  onClick={() => navigate('/upload')}
                >
                  <FiUploadCloud size={16} />
                  <span>Upload Notes</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </DroppableContainer>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Need to move 5px before dragging starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      alert('You have been signed out successfully!');
      navigate('/');
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchPdfs = async (userId) => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'pdfs'), 
          where('userId', '==', userId)
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
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchPdfs(user.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activePdf = pdfs.find(pdf => pdf.id === active.id);
    
    if (activePdf && over.id !== activePdf.type) {
      try {
        // Update in Firestore
        await updateDoc(doc(db, 'pdfs', active.id), {
          type: over.id
        });
        
        // Update local state
        setPdfs(pdfs.map(pdf => 
          pdf.id === active.id ? { ...pdf, type: over.id } : pdf
        ));
      } catch (error) {
        console.error("Error moving PDF:", error);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

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

  const textbooks = pdfs.filter(pdf => pdf.type === 'textbook');
  const notes = pdfs.filter(pdf => pdf.type === 'notes');
  const activePdf = activeId ? pdfs.find(pdf => pdf.id === activeId) : null;

  return (
    <div className="dashboard">
      <Sidebar/>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="pdf-containers">
          <PDFContainer 
            title="Textbooks" 
            type="textbook" 
            pdfs={textbooks} 
            onView={handleViewPdf}
            onDelete={handleDeletePdf}
          />
          <PDFContainer 
            title="Notes" 
            type="notes" 
            pdfs={notes} 
            onView={handleViewPdf}
            onDelete={handleDeletePdf}
          />
        </div>
        
        <DragOverlay>
          {activePdf ? (
            <div className="pdf-card dragging">
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
                <h3>{activePdf.name}</h3>
                <p>Uploaded: {new Date(activePdf.uploadedAt?.toDate()).toLocaleDateString()}</p>
                <p>Size: {(activePdf.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Dashboard;