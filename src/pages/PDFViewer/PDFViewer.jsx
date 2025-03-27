import React from 'react';
import { useLocation } from 'react-router-dom';
import { Viewer } from '@react-pdf-viewer/core'; // Only import Viewer here
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Worker } from '@react-pdf-viewer/core';
import Navbar from '../../components/NavBar';
// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './PDFViewer.scss';

const PDFViewer = () => {
  const location = useLocation();
  const fileUrl = location.state?.file;
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    // Enable sidebar with thumbnails
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
  });

  return (
    <div>
      <Navbar/>
    <div className="pdf-viewer-container">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        {fileUrl ? (
          <div style={{ height: '100%' }}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayoutPluginInstance]}
              theme="light"
              renderLoader={() => (
                <div className="loading">Initializing PDF viewer...</div>
              )}
            />
          </div>
        ) : (
          <div className="no-file">No PDF file selected</div>
        )}
      </Worker>
    </div>
    </div>
  );
};
export default PDFViewer;