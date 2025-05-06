// components/AnimatedBackground.jsx
import React from 'react';

const AnimatedBackgroundStudyCards = () => (
  <svg 
    className="animated-background"
    preserveAspectRatio="xMidYMid slice"
    viewBox="10 10 80 80"
    style={{
      position: 'fixed',
      left: '-31%',
      top: '-20%',
      transform: 'rotate(90deg)',
      scale : '.8', 
    }}
  >
    <path fill="#fc7b03" className="out-bottom" d="M105.9,48.6c-12.4-8.2-29.3-4.8-39.4.8-23.4,12.8-37.7,51.9-19.1,74.1s63.9,15.3,76-5.6c7.6-13.3,1.8-31.1-2.3-43.8C117.6,63.3,114.7,54.3,105.9,48.6Z"/>
    <path fill="#e35102" className="in-bottom" d="M102,67.1c-9.6-6.1-22-3.1-29.5,2-15.4,10.7-19.6,37.5-7.6,47.8s35.9,3.9,44.5-12.5C115.5,92.6,113.9,74.6,102,67.1Z"/>
  </svg>
);

export default AnimatedBackgroundStudyCards;