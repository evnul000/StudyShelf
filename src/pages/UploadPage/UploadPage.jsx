import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, storage, db } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './UploadPage.scss';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      
      const storageRef = ref(storage, `pdfs/${auth.currentUser.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on('state_changed', 
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          setError(`Storage error: ${error.message}`);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Critical: Document must match security rules
          await addDoc(collection(db, 'pdfs'), {
            name: file.name,
            url: downloadURL,
            size: file.size,
            userId: auth.currentUser.uid,  // ← Rule depends on this
            uploadedAt: serverTimestamp(),
            // Optional access control arrays
            readAccess: [auth.currentUser.uid],
            writeAccess: [auth.currentUser.uid]
          });
          
          navigate('/dashboard');
        }
      );
    } catch (error) {
      setError(`Database error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <h2>Upload PDF</h2>
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
          
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;