import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { deleteObject, ref } from 'firebase/storage';
import { 
  collection, query, where, getDocs, getDoc, doc, 
  setDoc, deleteDoc, updateDoc, writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {  DragOverlay, useDroppable } from '@dnd-kit/core';
import { FiMoreVertical, FiPlus, FiChevronDown, FiChevronRight, FiChevronUp, FiTrash2, FiBook, FiFileText, FiX, FiMove, FiEdit, FiSave, FiClock, FiAward, FiLayers } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';
import UploadPage from '../UploadPage/UploadPage';
import Navbar from '../../components/NavBar';
import SemesterPopup from './SemesterPopup/SemesterPopup';
import './Semester.scss';
import AnimatedBackgroundSemester from '../../components/AnimatedBackground/AnimatedBackgroundSemester';

const SemesterPage = () => {
  const [user, setUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSemesterOpen, setNewSemesterOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newSemesterColor, setNewSemesterColor] = useState('#3b82f6');
  const [uploadPopup, setUploadPopup] = useState({
    open: false,
    semesterId: null,
    classId: null,
    type: 'textbook'
  });
  const [activeDragItem, setActiveDragItem] = useState(null);
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchSemesters(currentUser.uid);
        setAnimate(true);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchSemesters = async (userId) => {
    try {
      setLoading(true);
      const q = query(collection(db, 'semesters'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const semesterList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        classes: doc.data().classes || [],
        isOpen: false
      }));
      semesterList.sort((a, b) => b.name.localeCompare(a.name));
      setSemesters(semesterList);
    } catch (error) {
      console.error("Error fetching semesters: ", error);
    } finally {
      setLoading(false);
    }
  };

  const addSemester = async () => {
    if (!newSemesterName.trim()) return;

    try {
      const semesterRef = doc(collection(db, 'semesters'));
      await setDoc(semesterRef, {
        name: newSemesterName,
        color: newSemesterColor,
        userId: user.uid,
        createdAt: new Date(),
        classes: []
      });

      setNewSemesterName('');
      setNewSemesterColor('#3b82f6');
      setNewSemesterOpen(false);
      fetchSemesters(user.uid);
    } catch (error) {
      console.error("Error adding semester: ", error);
    }
  };

  const toggleSemester = (id) => {
    setSemesters(semesters.map(semester => 
      semester.id === id ? { ...semester, isOpen: !semester.isOpen } : semester
    ));
  };

  const deleteSemester = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester and all its classes?')) {
      try {
        await deleteDoc(doc(db, 'semesters', id));
        setSemesters(semesters.filter(semester => semester.id !== id));
      } catch (error) {
        console.error("Error deleting semester: ", error);
      }
    }
  };

  

// Add this state to SemesterPage component
const [semesterPopup, setSemesterPopup] = useState({
  open: false,
  type: null,
  semesterId: null,
  classId: null
});

// Add these handler functions to SemesterPage component
const handleAddStudySet = (studySet) => {
  const { semesterId, classId } = semesterPopup;
  
  // Optimistic UI update
  const updatedSemesters = semesters.map(s => {
    if (s.id === semesterId) {
      return {
        ...s,
        classes: s.classes.map(c => {
          if (c.id === classId) {
            // Ensure sections exists as an object
            const sections = c.sections || {};
            // Add the study set to sections.studySets
            const studySets = sections.studySets || [];
            return {
              ...c,
              sections: {
                ...sections,
                studySets: [...studySets, studySet]
              }
            };
          }
          return c;
        })
      };
    }
    return s;
  });
  setSemesters(updatedSemesters);

  // Firestore update
  const semesterRef = doc(db, 'semesters', semesterId);
  updateDoc(semesterRef, {
    classes: updatedSemesters.find(s => s.id === semesterId).classes
  });
};

const handleAddExam = (exam) => {
  const { semesterId, classId } = semesterPopup;
  
  // Optimistic UI update
  const updatedSemesters = semesters.map(s => {
    if (s.id === semesterId) {
      return {
        ...s,
        classes: s.classes.map(c => {
          if (c.id === classId) {
            const sections = c.sections || {};
            const exams = sections.exams || [];
            return {
              ...c,
              sections: {
                ...sections,
                exams: [...exams, exam]
              }
            };
          }
          return c;
        })
      };
    }
    return s;
  });
  
  setSemesters(updatedSemesters);

  // Firestore update
  const semesterRef = doc(db, 'semesters', semesterId);
  updateDoc(semesterRef, {
    classes: updatedSemesters.find(s => s.id === semesterId).classes
  });
}

 // Update the openUploadPopup function to handle study sets and exams differently
const openUploadPopup = (semesterId, classId, type) => {
  if (type === 'studySets' || type === 'exams') {
    setSemesterPopup({
      open: true,
      type,
      semesterId,
      classId
    });
  } else {
    setUploadPopup({
      open: true,
      semesterId,
      classId,
      type
    });
  }
};

  const closeUploadPopup = () => {
    setUploadPopup({
      open: false,
      semesterId: null,
      classId: null,
      type: 'textbook'
    });
  };
  
  const handleUploadComplete = async (fileData) => {
    try {
      // Optimistic UI update
      const updatedSemesters = semesters.map(s => {
        if (s.id === uploadPopup.semesterId) {
          return {
            ...s,
            classes: s.classes.map(c => {
              if (c.id === uploadPopup.classId) {
                const sections = c.sections || {};
                const currentContent = sections[uploadPopup.type] || [];
                return {
                  ...c,
                  sections: {
                    ...sections,
                    [uploadPopup.type]: [
                      ...currentContent,
                      {
                        id: fileData.id,
                        name: fileData.name,
                        url: fileData.url,
                        size: fileData.size,
                        type: fileData.type,
                        addedAt: new Date()
                      }
                    ]
                  }
                };
              }
              return c;
            })
          };
        }
        return s;
      });
      setSemesters(updatedSemesters);
  
      // Firestore update
      const semesterRef = doc(db, 'semesters', uploadPopup.semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester document not found");
      }
      
      const semesterData = semesterDoc.data();
      const updatedClasses = semesterData.classes.map(cls => {
        if (cls.id === uploadPopup.classId) {
          const sections = cls.sections || {};
          const currentContent = sections[uploadPopup.type] || [];
          return {
            ...cls,
            sections: {
              ...sections,
              [uploadPopup.type]: [
                ...currentContent,
                {
                  id: fileData.id,
                  name: fileData.name,
                  url: fileData.url,
                  size: fileData.size,
                  type: fileData.type,
                  addedAt: new Date()
                }
              ]
            }
          };
        }
        return cls;
      });
  
      await updateDoc(semesterRef, {
        classes: updatedClasses
      });
  
      closeUploadPopup();
      // Refresh the semester data to update the UI
      fetchSemesters(user.uid);
    } catch (error) {
      console.error("Error updating semester with new content:", error);
      // Revert optimistic update if failed
      setSemesters(semesters);
    }
  };



  return (
   
      <div className="semester-page">
        <Navbar/>
        <Sidebar />
       
        <AnimatedBackgroundSemester/>
        <div className={`semester-animation ${animate ? 'animate-in' : ''}`}>
          <div className="header">
            <button 
              className="add-semester-btn"
              onClick={() => setNewSemesterOpen(!newSemesterOpen)}
            >
              <FiPlus /> Add Semester
            </button>
          </div>
        <AnimatePresence>
              {semesterPopup.open && (
                <SemesterPopup
                  type={semesterPopup.type}
                  onClose={() => setSemesterPopup({ open: false, type: null })}
                  onAddStudySet={handleAddStudySet}
                  onAddExam={handleAddExam}
                  semesterId={semesterPopup.semesterId}
                  classId={semesterPopup.classId}
                />
              )}
            </AnimatePresence>
          <AnimatePresence>
            {newSemesterOpen && (
              <motion.div 
                className="new-semester-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  placeholder="Semester name (e.g. Fall 2025)"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                />
                <div className="color-picker">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={newSemesterColor}
                    onChange={(e) => setNewSemesterColor(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button onClick={addSemester}>Save</button>
                  <button onClick={() => setNewSemesterOpen(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {uploadPopup.open && (
              <motion.div 
                className="upload-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeUploadPopup}
              >
                <motion.div 
                  className="upload-modal-content"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="close-button" onClick={closeUploadPopup}>
                    <FiX />
                  </button>
                  <UploadPage 
                      type={uploadPopup.type}
                      onUploadComplete={handleUploadComplete}
                      onCancel={closeUploadPopup}
                      semesterId={uploadPopup.semesterId}
                      classId={uploadPopup.classId}
                    />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : semesters.length === 0 ? (
            <div className="empty-state">
              <FiBook size={64} />
              <p>No semesters yet. Add your first semester to get started!</p>
            </div>
          ) : (
            <div className="semester-list">
              {semesters.map(semester => (
                <SemesterItem
                key={semester.id}
                semester={semester}
                onToggle={toggleSemester}
                onDelete={deleteSemester}
                onAddContent={openUploadPopup}
                userId={user?.uid}
                semesters={semesters}
                setSemesters={setSemesters}
               
              />
              ))}
            </div>
          )}

        </div>
      </div>
  
  );
};

const ContextMenu = ({ currentSection, onSelect, onClose }) => {
  const allowedSections = ['textbook', 'notes', 'homework'];
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]); // Add onClose to dependencies

  return (
    <div className="context-menu" ref={menuRef}>
      {allowedSections.map(section => 
        section !== currentSection && (
          <button 
            key={section}
            onClick={() => onSelect(section)} // Now properly calls onSelect
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        )
      )}
    </div>
  );
};


const SemesterItem = ({ semester, onToggle, onDelete, onAddContent, userId, semesters, setSemesters, fetchSemesters }) => {
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState('#10b981');
  const [addingClass, setAddingClass] = useState(false);
  const [editingSemester, setEditingSemester] = useState(false);
  const [semesterName, setSemesterName] = useState(semester.name);
  const { setNodeRef } = useDroppable({
    id: `semester-${semester.id}`,
    data: {
      type: 'semester',
      semesterId: semester.id
    }
  });

  const handleEditSemester = async () => {
    try {
      await updateDoc(doc(db, 'semesters', semester.id), {
        name: semesterName
      });
      setEditingSemester(false);
    } catch (error) {
      console.error("Error updating semester name:", error);
    }
  };

  const handleDeleteContent = async (semesterId, classId, contentType, contentId) => {
    try {
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester not found");
      }

      const semesterData = semesterDoc.data();
      let itemToDelete = null;

      // Updated to properly access sections
      const updatedClasses = semesterData.classes.map(cls => {
        if (cls.id === classId && cls.sections) {
          if (cls.sections[contentType]) {
            const contentItem = cls.sections[contentType].find(item => item.id === contentId);
            if (contentItem) {
              itemToDelete = contentItem;
              // Create a new object to avoid reference issues
              const updatedSections = { ...cls.sections };
              updatedSections[contentType] = cls.sections[contentType].filter(item => item.id !== contentId);
              return {
                ...cls,
                sections: updatedSections
              };
            }
          }
        }
        return cls;
      });

      // Update Firestore
      await updateDoc(semesterRef, {
        classes: updatedClasses
      });

      // Delete file from Storage if it exists
      if (itemToDelete?.url) {
        const url = itemToDelete.url;
        let filePath = '';
        
        if (url.includes('firebasestorage.googleapis.com')) {
          const matches = url.match(/\/o\/([^?]+)/);
          if (matches) {
            filePath = decodeURIComponent(matches[1]);
            filePath = filePath.replace(/%2F/g, '/');
          }
        } else if (url.startsWith('gs://')) {
          filePath = url.replace(/gs:\/\/[^/]+\//, '');
        }

        if (filePath) {
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
        }
      }

      // Refresh the UI
      onToggle(semesterId);

    } catch (error) {
      console.error("Error deleting content:", error);
      throw error;
    }
  };

  const addClass = async () => {
    if (!newClassName.trim()) return;
  
    try {
      const newClass = {
        id: Date.now().toString(),
        name: newClassName,
        color: newClassColor,
        sections: {}
      };
  
      // Optimistic UI update
      const updatedSemesters = semesters.map(s => {
        if (s.id === semester.id) {
          return {
            ...s,
            classes: [...s.classes, newClass]
          };
        }
        return s;
      });
      setSemesters(updatedSemesters);
  
      // Firestore update
      await updateDoc(doc(db, 'semesters', semester.id), {
        classes: [...semester.classes, newClass]
      });
  
      setNewClassName('');
      setNewClassColor('#10b981');
      setAddingClass(false);
      onToggle(semester.id);
    } catch (error) {
      console.error("Error adding class: ", error);
      // Revert optimistic update if failed
      setSemesters(semesters);
    }
  };

  const deleteClass = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class and all its content?')) {
      try {
        const updatedClasses = semester.classes.filter(cls => cls.id !== classId);
        await updateDoc(doc(db, 'semesters', semester.id), {
          classes: updatedClasses
        });
        onToggle(semester.id);
      } catch (error) {
        console.error("Error deleting class: ", error);
      }
    }
  };

  return (
    <div 
      className="semester-item"
      style={{ 
        borderLeft: `28px solid ${semester.color}`,
        background: `${semester.color}10`
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="semester-header" onClick={() => !editingSemester && onToggle(semester.id)}>
        <div className="semester-title">
          {semester.isOpen ? <FiChevronDown /> : <FiChevronUp />}
          {editingSemester ? (
            <input
              type="text"
              value={semesterName}
              onChange={(e) => setSemesterName(e.target.value)}
              onBlur={handleEditSemester}
              onKeyPress={(e) => e.key === 'Enter' && handleEditSemester()}
              autoFocus
            />
          ) : (
            <h3>{semester.name}</h3>
          )}
        </div>
        <div className="semester-actions">
          <button 
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setEditingSemester(!editingSemester);
              if (editingSemester) {
                handleEditSemester();
              }
            }}
          >
            {editingSemester ? <FiSave /> : <FiEdit />}
          </button>
          <button 
            className="add-class-btn"
            onClick={(e) => {
              e.stopPropagation();
              setAddingClass(!addingClass);
            }}
          >
            <FiPlus /> Add Class
          </button>
          <button 
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(semester.id);
            }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {semester.isOpen && (
          <motion.div
            className="semester-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {addingClass && (
              <motion.div className="new-class-form"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <input
                  type="text"
                  placeholder="Class name"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
                <div className="color-picker">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={newClassColor}
                    onChange={(e) => setNewClassColor(e.target.value)}
                  />
                </div>
                <div className="form-actions">
                  <button onClick={addClass}>Add</button>
                  <button onClick={() => setAddingClass(false)}>Cancel</button>
                </div>
              </motion.div>
            )}

            <div className="class-list">
              {semester.classes.map(cls => (
                <ClassItem 
                  key={cls.id}
                  cls={cls}
                  semesterId={semester.id}
                  onDelete={deleteClass}
                  onAddContent={onAddContent}
                  onDeleteContent={handleDeleteContent}
                  semesters={semesters}
                  setSemesters={setSemesters}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClassItem = ({ cls, semesterId, onDelete, onAddContent, onDeleteContent, semesters, setSemesters, onMoveContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [className, setClassName] = useState(cls.name);
  const [showAddSectionDropdown, setShowAddSectionDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { setNodeRef } = useDroppable({
    id: `class-${cls.id}`,
    data: {
      type: 'class',
      classId: cls.id,
      semesterId: semesterId
    }
  });
  const handleMoveContent = async (itemId, oldSection, newSection, semesterId, classId) => {
    try {
      const updatedSemesters = semesters.map(semester => {
        if (semester.id === semesterId) {
          return {
            ...semester,
            classes: semester.classes.map(cls => {
              if (cls.id === classId) {
                const itemToMove = cls.sections[oldSection].find(item => item.id === itemId);
                return {
                  ...cls,
                  sections: {
                    ...cls.sections,
                    [oldSection]: cls.sections[oldSection].filter(i => i.id !== itemId),
                    [newSection]: [...(cls.sections[newSection] || []), itemToMove]
                  }
                };
              }
              return cls;
            })
          };
        }
        return semester;
      });

      setSemesters(updatedSemesters);

      const semesterRef = doc(db, 'semesters', semesterId);
      await updateDoc(semesterRef, {
        classes: updatedSemesters.find(s => s.id === semesterId).classes
      });
    } catch (error) {
      console.error("Error moving content:", error);
    }
  };
  const handleEditClass = async () => {
    try {
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester not found");
      }

      const semesterData = semesterDoc.data();
      const updatedClasses = semesterData.classes.map(c => 
        c.id === cls.id ? { ...c, name: className } : c
      );

      await updateDoc(semesterRef, {
        classes: updatedClasses
      });
      setEditingClass(false);
    } catch (error) {
      console.error("Error updating class name:", error);
    }
  };
 // Close dropdown when clicking outside
 useEffect(() => {
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowAddSectionDropdown(false);
    }
  };

  if (showAddSectionDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showAddSectionDropdown]);

const handleAddSection = (sectionType) => {
  addSection(sectionType);
  setShowAddSectionDropdown(false); // Close dropdown after selection
};
 // Get list of all possible section types
 const possibleSections = ['textbook', 'notes', 'exams', 'homework', 'studySets'];

 // Filter out sections that already exist
 const availableSections = possibleSections.filter(type => 
   !cls.sections?.[type]
 );
const addSection = async (sectionType) => {
  try {
    // Optimistic UI update
    const updatedSemesters = semesters.map(s => {
      if (s.id === semesterId) {
        return {
          ...s,
          classes: s.classes.map(c => {
            if (c.id === cls.id) {
              const sections = { ...c.sections };
              if (!sections[sectionType]) {
                sections[sectionType] = [];
                
              }
              return { ...c, sections };
            }
            return c;
          })
        };
      }
      return s;
    });
    setSemesters(updatedSemesters);

    // Firestore update
    const semesterRef = doc(db, 'semesters', semesterId);
    const semesterDoc = await getDoc(semesterRef);
    
    if (!semesterDoc.exists()) {
      throw new Error("Semester not found");
    }

    const semesterData = semesterDoc.data();
    const updatedClasses = semesterData.classes.map(c => {
      if (c.id === cls.id) {
        const sections = { ...c.sections || {} };
        if (!sections[sectionType]) {
          sections[sectionType] = [];
         
        }
        return { ...c, sections };
      }
      return c;
    });

    await updateDoc(semesterRef, {
      classes: updatedClasses
    });

    setShowAddSectionDropdown(false);
    if (!isOpen) setIsOpen(true);
  } catch (error) {
    console.error("Error adding section:", error);
    // Revert optimistic update if failed
    setSemesters(semesters);
  }
};

  const deleteSection = async (sectionType) => {
    if (window.confirm(`Are you sure you want to delete the ${sectionType} section and all its content?`)) {
      try {
        const semesterRef = doc(db, 'semesters', semesterId);
        const semesterDoc = await getDoc(semesterRef);
        
        if (!semesterDoc.exists()) {
          throw new Error("Semester not found");
        }

        const semesterData = semesterDoc.data();
        const updatedClasses = semesterData.classes.map(c => {
          if (c.id === cls.id) {
            const sections = { ...c.sections };
            delete sections[sectionType];
            return {
              ...c,
              sections: sections
            };
          }
          return c;
        });

        await updateDoc(semesterRef, {
          classes: updatedClasses
        });
      } catch (error) {
        console.error("Error deleting section:", error);
      }
    }
  };

  // Helper functions
const getSectionIcon = (type) => {
  switch (type) {
    case 'textbook': return <FiBook />;
    case 'notes': return <FiFileText />;
    case 'exams': return <FiAward />;
    case 'homework': return <FiClock />;
    case 'studySets': return <FiLayers />;
    default: return <FiFileText />;
  }
};

const getSectionTitle = (type) => {
  switch (type) {
    case 'textbook': return 'Textbook';
    case 'notes': return 'Notes';
    case 'exams': return 'Exams';
    case 'homework': return 'Homework';
    case 'studySets': return 'Study Sets';
    default: return type;
  }
};

  return (
    <div
      ref={setNodeRef}
      className="class-item"
      style={{ borderLeft: `28px solid ${cls.color}` }}
    >
      <div className="class-header" onClick={() => !editingClass && setIsOpen(!isOpen)}>
        
        <div className="class-title">
          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
          {editingClass ? (
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              onBlur={handleEditClass}
              onKeyPress={(e) => e.key === 'Enter' && handleEditClass()}
              autoFocus
            />
          ) : (
            <h4>{cls.name}</h4>
          )}
        </div>
        <div className="class-actions">
        {availableSections.length > 0 && (
            <div className="add-section-container" ref={dropdownRef}>
              <button 
                className="add-section-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddSectionDropdown(!showAddSectionDropdown);
                }}
              >
                <FiPlus />
                
          </button>

          <AnimatePresence>
            {showAddSectionDropdown && (
              <motion.div 
                className="section-type-dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {availableSections.map(sectionType => (
                  <button 
                    key={sectionType}
                    onClick={() => handleAddSection(sectionType)}
                  >
                    {getSectionIcon(sectionType)}
                    {getSectionTitle(sectionType)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
          <button 
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setEditingClass(!editingClass);
              if (editingClass) {
                handleEditClass();
              }
            }}
          >
            {editingClass ? <FiSave /> : <FiEdit />}
          </button>
          <button 
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(cls.id);
            }}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="class-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="content-sections">
              {cls.sections && Object.keys(cls.sections).length > 0 ? (
                Object.entries(cls.sections).map(([sectionType, items]) => (
                  <ContentSection 
                    key={sectionType}
                    type={sectionType} 
                    items={items || []}
                    color={cls.color}
                    semesterId={semesterId}
                    classId={cls.id}
                    onAddContent={() => onAddContent(semesterId, cls.id, sectionType)}
                    onDeleteContent={(contentId) => onDeleteContent(semesterId, cls.id, sectionType, contentId)}
                    onDeleteSection={() => deleteSection(sectionType)}
                    onMoveContent={handleMoveContent}

                  />
                ))
              ) : (
                <div className="empty-sections">
                  <p>No sections yet. Add your first section!</p>
                </div>
              )}
            </div>

            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentSection = ({ type, items, color, semesterId, classId, onAddContent, onDeleteContent, onDeleteSection, onMoveContent }) => {

  const [showMenuForItem, setShowMenuForItem] = useState(null);

  const handleMove = async (itemId, newSection) => {
    await onMoveContent(itemId, type, newSection, semesterId, classId);
    setShowMenuForItem(null);
  };



  const { setNodeRef, isOver } = useDroppable({
    id: `section-${classId}-${type}`,
    data: {
      type: 'content-section',
      sectionType: type,
      classId: classId,
      semesterId: semesterId
    }
  });
    // Add this new handler
    const handleStudySetClick = (studySet) => {
      navigate(`/studycards/${studySet.id}`);
    };

    const handleExamClick = (exam) => {
      navigate(`/exam/${exam.id}`);
    };

  const getSectionIcon = () => {
    switch (type) {
      case 'textbook': return <FiBook />;
      case 'notes': return <FiFileText />;
      case 'exams': return <FiAward />;
      case 'homework': return <FiClock />;
      case 'studySets': return <FiLayers />;
      default: return <FiFileText />;
    }
  };

  const getSectionTitle = () => {
    switch (type) {
      case 'textbook': return 'Textbooks';
      case 'notes': return 'Notes';
      case 'exams': return 'Exams';
      case 'homework': return 'Homework';
      case 'studySets': return 'Study Sets';
      default: return type;
    }
  };

  const formatFirebaseDate = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    if (typeof date === 'string') {
      try {
        return new Date(date).toLocaleDateString();
      } catch (e) {
        console.error("Error parsing date string:", e);
        return "Unknown date";
      }
    }
    return "Unknown date";
  };

  const navigate = useNavigate();

  const handleView = (item) => {
    // Check if it's a DOCX file
    if (item.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        item.name.endsWith('.docx')) {
          navigate('/document-editor', { 
            state: { 
              documentUrl: item.url,
              documentName: item.name,
              documentId: item.id,
              semesterId: semesterId, // Make sure to pass semesterId
              classId: classId,       // Make sure to pass classId
              sectionPath: 'notes'   // Or whichever section it's in
            } 
          });
    } else {
      // Handle other file types (PDFs) as before
      navigate('/view', { 
        state: { 
          file: item.url,
          fileName: item.name 
        } 
      });
    }
  };

  const handleEditContentName = async (itemId, newName) => {
    try {
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester not found");
      }

      const semesterData = semesterDoc.data();
      const updatedClasses = semesterData.classes.map(c => {
        if (c.id === classId) {
          const updatedContent = c.sections[type].map(content => 
            content.id === itemId ? { ...content, name: newName } : content
          );
          const sections = { ...c.sections, [type]: updatedContent };
          return { ...c, sections };
        }
        return c;
      });

      await updateDoc(semesterRef, {
        classes: updatedClasses
      });
    } catch (error) {
      console.error("Error updating content name:", error);
    }
  };

  return (
    <div 
      className={`content-section ${type}` } 
      ref={setNodeRef}
    >
      <div className="section-header">
        <h5>
          {getSectionIcon()}
          {getSectionTitle()}
          <span>({items?.length || 0})</span>
        </h5>
        <div className="section-actions">
          <button 
            className="add-content-btn"
            onClick={onAddContent}
          >
            <FiPlus /> Add
          </button>
          <button 
            className="delete-section-btn"
            onClick={onDeleteSection}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
      
      {!items || items.length === 0 ? (
        <div className="empty-content">
          <p>No {getSectionTitle().toLowerCase()} yet</p>
        </div>
      ) : (
        <div className="content-list">
          {items.map(item => {
            if (type === 'studySets') {
              return (
                <div 
                  key={item.id} 
                  className="content-item study-set-item"
                  onClick={() => handleStudySetClick(item)}
                >
                  <h3>{item.name}</h3>
                  <p>{item.cards?.length || 0} cards</p>
                  <div className="study-set-color" style={{ backgroundColor: item.color }} />
                </div>
              );
            } else if (type === 'exams') {
              return (
                <div 
                  key={item.id} 
                  className="content-item exam-item"
                  onClick={() => navigate(`/exam/${item.id}`)}
                >
                  <div className="exam-item-header">
                    <h3>{item.title}</h3>
                    {item.timerEnabled && (
                      <div className="exam-timer">
                        <FiClock /> {item.timerMinutes} min
                      </div>
                    )}
                  </div>
                  <p>{item.questions?.length || 0} questions</p>
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteContent(item.id);
                    }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              );
            } else {
              return (
               
                
                    <EditableContentItem
                        key={item.id}
                        item={item}
                        onSave={handleEditContentName}
                        onDelete={onDeleteContent}
                        onView={handleView}
                        addedDate={formatFirebaseDate(item.addedAt)}
                        onMoveContent={onMoveContent}
                        semesterId={semesterId}
                        classId={classId}
                        type={type}
                    
                    />
                    
                
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

const EditableContentItem = ({ type, item, onSave, onDelete, onView, addedDate, classId, onMoveContent, semesterId}) => {
  const [editing, setEditing] = useState(false);
  const [contentName, setContentName] = useState(item.name);

  const handleSave = () => {
    onSave(item.id, contentName);
    setEditing(false);
  };
  const [showMenuForItem, setShowMenuForItem] = useState(null);
  // Properly handle move with all required parameters
  const handleMove = async (itemId, newSection) => {
    try {
      await onMoveContent(itemId, type, newSection, semesterId, classId);
      setShowMenuForItem(null);
    } catch (error) {
      console.error("Error moving content:", error);
    }
  };


  return (
    <div className="content-item">
      <div className="content-info">
        {editing ? (
          <input
            type="text"
            value={contentName}
            onChange={(e) => setContentName(e.target.value)}
            onBlur={handleSave}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        ) : (
          <h6 onClick={() => setEditing(true)}>{item.name}</h6>
          
        )}
        <p>Added: {addedDate}</p>
        
        <div className="item-actions">
        <button 
          className = "view-button"
          onClick={() => onView({
            url: item.url,
            name: item.name,
            id: item.id,
            type: item.type
          })}
        >
          View
        </button>

      
      <button 
        className="edit-btn"
        onClick={() => editing ? handleSave() : setEditing(true)}
      >
        {editing ? <FiSave size={14} /> : <FiEdit size={14} />}
      </button>
      <button 
        className="delete-btn"
        onClick={() => onDelete(item.id)}
      >
        <FiTrash2 size={14} />
      </button>
      
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenuForItem(item.id === showMenuForItem ? null : item.id);
              }}
            >
              <FiMoreVertical />
            </button>
            
            {showMenuForItem === item.id && (
              <ContextMenu
                currentSection={type}
                onSelect={(newSection) => handleMove(item.id, newSection)}
                onClose={() => setShowMenuForItem(null)}
              />
            )}
          </div>
        </div>
        </div>
  );
};



export default SemesterPage;