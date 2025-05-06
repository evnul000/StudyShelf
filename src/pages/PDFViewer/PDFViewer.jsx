import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Navbar from '../../components/NavBar';
import './PDFViewer.scss';
import Sidebar from '../../components/Sidebar/Sidebar';

const PDFViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileUrl = location.state?.file;
  const fileName = location.state?.fileName || 'Study Material';
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const auth = getAuth();
  const adobeDCRef = useRef(null);
  const annotationManagerRef = useRef(null);

  const handleRetry = () => {
    window.location.reload();
  };

  const getPdfDocId = (url) => {
    const base64 = btoa(url);
    return base64
      .replace(/\//g, '_')  // Replace '/' with '_'
      .replace(/\+/g, '-')  // Replace '+' with '-'
      .replace(/=+$/, '');  // Remove trailing '='
  };
  
  // Save annotations to Firebase
  const saveAnnotationsToFirebase = async (annotations) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in, skipping save');
        return;
      }

      console.log('Attempting to save annotations:', annotations);
      
      if (!annotations || annotations.length === 0) {
        console.log('No annotations to save');
        return;
      }
      const docId = getPdfDocId(fileUrl);
      const docRef = doc(db, 'userAnnotations', user.uid, 'pdfAnnotations', docId);

      await setDoc(docRef, {
        annotations: JSON.stringify(annotations),
        lastUpdated: new Date().toISOString(),
        pdfUrl: fileUrl
      }, { merge: true });
      
      console.log('Successfully saved annotations to Firebase');
      alert('Annotations saved successfully!');
    } catch (err) {
      console.error('Error saving annotations:', err);
      alert('Failed to save annotations');
    }
  };

  // Load annotations from Firebase
  const loadAnnotationsFromFirebase = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in, skipping load');
        return null;
      }

      const docId = getPdfDocId(fileUrl);
      const docRef = doc(db, 'userAnnotations', user.uid, 'pdfAnnotations', docId);
      
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.annotations) {
          const annotations = JSON.parse(data.annotations);
          if (Array.isArray(annotations)) {
            console.log('Loaded annotations:', annotations);
            return annotations;
          }
        }
      }
      return null;
    } catch (err) {
      console.error('Error loading annotations:', err);
      return null;
    }
  };

  const handleSaveClick = async () => {
    if (annotationManagerRef.current) {
      try {
        const annotations = await annotationManagerRef.current.getAnnotations();
        await saveAnnotationsToFirebase(annotations);
      } catch (err) {
        console.error('Error saving annotations:', err);
      }
    }
  };

  useEffect(() => {
    if (!fileUrl) {
      console.error('No file URL provided, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    const initializeViewer = async () => {
      try {
        // Load saved annotations first
        const savedAnnotations = await loadAnnotationsFromFirebase();
        const fileId = getPdfDocId(fileUrl);

        // Initialize Adobe DC View
        const adobeDC = new window.AdobeDC.View({
          clientId: '163afa9a2fa14f8b8c97e82966d74327',
          divId: 'adobe-dc-view'
        });
        adobeDCRef.current = adobeDC;

        // Preview configuration
        const previewConfig = {
          content: {
            location: { url: fileUrl }
          },
          metaData: { 
            fileName: fileName,
            id: fileId
          }
        };

        // Viewer configuration - IMPORTANT: showDownloadPDF must be true for save button
        const viewerConfig = {
          showAnnotationTools: true,
          enableAnnotationAPIs: true,
          showDownloadPDF: false, // This enables the save button
          showPrintPDF: false,
          showLeftHandPanel: true,
          defaultViewMode: 'FIT_WIDTH',
          enableFormFilling: false,
          showAnnotationSave: true // Explicitly show annotation save button
        };

        // Preview the file
        const previewPromise = adobeDC.previewFile(previewConfig, viewerConfig);

        // After preview is ready, handle annotations
        previewPromise.then(async (adobeViewer) => {
          console.log('Adobe viewer initialized successfully');
          
          // Store the annotation manager reference
          annotationManagerRef.current = await adobeViewer.getAnnotationManager();
          
          // Apply saved annotations if they exist
          if (savedAnnotations && savedAnnotations.length > 0) {
            try {
              console.log('Applying saved annotations');
              await annotationManagerRef.current.addAnnotations(savedAnnotations);
            } catch (err) {
              console.error('Error applying annotations:', err);
            }
          }

          // Show our custom save button
          setShowSaveButton(true);

          // Register save callback for auto-save
          adobeDC.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.SAVE_API,
            async (event) => {
              try {
                console.log('Auto-save callback triggered');
                const annotations = await annotationManagerRef.current.getAnnotations();
                if (annotations && annotations.length > 0) {
                  await saveAnnotationsToFirebase(annotations);
                }
              } catch (err) {
                console.error('Error in auto-save callback:', err);
              }
              return Promise.resolve();
            },
            { enableAutoSave: true, autoSaveMilliseconds: 5000 }
          );
        });

        setLoading(false);
      } catch (err) {
        console.error('Adobe Viewer Error:', err);
        setError('Failed to load PDF viewer. Please try again later.');
        setLoading(false);
      }
    };

    // Check if SDK is already loaded
    if (window.AdobeDC && window.AdobeDC.View) {
      initializeViewer();
      return;
    }

    // Load the Adobe SDK with error handling
    const script = document.createElement('script');
    script.src = 'https://documentcloud.adobe.com/view-sdk/main.js';
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      // Wait for SDK to fully initialize
      const checkSDK = () => {
        if (window.AdobeDC && window.AdobeDC.View) {
          initializeViewer();
        } else {
          setTimeout(checkSDK, 100);
        }
      };
      checkSDK();
    };

    script.onerror = () => {
      setError('Failed to load Adobe PDF viewer. Please check your connection.');
      setLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (viewerRef.current) {
        viewerRef.current.innerHTML = '';
      }
      if (adobeDCRef.current) {
        adobeDCRef.current = null;
      }
    };
  }, [fileUrl, navigate, fileName]);

  if (!fileUrl) return null;

  return (
    <div className="pdf-viewer-page">
      
      <Navbar />
      <Sidebar/>
      <div className="pdf-viewer-container">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading PDF Viewer...</p>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={handleRetry}>Retry</button>
          </div>
        )}

        {showSaveButton && (
          <div className="save-annotations-button">
            <button onClick={handleSaveClick}>Save Annotations</button>
          </div>
        )}

        <div 
          id="adobe-dc-view" 
          ref={viewerRef}
          style={{ 
            height: '100%', 
            width: '100%',
            display: loading || error ? 'none' : 'block' 
          }}
        />
      </div>
    </div>
  );
};

export default PDFViewer;