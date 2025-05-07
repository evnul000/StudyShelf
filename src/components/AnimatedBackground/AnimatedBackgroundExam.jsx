// components/AnimatedBackground.jsx
import React from 'react';

const AnimatedBackgroundExam = ({ themeColor }) => {
  // Function to darken the theme color
  const darkenColor = (color, percent) => {
    // Convert hex to RGB
    let r = parseInt(color.substring(1, 3), 16);
    let g = parseInt(color.substring(3, 5), 16);
    let b = parseInt(color.substring(5, 7), 16);

    // Darken each component
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const baseColor = themeColor || '#6200EE'; // Default if no themeColor
  const darkerColor = darkenColor(baseColor, 40); // Darken by 20%

  return (
    <svg 
      className="animated-background"
      preserveAspectRatio="xMidYMid slice"
      viewBox="10 10 80 80"
      style={{
        position: 'fixed',
        top: '10vh',
        left: '-50vh',
        transform: 'rotate(220deg)',
        scale: '1.4'
      }}
    >
      <path 
        fill={darkerColor} 
        className="out-top" 
        d="M37-5C25.1-14.7,5.7-19.1-9.2-10-28.5,1.8-32.7,31.1-19.8,49c15.5,21.5,52.6,22,67.2,2.3C59.4,35,53.7,8.5,37-5Z"
      />
      <path 
        fill={baseColor} 
        className="in-top" 
        d="M20.6,4.1C11.6,1.5-1.9,2.5-8,11.2-16.3,23.1-8.2,45.6,7.4,50S42.1,38.9,41,24.5C40.2,14.1,29.4,6.6,20.6,4.1Z"
      />
    </svg>
  );
};

export default AnimatedBackgroundExam;