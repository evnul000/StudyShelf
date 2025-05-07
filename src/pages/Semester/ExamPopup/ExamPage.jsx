import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiClock, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { db } from '../../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import Navbar from '../../../components/NavBar';
import Sidebar from '../../../components/Sidebar/Sidebar';
import AnimatedBackgroundExam from '../../../components/AnimatedBackground/AnimatedBackgroundExam';
import './ExamPage.scss';

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const q = query(collection(db, 'semesters'));
        const querySnapshot = await getDocs(q);
        
        let foundExam = null;
        querySnapshot.forEach(semesterDoc => {
          const classes = semesterDoc.data().classes || [];
          classes.forEach(cls => {
            const exams = cls.sections?.exams || [];
            const examData = exams.find(e => e.id === examId);
            if (examData) {
              foundExam = { ...examData, semesterId: semesterDoc.id, classId: cls.id };
            }
          });
        });

        if (foundExam) {
          setExam(foundExam);
          setAnswers(new Array(foundExam.questions.length).fill(null));
        } else {
          setError('Exam not found');
        }
      } catch (err) {
        setError('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

// In handleNavigation function, update the check:
const handleNavigation = (direction) => {
  if (direction === 'next') {
    // Change from truthy check to explicit null check
    if (answers[currentQuestion] === null && 
        !window.confirm('You haven\'t answered this question. Continue anyway?')) {
      return;
    }
    setCurrentQuestion(prev => Math.min(prev + 1, exam.questions.length - 1));
  } else {
    setCurrentQuestion(prev => Math.max(prev - 1, 0));
  }
};

// Update calculateResults function:
const calculateResults = () => {
  const correct = exam.questions.reduce((acc, question, index) => {
    const answer = answers[index];
    
    // Handle unanswered questions
    if (answer === null || answer === undefined) return acc;
    
    if (question.type === 'multiple') {
      // Ensure numeric comparison
      return acc + (Number(answer) === Number(question.correctAnswer) ? 1 : 0);
    }
    
    // Handle text answers with trim and case insensitivity
    const cleanUserAnswer = answer.toString().trim().toLowerCase();
    const cleanCorrectAnswer = question.text.trim().toLowerCase();
    return acc + (cleanUserAnswer === cleanCorrectAnswer ? 1 : 0);
  }, 0);

  return {
    correct,
    total: exam.questions.length,
    percentage: exam.questions.length > 0 
      ? Math.round((correct / exam.questions.length) * 100)
      : 0
  };
};

  if (loading) {
    return <div className="exam-loading">Loading Exam...</div>;
  }

  if (error) {
    return (
      <div className="exam-error">
        <h2>{error}</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className='exam'>
    <Navbar/>
    <Sidebar/>
    <AnimatedBackgroundExam className='animated-background' themeColor={exam.themeColor}/>
    <motion.div 
      className="exam-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ '--theme-color': exam.themeColor }}
    >
      <div className="exam-header">
        <h1>{exam.title}</h1>
        {exam.timerEnabled && (
          <div className="exam-timer">
            <FiClock /> {exam.timerMinutes} minutes
          </div>
        )}
      </div>

      {!showResults ? (
        <>
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentQuestion + 1) / exam.questions.length) * 100}%`,
                transition: { duration: 0.3 }
              }}
            />
          </div>

          <AnimatePresence mode='wait'>
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="question-container"
            >
              <Question
                question={exam.questions[currentQuestion]}
                answer={answers[currentQuestion]}
                onAnswer={handleAnswer}
              />
            </motion.div>
          </AnimatePresence>

          <div className="navigation-controls">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={currentQuestion === 0}
            >
              <FiArrowLeft /> Previous
            </button>
            
            <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
            
            {currentQuestion < exam.questions.length - 1 ? (
              <button onClick={() => handleNavigation('next')}>
                Next <FiArrowRight />
              </button>
            ) : (
              <button 
                className="finish-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to finish the exam?')) {
                    setShowResults(true);
                  }
                }}
              >
                Finish Exam
              </button>
            )}
          </div>
        </>
      ) : (
        <Results 
          questions={exam.questions}
          answers={answers}
          results={calculateResults()}
          onRetry={() => {
            setAnswers(new Array(exam.questions.length).fill(null));
            setCurrentQuestion(0);
            setShowResults(false);
          }}
        />
      )}
    </motion.div>
    </div>
  );
};

// Update the Question component's answer handling:
const Question = ({ question, answer, onAnswer }) => {
  return (
    <div className="question">
      <h3>{question.text}</h3>
      
      {question.type === 'multiple' ? (
        <div className="options-grid">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              className={`option ${answer === index ? 'selected' : ''}`}
              onClick={() => onAnswer(index)}  // Now properly passes index
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {option}
              {answer === index && (
                <motion.span 
                  className="check-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <FiCheck />
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value.trim())}  // Add trim
          placeholder="Type your answer here..."
        />
      )}
    </div>
  );
};
// Add these constants at the top of the file
const MESSAGES = {
  low: [
    "Keep trying, you'll get there 🌱",
    "Room for growth, keep learning 📚",
    "Every attempt helps you grow 🌱",
    "This is a learning opportunity 💡",
    "Don't give up, keep going 💪"
  ],
  medium: [
    "Good progress, keep building momentum 🚀",
    "Solid effort, continue to improve 📈",
    "You're on the right track 🛤️",
    "Showing good understanding 👍",
    "Halfway to mastery! Keep going 🎯"
  ],
  high: [
    "Excellent work, keep striving for excellence 🌟",
    "Great job, you're showing strong understanding 🎓",
    "Fantastic effort, well done! 🎉",
    "Impressive work, keep it up 💯",
    "You're doing really well! 🏆"
  ],
  perfect: [
    "Absolutely perfect! Outstanding achievement 🎖️",
    "Flawless! Exceptional understanding 💎",
    "100%! You aced it! 🏅",
    "Perfect score! Well done! 🧠",
    "You nailed it! Congratulations! 🥇"
  ]
};


const Results = ({ questions, answers, results, onRetry }) => {
  // Determine score category
  const getScoreCategory = () => {
    if (results.percentage === 100) return 'perfect';
    if (results.percentage >= 80) return 'high';
    if (results.percentage >= 65) return 'medium';
    return 'low';
  };

  // Get random message
  const getRandomMessage = () => {
    const category = getScoreCategory();
    const messages = MESSAGES[category];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get score color
  const getScoreColor = () => {
    switch(getScoreCategory()) {
      case 'low': return '#ef4444';
      case 'medium': return '#eab308';
      case 'high': return '#22c55e';
      case 'perfect': return '#07de15';
      default: return '#3b82f6';
    }
  };
  return (
    <motion.div
      className="results-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="results-summary">
        <h2>{getRandomMessage()}</h2>
        <div className="score-circle">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="percentage"
            style={{ color: getScoreColor() }}
          >
            {results.percentage}%
          </motion.div>
          <svg>
            <circle
              className="score-track"
              cx="100"
              cy="100"
              r="90"
            />
            <circle
              className="score-progress"
              cx="100"
              cy="100"
              r="90"
              style={{
                stroke: getScoreColor(),
                strokeDashoffset: 565 - (565 * results.percentage) / 100
              }}
            />
          </svg>
        </div>
        <p>
          {results.correct} / {results.total} Correct Answers
        </p>
        <div className="result-actions">
          <button onClick={onRetry}>Try Again</button>
          <button onClick={() => window.location.reload()}>Review Answers</button>
        </div>
      </div>

      <div className="detailed-results">
        {questions.map((question, index) => (
          <div 
            key={index}
            className={`question-result ${answers[index] === undefined ? 'unanswered' : 
              question.type === 'multiple' ? 
                (answers[index] === question.correctAnswer ? 'correct' : 'incorrect') :
                (answers[index].toLowerCase() === question.text.toLowerCase() ? 'correct' : 'incorrect')
            }`}
          >
            <h4>Question {index + 1}: {question.text}</h4>
            {question.type === 'multiple' ? (
              <div className="options-result">
                {question.options.map((opt, optIndex) => (
                  <span
                    key={optIndex}
                    className={`option ${optIndex === question.correctAnswer ? 'correct' : ''} 
                      ${answers[index] === optIndex ? 'selected' : ''}`}
                  >
                    {opt}
                    {optIndex === question.correctAnswer && <FiCheck className="correct-icon" />}
                    {answers[index] === optIndex && optIndex !== question.correctAnswer && (
                      <FiX className="incorrect-icon" />
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div className="short-answer-result">
                <p>Your answer: {answers[index] || 'No answer'}</p>
                <p>Correct answer: {question.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ExamPage;