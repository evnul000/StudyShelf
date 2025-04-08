import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { deleteObject, ref } from 'firebase/storage';
import { 
  collection, query, where, getDocs, getDoc, doc, 
  setDoc, deleteDoc, updateDoc, writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { FiPlus, FiChevronDown, FiChevronRight, FiTrash2, FiBook, FiFileText, FiX, FiMove, FiEdit, FiSave } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar/Sidebar';
import UploadPage from '../UploadPage/UploadPage';
import './Semester.scss';


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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchSemesters(currentUser.uid);
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

  const openUploadPopup = (semesterId, classId, type) => {
    setUploadPopup({
      open: true,
      semesterId,
      classId,
      type
    });
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
      const semesterRef = doc(db, 'semesters', uploadPopup.semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester document not found");
      }
      
      const semesterData = semesterDoc.data();
      
      const updatedClasses = semesterData.classes.map(cls => {
        if (cls.id === uploadPopup.classId) {
          const currentContent = cls[uploadPopup.type] || [];
          return {
            ...cls,
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
          };
        }
        return cls;
      });

      await updateDoc(semesterRef, {
        classes: updatedClasses
      });

      closeUploadPopup();
      fetchSemesters(user.uid);
    } catch (error) {
      console.error("Error updating semester with new content:", error);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveDragItem(active.data.current);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!active || !over || active.id === over.id) {
      setActiveDragItem(null);
      return;
    }
  
    const activeData = active.data.current;
    const overData = over.data.current;
  
    if (!activeData || !overData) {
      setActiveDragItem(null);
      return;
    }
  
    try {
      if (activeData.type === 'pdf' && overData.type === 'content-section') {
        // If moving within the same class but different section
        if (activeData.classId === overData.classId) {
          await movePDFBetweenSections(activeData, overData);
        } 
        // If moving to a different class
        else {
          await movePDFToDifferentClass(activeData, overData);
        }
      }
      
      fetchSemesters(user.uid);
    } catch (error) {
      console.error("Error handling drag:", error);
    } finally {
      setActiveDragItem(null);
    }
  };

  const movePDFBetweenSections = async (activeData, overData) => {
    const { semesterId, classId, pdf, currentSection } = activeData;
    const { sectionType: targetSection } = overData;
  
    try {
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error(`Semester document not found: ${semesterId}`);
      }

      const semesterData = semesterDoc.data();

      const updatedClasses = semesterData.classes.map(cls => {
        if (cls.id === classId) {
          // Remove from current section
          const currentItems = cls[currentSection] || [];
          const filteredCurrentItems = currentItems.filter(item => item.id !== pdf.id);
          
          // Add to target section
          const targetItems = cls[targetSection] || [];
          const updatedTargetItems = [...targetItems];
          
          // Only add if not already in target section
          if (!targetItems.some(item => item.id === pdf.id)) {
            updatedTargetItems.push(pdf);
          }
          
          return {
            ...cls,
            [currentSection]: filteredCurrentItems,
            [targetSection]: updatedTargetItems
          };
        }
        return cls;
      });

      await updateDoc(semesterRef, { classes: updatedClasses });
    } catch (error) {
      console.error('Error in movePDFBetweenSections:', error);
      throw error;
    }
  };
  const movePDFToDifferentClass = async (activeData, overData) => {
    const { semesterId, classId: sourceClassId, pdf, currentSection } = activeData;
    const { classId: targetClassId, sectionType: targetSection = currentSection } = overData;
  
    try {
      // Get the semester document
      const semesterDoc = await getDoc(doc(db, 'semesters', semesterId));
      
      if (!semesterDoc.exists()) {
        throw new Error("Semester not found");
      }
  
      // Create a DEEP COPY of the data
      const semesterData = JSON.parse(JSON.stringify(semesterDoc.data()));
  
      // Find the source and target classes
      const sourceClassIndex = semesterData.classes.findIndex(c => c.id === sourceClassId);
      const targetClassIndex = semesterData.classes.findIndex(c => c.id === targetClassId);
  
      if (sourceClassIndex === -1 || targetClassIndex === -1) {
        throw new Error("Source or target class not found");
      }
  
      // 1. Remove from source class's current section
      semesterData.classes[sourceClassIndex][currentSection] = 
        semesterData.classes[sourceClassIndex][currentSection]?.filter(item => item.id !== pdf.id) || [];
  
      // 2. Add to target class's target section
      if (!semesterData.classes[targetClassIndex][targetSection]) {
        semesterData.classes[targetClassIndex][targetSection] = [];
      }
      semesterData.classes[targetClassIndex][targetSection].push(pdf);
  
      // 3. Update the semester document
      await updateDoc(doc(db, 'semesters', semesterId), {
        classes: semesterData.classes
      });
  
    } catch (error) {
      console.error("Error moving PDF between classes:", error);
      throw error;
    }
  };
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="semester-page">
        <Sidebar />
        <div className="header">
          <h1><FaGraduationCap /> My Semesters</h1>
          <button 
            className="add-semester-btn"
            onClick={() => setNewSemesterOpen(!newSemesterOpen)}
          >
            <FiPlus /> Add Semester
          </button>
        </div>

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
              />
            ))}
          </div>
        )}

        <DragOverlay>
          {activeDragItem ? (
            <div className="drag-preview">
              {activeDragItem.type === 'pdf' ? (
                <div className="content-item">
                  <h6>{activeDragItem.pdf.name}</h6>
                  <FiMove className="drag-handle" />
                </div>
              ) : activeDragItem.type === 'class' ? (
                <div className="class-item">
                  <h4>{activeDragItem.cls.name}</h4>
                </div>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

const SemesterItem = ({ semester, onToggle, onDelete, onAddContent, userId }) => {
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

      const updatedClasses = semesterData.classes.map(cls => {
        if (cls.id === classId && cls[contentType]) {
          const contentItem = cls[contentType].find(item => item.id === contentId);
          if (contentItem) {
            itemToDelete = contentItem;
            return {
              ...cls,
              [contentType]: cls[contentType].filter(item => item.id !== contentId)
            };
          }
        }
        return cls;
      });

      await updateDoc(semesterRef, {
        classes: updatedClasses
      });

      if (itemToDelete?.url) {
        try {
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
        } catch (storageError) {
          console.error("Error deleting from Storage:", storageError);
        }
      }

      onToggle(semesterId);
    } catch (error) {
      console.error("Error in deletion process:", error);
      throw error;
    }
  };

  const addClass = async () => {
    if (!newClassName.trim()) return;

    try {
      const updatedClasses = [...semester.classes, {
        id: Date.now().toString(),
        name: newClassName,
        color: newClassColor,
        textbook: [],
        notes: []
      }];

      await updateDoc(doc(db, 'semesters', semester.id), {
        classes: updatedClasses
      });

      setNewClassName('');
      setNewClassColor('#10b981');
      setAddingClass(false);
      onToggle(semester.id);
    } catch (error) {
      console.error("Error adding class: ", error);
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
      ref={setNodeRef}
      className="semester-item"
      style={{ 
        borderLeft: `8px solid ${semester.color}`,
        background: `${semester.color}10`
      }}
    >
      <div className="semester-header" onClick={() => !editingSemester && onToggle(semester.id)}>
        <div className="semester-title">
          {semester.isOpen ? <FiChevronDown /> : <FiChevronRight />}
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
            transition={{ duration: 0.3 }}
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

            {semester.classes.length === 0 ? (
              <div className="empty-classes">
                <FiFileText size={48} />
                <p>No classes yet. Add your first class!</p>
              </div>
            ) : (
              <div className="class-list">
                {semester.classes.map(cls => (
                  <div key={cls.id} className="class-wrapper">
                    <ClassItem 
                      cls={cls} 
                      semesterId={semester.id}
                      onDelete={deleteClass}
                      onAddContent={onAddContent}
                      onDeleteContent={handleDeleteContent}
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClassItem = ({ cls, semesterId, onDelete, onAddContent, onDeleteContent }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [className, setClassName] = useState(cls.name);
  const { setNodeRef } = useDroppable({
    id: `class-${cls.id}`,
    data: {
      type: 'class',
      classId: cls.id,
      semesterId: semesterId
    }
  });

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

  return (
    <div
      ref={setNodeRef}
      className="class-item"
      style={{ borderLeft: `8px solid ${cls.color}` }}
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
              <ContentSection 
                type="textbook" 
                items={cls.textbook || []}
                color={cls.color}
                semesterId={semesterId}
                classId={cls.id}
                onAddContent={() => onAddContent(semesterId, cls.id, 'textbook')}
                onDeleteContent={(contentId) => onDeleteContent(semesterId, cls.id, 'textbook', contentId)}
              />
              <ContentSection 
                type="notes" 
                items={cls.notes || []}
                color={cls.color}
                semesterId={semesterId}
                classId={cls.id}
                onAddContent={() => onAddContent(semesterId, cls.id, 'notes')}
                onDeleteContent={(contentId) => onDeleteContent(semesterId, cls.id, 'notes', contentId)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentSection = ({ type, items, color, semesterId, classId, onAddContent, onDeleteContent }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${classId}-${type}`,
    data: {
      type: 'content-section',
      sectionType: type,
      classId: classId,
      semesterId: semesterId
    }
  });

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
    navigate('/view', { state: { file: item.url } });
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
          const updatedContent = c[type].map(content => 
            content.id === itemId ? { ...content, name: newName } : content
          );
          return { ...c, [type]: updatedContent };
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
      className={`content-section ${type} ${isOver ? 'drag-over' : ''}`} 
      ref={setNodeRef}
    >
      <div className="section-header">
        <h5>
          {type === 'textbook' ? <FiBook /> : <FiFileText />}
          {type === 'textbook' ? 'Textbooks' : 'Notes'}
          <span>({items?.length || 0})</span>
        </h5>
        <button 
          className="add-content-btn"
          onClick={onAddContent}
        >
          <FiPlus /> Add
        </button>
      </div>
      
      {!items || items.length === 0 ? (
        <div className="empty-content">
          <p>No {type === 'textbook' ? 'textbooks' : 'notes'} yet</p>
        </div>
      ) : (
        <div className="content-list">
          {items.map(item => (
            <DraggableItem 
              key={item.id} 
              item={item} 
              type={type}
              semesterId={semesterId}
              classId={classId}
            >
              {({ dragHandleProps }) => (
                <EditableContentItem
                  item={item}
                  onSave={handleEditContentName}
                  onDelete={onDeleteContent}
                  onView={handleView}
                  addedDate={formatFirebaseDate(item.addedAt)}
                  dragHandleProps={dragHandleProps}
                />
              )}
            </DraggableItem>
          ))}
        </div>
      )}
    </div>
  );
};

const EditableContentItem = ({ item, onSave, onDelete, onView, addedDate, dragHandleProps }) => {
  const [editing, setEditing] = useState(false);
  const [contentName, setContentName] = useState(item.name);

  const handleSave = () => {
    onSave(item.id, contentName);
    setEditing(false);
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
        <button 
          className="view-button"
          onClick={onView}
        >
          View
        </button>
      </div>
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
      <div {...dragHandleProps}>
        <FiMove className="drag-handle" />
      </div>
    </div>
  );
};


const DraggableItem = ({ item, type, semesterId, classId, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `pdf-${item.id}`,
    data: {
      type: 'pdf',
      pdf: item,
      currentSection: type,
      semesterId: semesterId,
      classId: classId
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="draggable-item"
    >
      {children({
        dragHandleProps: {
          ...attributes,
          ...listeners
        }
      })}
    </div>
  );
};

export default SemesterPage;