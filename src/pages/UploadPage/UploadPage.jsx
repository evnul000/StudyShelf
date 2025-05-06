import React, { useState } from 'react';
import { auth, storage } from '../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import './UploadPage.scss';

const UploadPage = ({ type, onUploadComplete, onCancel, semesterId, classId }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [creationMode, setCreationMode] = useState('pdf');
  const [docName, setDocName] = useState('');

  const getTypeDisplayText = () => {
    switch(type) {
      case 'textbook': return 'Textbook';
      case 'notes': return 'Notes';
      case 'homework': return 'Homework';
      case 'exams': return 'Exam Material';
      case 'studySets': return 'Study Set';
      default: return 'File';
    }
  };

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
      const storageRef = ref(storage, `pdfs/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => {
          setError(`Storage error: ${error.message}`);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUploadComplete({
              id: Date.now().toString(),
              name: file.name,
              url: downloadURL,
              size: file.size,
              type: file.type,
              addedAt: new Date()
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

  const handleCreateDocx = async () => {
    if (!docName.trim() || !auth.currentUser) {
      setError('Please enter a document name and sign in');
      return;
    }
  
    try {
      setUploading(true);
      setError(null);
  
      // Create DOCX document
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              children: [new TextRun('My new document')] // Initial content
            })
          ]
        }]
      });
  
      // Create blob
      const blob = await Packer.toBlob(doc);
      const fileName = `${docName}.docx`;
      const userId = auth.currentUser.uid;
      
      // Create storage reference with correct path
      const storageRef = ref(storage, `docx/${userId}/${Date.now()}_${fileName}`);
      
      // Upload with metadata
      const metadata = {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        customMetadata: {
          'createdBy': userId,
          'originalName': fileName
        }
      };
  
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
  
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setError(`Upload error: ${error.message}`);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUploadComplete({
              id: Date.now().toString(),
              name: fileName,
              url: downloadURL,
              size: blob.size,
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              content: '<p></p>',
              addedAt: new Date(),
              createdBy: userId
            });
          } catch (error) {
            setError(`Error getting download URL: ${error.message}`);
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
      setError(`Error creating document: ${error.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="upload-page-popup">
      <h2>Upload {getTypeDisplayText()}</h2>
      <div className="upload-box">
        {type === 'notes' && (
          <div className="creation-mode-toggle">
            <button
              className={creationMode === 'pdf' ? 'active' : ''}
              onClick={() => setCreationMode('pdf')}
            >
              Upload PDF
            </button>
            <button
              className={creationMode === 'docx' ? 'active' : ''}
              onClick={() => setCreationMode('docx')}
            >
              Create DOCX
            </button>
          </div>
        )}

        {creationMode === 'pdf' || type !== 'notes' ? (
          <>
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
          </>
        ) : (
          <div className="docx-creation">
            <input
              type="text"
              placeholder="Enter document name"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              disabled={uploading}
            />
          </div>
        )}

        {file && creationMode === 'pdf' && (
          <div className="upload-info">
            <p>File: {file.name}</p>
            <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
            <p>Type: {getTypeDisplayText()}</p>
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
          {type === 'notes' && creationMode === 'docx' ? (
            <button
              onClick={handleCreateDocx}
              disabled={!docName || uploading}
              className="upload-button"
            >
              {uploading ? 'Creating...' : 'Create DOCX'}
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;