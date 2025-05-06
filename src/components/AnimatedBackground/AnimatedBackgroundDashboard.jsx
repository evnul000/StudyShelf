import React from 'react';

const AnimatedBackgroundDashboard = () => (
  <svg 
    className="animated-background"
    preserveAspectRatio="xMidYMid slice"
    viewBox="10 10 80 80"
    
  >
    <defs>
      <style>
        {`
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .out-top { animation: rotate 20s linear infinite; }
          .in-top { animation: rotate 10s linear infinite; }
          .out-bottom { animation: rotate 25s linear infinite; }
          .in-bottom { animation: rotate 15s linear infinite; }
        `}
      </style>
    </defs>
    
    {/* Top Right Elements */}

      <path 
        fill="#6200EE" 
        className="out-top" 
        d="M37-5C25.1-14.7,5.7-19.1-9.2-10-28.5,1.8-32.7,31.1-19.8,49c15.5,21.5,52.6,22,67.2,2.3C59.4,35,53.7,8.5,37-5Z"
       
      />
      <path 
        fill="#3700B3" 
        className="in-top" 
        d="M20.6,4.1C11.6,1.5-1.9,2.5-8,11.2-16.3,23.1-8.2,45.6,7.4,50S42.1,38.9,41,24.5C40.2,14.1,29.4,6.6,20.6,4.1Z"
   
      />


    {/* Bottom Left Elements */}

  </svg>
);

export default AnimatedBackgroundDashboard;