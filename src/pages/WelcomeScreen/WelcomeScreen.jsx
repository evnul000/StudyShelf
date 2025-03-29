import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.scss';
import Navbar from '../../components/NavBar';
import welcomeGif from '../../assets/welcome.gif'; // Import the GIF

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      navigate('/view', { state: { file: fileURL } });
    }
  };

  return (
    <div className="welcome-container">
      <div className="background-overlay" />
      <Navbar/>
      <div className="welcome-screen"> 
        <h1>Welcome to StudyShelf</h1>
        <div 
          className="upload-box" 
          onClick={() => document.getElementById('fileInput').click()}
        >
          <p>Drag & Drop your PDF here or Click to Browse</p>
          <input 
            id="fileInput" 
            type="file" 
            accept="application/pdf" 
            onChange={onFileChange} 
            hidden 
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;