import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiPlus, FiCheck, FiType, FiList } from 'react-icons/fi';
import { db, auth } from '../../../firebase';
import { 
  collection, query, where, getDocs, addDoc, doc, 
  updateDoc, runTransaction 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './SemesterPopup.scss';

const SemesterPopup = ({ 
  type, 
  onClose, 
  onAddStudySet, 
  onAddExam,
  semesterId,
  classId
}) => {
  const [studySets, setStudySets] = useState([]);
  const [selectedStudySet, setSelectedStudySet] = useState(null);
  const [user, setUser] = useState(null);
  const [examData, setExamData] = useState({
    title: '',
    timerEnabled: false,
    timerMinutes: 30,
    questions: [],
    themeColor: '#3b82f6'
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: 'multiple',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (type === 'studySets' && user) {
      fetchStudySets();
    }
  }, [type, user]);

  const fetchStudySets = async () => {
    try {
      const q = query(collection(db, 'studySets'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const sets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudySets(sets);
    } catch (error) {
      console.error("Error fetching study sets: ", error);
      setError("Failed to load study sets");
    }
  };

  const handleAddQuestion = () => {
    if (currentQuestion.text.trim() === '') return;
    
    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));
    
    setCurrentQuestion({
      text: '',
      type: 'multiple',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const handleAddExam = async () => {
    if (examData.title.trim() === '' || examData.questions.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create the exam data structure
      const examToAdd = {
        id: Date.now().toString(), // Generate a simple ID
        title: examData.title,
        timerEnabled: examData.timerEnabled,
        timerMinutes: examData.timerMinutes,
        questions: examData.questions,
        themeColor: examData.themeColor,
        createdAt: new Date()
      };

      // Call the parent callback to handle adding to sections.exams
      onAddExam(examToAdd);
      onClose();
    } catch (error) {
      console.error("Error adding exam: ", error);
      setError("Failed to create exam. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  if (type === 'studySets') {
    return (
      <motion.div 
        className="semester-popup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="semester-popup-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
          
          <h2>Add Study Set</h2>
          <p className="popup-subtitle">Select a study set to add to this section</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="study-sets-grid">
            {studySets.length > 0 ? (
              studySets.map(set => (
                <motion.div
                  key={set.id}
                  className={`study-set-card ${selectedStudySet?.id === set.id ? 'selected' : ''}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedStudySet(set)}
                >
                  <h3>{set.name}</h3>
                  <p>{set.cards?.length || 0} cards</p>
                  <div className="study-set-color" style={{ backgroundColor: set.color }} />
                </motion.div>
              ))
            ) : (
              <div className="empty-state">
                <p>No study sets found. Create one first!</p>
              </div>
            )}
          </div>
          
          <div className="popup-actions">
            <button 
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="confirm-btn"
              disabled={!selectedStudySet}
              onClick={() => {
                onAddStudySet(selectedStudySet);
                onClose();
              }}
            >
              Add Study Set
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (type === 'exams') {
    return (
      <motion.div 
        className="semester-popup-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="semester-popup-content exam-creator"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
          
          <h2>Create New Exam</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="exam-tabs">
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Exam Details
            </button>
            <button 
              className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
              disabled={examData.title.trim() === ''}
            >
              Questions ({examData.questions.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
              disabled={examData.questions.length === 0}
            >
              Preview
            </button>
          </div>
          
          {activeTab === 'create' && (
            <div className="exam-details">
              <div className="form-group">
                <label>Exam Title</label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) => setExamData({...examData, title: e.target.value})}
                  placeholder="Enter exam title"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={examData.timerEnabled}
                    onChange={(e) => setExamData({...examData, timerEnabled: e.target.checked})}
                  />
                  <span>Enable Timer</span>
                </label>
                
                {examData.timerEnabled && (
                  <div className="timer-settings">
                    <FiClock />
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={examData.timerMinutes}
                      onChange={(e) => setExamData({...examData, timerMinutes: parseInt(e.target.value) || 30})}
                    />
                    <span>minutes</span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Theme Color</label>
                <div className="color-picker">
                  {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'].map(color => (
                    <div
                      key={color}
                      className={`color-option ${examData.themeColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setExamData({...examData, themeColor: color})}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'questions' && (
            <div className="questions-section">
              <div className="current-question">
                <div className="form-group">
                  <label>Question Text</label>
                  <input
                    type="text"
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                    placeholder="Enter question"
                  />
                </div>
                
                <div className="form-group">
                  <label>Question Type</label>
                  <div className="question-type-toggle">
                    <button
                      className={`toggle-btn ${currentQuestion.type === 'multiple' ? 'active' : ''}`}
                      onClick={() => setCurrentQuestion({...currentQuestion, type: 'multiple'})}
                    >
                      <FiList /> Multiple Choice
                    </button>
                    <button
                      className={`toggle-btn ${currentQuestion.type === 'short' ? 'active' : ''}`}
                      onClick={() => setCurrentQuestion({...currentQuestion, type: 'short'})}
                    >
                      <FiType /> Short Answer
                    </button>
                  </div>
                </div>
                
                {currentQuestion.type === 'multiple' && (
                  <div className="options-section">
                    <label>Options</label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="option-input">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={currentQuestion.correctAnswer === index}
                          onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                <button 
                  className="add-question-btn"
                  onClick={handleAddQuestion}
                  disabled={currentQuestion.text.trim() === '' || 
                    (currentQuestion.type === 'multiple' && currentQuestion.options.some(o => o.trim() === ''))}
                >
                  <FiPlus /> Add Question
                </button>
              </div>
              
              <div className="questions-list">
                <h4>Added Questions ({examData.questions.length})</h4>
                {examData.questions.length > 0 ? (
                  <ul>
                    {examData.questions.map((q, index) => (
                      <li key={index}>
                        <span>{index + 1}. {q.text}</span>
                        <button 
                          className="remove-btn"
                          onClick={() => setExamData({
                            ...examData,
                            questions: examData.questions.filter((_, i) => i !== index)
                          })}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-questions">No questions added yet</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'preview' && (
            <div className="exam-preview">
              <div className="preview-header" style={{ backgroundColor: examData.themeColor }}>
                <h3>{examData.title}</h3>
                {examData.timerEnabled && (
                  <div className="timer-preview">
                    <FiClock /> {examData.timerMinutes} min
                  </div>
                )}
              </div>
              
              <div className="preview-questions">
                {examData.questions.map((q, index) => (
                  <div key={index} className="preview-question">
                    <h4>{index + 1}. {q.text}</h4>
                    {q.type === 'multiple' ? (
                      <ul className="options-preview">
                        {q.options.map((opt, optIndex) => (
                          <li 
                            key={optIndex}
                            className={q.correctAnswer === optIndex ? 'correct' : ''}
                          >
                            {opt}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="short-answer-preview">
                        <input type="text" placeholder="Your answer..." />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="popup-actions">
            <button 
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            {activeTab === 'preview' ? (
              <button 
                className="confirm-btn"
                onClick={handleAddExam}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Exam'}
              </button>
            ) : (
              <button 
                className="next-tab-btn"
                onClick={() => {
                  if (activeTab === 'create') setActiveTab('questions');
                  else if (activeTab === 'questions') setActiveTab('preview');
                }}
                disabled={
                  (activeTab === 'create' && examData.title.trim() === '') ||
                  (activeTab === 'questions' && examData.questions.length === 0) ||
                  loading
                }
              >
                {activeTab === 'create' ? 'Add Questions' : 'Preview Exam'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
};

export default SemesterPopup;