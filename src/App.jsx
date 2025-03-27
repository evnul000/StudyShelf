import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import WelcomeScreen from './pages/WelcomeScreen/WelcomeScreen';
import PDFViewer from './pages/PDFViewer/PDFViewer';
import LoginPage from './pages/Auth/Login';
import RegisterPage from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import { auth } from './firebase';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      // Don't redirect if we're already on auth pages
      const isAuthPage = ['/login', '/register'].includes(location.pathname);
      
      if (user) {
        if (!['/dashboard', '/'].includes(location.pathname)) {
          navigate('/dashboard');
        }
      } else if (!isAuthPage) {
        navigate('/login');
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
      </Routes>
    </>
  );
};

export default App;