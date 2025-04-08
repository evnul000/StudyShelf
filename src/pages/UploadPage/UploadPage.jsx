import React, { useState } from 'react';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Added getDoc import
import './UploadPage.scss';

const UploadPage = ({ type, onUploadComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file || !auth.currentUser) {
      setError('Please sign in first');
      return;
    }
  
    try {
      setUploading(true);
      
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `pdfs/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on('state_changed', 
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          setError(`Storage error: ${error.message}`);
          setUploading(false);
        },
        async () => {
          try {
            // 2. Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 3. Return file data to parent component (no Firestore pdfs collection)
            onUploadComplete({
              id: Date.now().toString(), // Generate a unique ID
              name: file.name,
              url: downloadURL,
              size: file.size,
              type: type
            });
          } catch (error) {
            setError(`Error: ${error.message}`);
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
      setError(`Error: ${error.message}`);
      setUploading(false);
    }
  };
  
  return (
    <div className="upload-page-popup">
      <h2>Upload {type === 'textbook' ? 'Textbook' : 'Notes'}</h2>
      <div className="upload-box">
        <input
          type="file"
          id="pdf-upload"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        <label htmlFor="pdf-upload" className="upload-label">
          {file ? file.name : 'Choose PDF File'}
        </label>
        
        {file && (
          <div className="upload-info">
            <p>File: {file.name}</p>
            <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            <p>Type: {type === 'textbook' ? 'Textbook' : 'Notes'}</p>
          </div>
        )}
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
        )}
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="button-group">
          <button
            onClick={onCancel}
            className="cancel-button"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;