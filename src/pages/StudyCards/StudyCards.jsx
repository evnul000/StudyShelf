import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FiPlus, FiTrash2, FiEdit2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/NavBar';
import './StudyCards.scss';
import AnimatedBackgroundStudyCards from '../../components/AnimatedBackground/AnimatedBackgroundStudyCards';

const StudyCards = () => {
  const [user, setUser] = useState(null);
  const [studySets, setStudySets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newSetName, setNewSetName] = useState('');
  const [newSetColor, setNewSetColor] = useState('#6366f1');
  const [newCard, setNewCard] = useState({ question: '', answer: '' });
  const [showSetForm, setShowSetForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const navigate = useNavigate();
  const { setId } = useParams();

  const colorOptions = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (!setId) {
          fetchStudySets(currentUser.uid);
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, setId]);

  useEffect(() => {
    if (setId) {
      fetchSpecificStudySet(setId);
    }
  }, [setId]);

  const fetchStudySets = async (userId) => {
    try {
      setLoading(true);
      const q = collection(db, 'studySets');
      const querySnapshot = await getDocs(q);
      const sets = [];
      
      querySnapshot.forEach(doc => {
        if (doc.data().userId === userId) {
          sets.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setStudySets(sets);
    } catch (error) {
      console.error("Error fetching study sets: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificStudySet = async (setId) => {
    try {
      setLoading(true);
      const studySetRef = doc(db, 'studySets', setId);
      const studySetDoc = await getDoc(studySetRef);
      
      if (studySetDoc.exists()) {
        setCurrentSet({ id: studySetDoc.id, ...studySetDoc.data() });
      } else {
        setCurrentSet(null);
      }
    } catch (error) {
      console.error("Error fetching study set: ", error);
      setCurrentSet(null);
    } finally {
      setLoading(false);
    }
  };

  const createStudySet = async () => {
    if (!newSetName.trim()) return;

    try {
      const setRef = doc(collection(db, 'studySets'));
      const setData = {
        name: newSetName,
        color: newSetColor,
        userId: user.uid,
        createdAt: new Date(),
        cards: []
      };
      
      await setDoc(setRef, setData);
      
      setStudySets([...studySets, {
        id: setRef.id,
        ...setData
      }]);
      
      setNewSetName('');
      setShowSetForm(false);
      navigate('/studycards');
    } catch (error) {
      console.error("Error creating study set: ", error);
    }
  };

  const addCardToSet = async () => {
    if (!newCard.question.trim() || !newCard.answer.trim()) return;

    try {
      const updatedCards = [...currentSet.cards, newCard];
      await setDoc(doc(db, 'studySets', currentSet.id), {
        ...currentSet,
        cards: updatedCards
      }, { merge: true });
      
      setCurrentSet({
        ...currentSet,
        cards: updatedCards
      });
      
      setNewCard({ question: '', answer: '' });
      setShowCardForm(false);
    } catch (error) {
      console.error("Error adding card: ", error);
    }
  };

  const deleteStudySet = async (setId) => {
    if (window.confirm('Are you sure you want to delete this study set?')) {
      try {
        await deleteDoc(doc(db, 'studySets', setId));
        setStudySets(studySets.filter(set => set.id !== setId));
        if (currentSet && currentSet.id === setId) {
          setCurrentSet(null);
          navigate('/studycards');
        }
      } catch (error) {
        console.error("Error deleting study set: ", error);
      }
    }
  };

  const deleteCard = async (cardIndex) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const updatedCards = [...currentSet.cards];
        updatedCards.splice(cardIndex, 1);
        
        await setDoc(doc(db, 'studySets', currentSet.id), {
          ...currentSet,
          cards: updatedCards
        }, { merge: true });
        
        setCurrentSet({
          ...currentSet,
          cards: updatedCards
        });
        
        if (currentCardIndex >= updatedCards.length && updatedCards.length > 0) {
          setCurrentCardIndex(updatedCards.length - 1);
        } else if (updatedCards.length === 0) {
          setCurrentCardIndex(0);
        }
      } catch (error) {
        console.error("Error deleting card: ", error);
      }
    }
  };

  const navigateCard = (direction) => {
    setIsFlipped(false);
    if (direction === 'prev') {
      setCurrentCardIndex(prev => (prev > 0 ? prev - 1 : currentSet.cards.length - 1));
    } else {
      setCurrentCardIndex(prev => (prev < currentSet.cards.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="study-cards">
      <Navbar/>
      <Sidebar />
      <AnimatedBackgroundStudyCards className="animated-background"/>
      <div className="study-cards-content">
        {!setId ? (
          <div className="sets-container">
            <h1>Your Study Sets</h1>
            
            <button 
              className="create-set-btn"
              onClick={() => setShowSetForm(true)}
            >
              <FiPlus /> Create New Set
            </button>
            
            {showSetForm && (
              <div className="set-form">
                <input
                  type="text"
                  placeholder="Set name"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                />
                
                <div className="color-options">
                  {colorOptions.map(color => (
                    <div 
                      key={color}
                      className={`color-option ${newSetColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewSetColor(color)}
                    />
                  ))}
                </div>
                
                <div className="form-actions">
                  <button onClick={createStudySet}>Create</button>
                  <button onClick={() => setShowSetForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : studySets.length === 0 ? (
              <div className="empty-state">
                <p>No study sets yet. Create your first one!</p>
              </div>
            ) : (
              <div className="sets-grid">
                {studySets.map(set => (
                  <div 
                    key={set.id}
                    className="set-card"
                    style={{ backgroundColor: set.color }}
                    onClick={() => {
                      setCurrentSet(set);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                      navigate(`/studycards/${set.id}`);
                    }}
                  >
                    <h3>{set.name}</h3>
                    <p>{set.cards?.length || 0} cards</p>
                    <button 
                      className="delete-set-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStudySet(set.id);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="cards-container">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : !currentSet ? (
              <div className="empty-state">
                <p>Study set not found</p>
                <button 
                  className="back-btn"
                  onClick={() => navigate('/studycards')}
                >
                  <FiChevronLeft /> Back to Sets
                </button>
              </div>
            ) : (
              <>
                <div className="cards-header">
                  <button 
                    className="back-btn"
                    onClick={() => {
                      setCurrentSet(null);
                      navigate('/studycards');
                    }}
                  >
                    <FiChevronLeft /> Back to Sets
                  </button>
                  
                  <h2 style={{ color: currentSet.color }}>{currentSet.name}</h2>
                  
                  <button 
                    className="add-card-btn"
                    onClick={() => setShowCardForm(true)}
                  >
                    <FiPlus /> Add Card
                  </button>
                </div>
                
                {showCardForm && (
                  <div className="card-form">
                    <input
                      type="text"
                      placeholder="Question"
                      value={newCard.question}
                      onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Answer"
                      value={newCard.answer}
                      onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                    />
                    
                    <div className="form-actions">
                      <button onClick={addCardToSet}>Add Card</button>
                      <button onClick={() => {
                        setShowCardForm(false);
                        setNewCard({ question: '', answer: '' });
                      }}>Cancel</button>
                    </div>
                  </div>
                )}
                
                {currentSet.cards?.length === 0 ? (
                  <div className="empty-state">
                    <p>No cards in this set yet. Add your first card!</p>
                  </div>
                ) : (
                  <div className="card-viewer">
                    <div className="card-counter">
                      Card {currentCardIndex + 1} of {currentSet.cards?.length}
                    </div>
                    
                    <div 
                      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      <div className="flashcard-front">
                        {currentSet.cards[currentCardIndex]?.question}
                      </div>
                      <div className="flashcard-back">
                        {currentSet.cards[currentCardIndex]?.answer}
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button 
                        className="nav-btn prev-btn"
                        onClick={() => navigateCard('prev')}
                      >
                        <FiChevronLeft /> Previous
                      </button>
                      

                      <button 
                        className="delete-card-btn"
                        onClick={() => deleteCard(currentCardIndex)}
                      >
                        <FiTrash2 /> Delete Card
                      </button>
                      

                      <button 
                        className="nav-btn next-btn"
                        onClick={() => navigateCard('next')}
                      >
                        Next <FiChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCards;