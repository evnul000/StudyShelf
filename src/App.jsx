import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen/WelcomeScreen';
import PDFViewer from './pages/PDFViewer/PDFViewer';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import UploadPage from './pages/UploadPage/UploadPage';
import SemesterPage from './pages/Semester/Semester';
import { auth } from './firebase';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      // Define paths that don't require authentication
      const publicPaths = ['/login', '/register', '/'];
      const protectedPaths = ['/dashboard', '/upload', '/view','semester'];
      
      // Don't redirect if we're on a public path
      if (publicPaths.includes(location.pathname)) {
        return;
      }
      
      if (user) {
        // If user is logged in but trying to access auth pages, redirect to dashboard
        if (['/login', '/register'].includes(location.pathname)) {
          navigate('/dashboard');
        }
      } else {
        // If user is not logged in and trying to access protected paths
        if (protectedPaths.includes(location.pathname)) {
          navigate('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]); // Add location.pathname to dependencies

  return (
    <>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/view" element={<PDFViewer />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/semester" element={<SemesterPage/>}/>
      </Routes>
    </>
  );
};

export default App;