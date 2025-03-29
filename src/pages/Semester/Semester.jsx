import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiChevronDown, FiChevronRight, FiTrash2, FiEdit2, FiBook, FiFileText } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './Semester.scss';

const SemesterPage = () => {
  const [user, setUser] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSemesterOpen, setNewSemesterOpen] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newSemesterColor, setNewSemesterColor] = useState('#3b82f6');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

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
      // Sort by semester name (reverse chronological)
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

  return (
    <div className="semester-page">
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

      {loading ? (
        <div className="loading">Loading...</div>
      ) : semesters.length === 0 ? (
        <div className="empty-state">
          <FiBook size={64} />
          <p>No semesters yet. Add your first semester to get started!</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
        >
          <SortableContext 
            items={semesters.map(semester => semester.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="semester-list">
              {semesters.map(semester => (
                <SemesterItem
                  key={semester.id}
                  semester={semester}
                  onToggle={toggleSemester}
                  onDelete={deleteSemester}
                  userId={user?.uid}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

const SemesterItem = ({ semester, onToggle, onDelete, userId }) => {
  const [newClassName, setNewClassName] = useState('');
  const [newClassColor, setNewClassColor] = useState('#10b981');
  const [addingClass, setAddingClass] = useState(false);

  const addClass = async () => {
    if (!newClassName.trim()) return;

    try {
      const updatedClasses = [...semester.classes, {
        id: Date.now().toString(),
        name: newClassName,
        color: newClassColor,
        textbooks: [],
        notes: []
      }];

      await updateDoc(doc(db, 'semesters', semester.id), {
        classes: updatedClasses
      });

      setNewClassName('');
      setNewClassColor('#10b981');
      setAddingClass(false);
      onToggle(semester.id); // Refresh the view
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
        onToggle(semester.id); // Refresh the view
      } catch (error) {
        console.error("Error deleting class: ", error);
      }
    }
  };

  return (
    <motion.div 
      className="semester-item"
      style={{ borderLeft: `4px solid ${semester.color}` }}
      layout
      transition={{ duration: 0.2 }}
    >
      <div className="semester-header" onClick={() => onToggle(semester.id)}>
        <div className="semester-title">
          {semester.isOpen ? <FiChevronDown /> : <FiChevronRight />}
          <h3>{semester.name}</h3>
        </div>
        <div className="semester-actions">
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
              <motion.div 
                className="new-class-form"
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
                  <ClassItem 
                    key={cls.id} 
                    cls={cls} 
                    semesterId={semester.id}
                    onDelete={deleteClass}
                    userId={userId}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ClassItem = ({ cls, semesterId, onDelete, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [addingContent, setAddingContent] = useState(false);
  const [contentType, setContentType] = useState('textbook');
  const [contentName, setContentName] = useState('');

  const addContent = async () => {
    if (!contentName.trim()) return;

    try {
      const classRef = doc(db, 'semesters', semesterId);
      const updatedClasses = // ... logic to add content to the class
      
      await updateDoc(classRef, {
        classes: updatedClasses
      });

      setContentName('');
      setAddingContent(false);
      setIsOpen(true); // Keep the class open after adding
    } catch (error) {
      console.error("Error adding content: ", error);
    }
  };

  return (
    <motion.div 
      className="class-item"
      style={{ borderLeft: `4px solid ${cls.color}` }}
      layout
      transition={{ duration: 0.2 }}
    >
      <div className="class-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="class-title">
          {isOpen ? <FiChevronDown /> : <FiChevronRight />}
          <h4>{cls.name}</h4>
        </div>
        <div className="class-actions">
          <button 
            className="add-content-btn"
            onClick={(e) => {
              e.stopPropagation();
              setAddingContent(!addingContent);
            }}
          >
            <FiPlus /> Add Content
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
            {addingContent && (
              <motion.div 
                className="new-content-form"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <option value="textbook">Textbook</option>
                  <option value="notes">Notes</option>
                </select>
                <input
                  type="text"
                  placeholder={`${contentType} name`}
                  value={contentName}
                  onChange={(e) => setContentName(e.target.value)}
                />
                <div className="form-actions">
                  <button onClick={addContent}>Add</button>
                  <button onClick={() => setAddingContent(false)}>Cancel</button>
                </div>
              </motion.div>
            )}

            <div className="content-sections">
              <ContentSection 
                type="textbook" 
                items={cls.textbooks} 
                color={cls.color}
              />
              <ContentSection 
                type="notes" 
                items={cls.notes} 
                color={cls.color}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ContentSection = ({ type, items, color }) => {
  return (
    <div className={`content-section ${type}`}>
      <h5>
        {type === 'textbook' ? <FiBook /> : <FiFileText />}
        {type === 'textbook' ? 'Textbooks' : 'Notes'}
        <span>({items.length})</span>
      </h5>
      
      {items.length === 0 ? (
        <div className="empty-content">
          <p>No {type}s yet</p>
        </div>
      ) : (
        <DndContext>
          <SortableContext items={items.map(item => item.id)}>
            <div className="content-list">
              {items.map(item => (
                <motion.div 
                  key={item.id}
                  className="content-item"
                  style={{ backgroundColor: `${color}20`, borderColor: color }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="content-info">
                    <h6>{item.name}</h6>
                    <p>Added: {new Date(item.addedAt).toLocaleDateString()}</p>
                  </div>
                  <button className="delete-btn">
                    <FiTrash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default SemesterPage;