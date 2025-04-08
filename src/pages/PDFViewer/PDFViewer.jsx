import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { Worker } from '@react-pdf-viewer/core';
import Navbar from '../../components/NavBar';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './PDFViewer.scss';

const PDFViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileUrl = location.state?.file;

  useEffect(() => {
    if (!fileUrl) {
      navigate('/dashboard');
    }
  }, [fileUrl, navigate]);

  if (!fileUrl) {
    return null;
  }

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
    ],
  });

  return (
    <div className="pdf-viewer-page">
      <Navbar/>
      <div className="pdf-viewer-container">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div style={{ height: '100%' }}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[defaultLayoutPluginInstance]}
              theme="light"
              renderLoader={() => (
                <div className="loading">Loading PDF...</div>
              )}
              onError={(error) => {
                console.error(error);
                alert('Failed to load PDF. Please try again.');
                navigate('/dashboard');
              }}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer;