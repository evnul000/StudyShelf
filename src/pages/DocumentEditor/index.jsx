import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import Toolbar from './Toolbar';
import DocEditorContent from './EditorContent';
import { useDocumentEditor } from '../../hooks/useDocumentEditor';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { exportToDocx } from '../../utils/exportUtils';
import * as mammoth from 'mammoth';
import './styles/index.scss';

const DocumentEditor = () => {
  const location = useLocation();
  const { 
    documentUrl, 
    documentName, 
    documentId,
    semesterId, 
    classId,
    sectionPath = 'notes'
  } = location.state || {};

  const getOriginalFilename = (url) => {
    if (!url) return documentId;
    try {
      const pathParts = url.split('/');
      const filenameWithParams = pathParts[pathParts.length - 1];
      return filenameWithParams.split('?')[0];
    } catch (e) {
      console.error('Error parsing filename:', e);
      return documentId;
    }
  };

  const originalFilename = getOriginalFilename(documentUrl);
  const [docName, setDocName] = useState(documentName || originalFilename.replace('.docx', '').replace(`${documentId}_`, '') || 'Untitled Document');


  const [loadingMessage, setLoadingMessage] = useState('Loading document...');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialContentLoaded, setInitialContentLoaded] = useState(false);

  const { 
    editor, 
    loading, 
    error, 
    setContent, 
    characterCount,
    wordCount
  } = useDocumentEditor({
    documentId
  });

  const loadInitialContent = useCallback(async () => {
    if (!semesterId || !classId || !documentId) return;
  
    try {
      setLoadingMessage('Loading document content...');
      
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) throw new Error('Semester not found');
  
      const classData = semesterDoc.data().classes.find(c => c.id === classId);
      if (!classData) throw new Error('Class not found');
  
      const section = classData.sections?.[sectionPath] || [];
      const documentData = section.find(d => d.id === documentId);
  
      // Always try to load from Firestore HTML first
      if (documentData?.content) {
        setContent(documentData.content);
        setInitialContentLoaded(true);
        setLoadingMessage('');
        return;
      }
  
      // Fallback to DOCX conversion if no HTML exists
      if (documentUrl) {
        const fileUrl = documentUrl.startsWith('gs://')
          ? await getDownloadURL(ref(storage, documentUrl))
          : documentUrl;
  
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const htmlContent = result.value;
  
        // Update Firestore with converted HTML
        const updatedSection = section.map(doc => 
          doc.id === documentId ? { ...doc, content: htmlContent } : doc
        );
        
        await updateDoc(semesterRef, {
          classes: semesterDoc.data().classes.map(c => 
            c.id === classId ? { 
              ...c, 
              sections: { ...c.sections, [sectionPath]: updatedSection } 
            } : c
          )
        });
  
        setContent(htmlContent);
        setInitialContentLoaded(true);
        setLoadingMessage('');
      } else {
        setContent('<p></p>');
        setInitialContentLoaded(true);
        setLoadingMessage('');
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setLoadingMessage('Failed to load document');
      setContent('<p></p>');
      setInitialContentLoaded(true);
    }
  }, [semesterId, classId, documentId, sectionPath, documentUrl, setContent]);

  const saveDocument = useCallback(async (content) => {
    if (!semesterId || !classId || !documentId || !editor || !auth.currentUser) {
      console.error('Missing required data for document update');
      return;
    }
  
    setIsSaving(true);
    try {
      console.log('Starting save process...');
      
      // 1. Export current content to DOCX
      const blob = await exportToDocx(editor, docName);
      
      // 2. Upload the new DOCX to Storage
      console.log('Uploading to storage...');
      const userId = auth.currentUser.uid;
      
      let storagePath;
      if (documentUrl) {
        if (documentUrl.startsWith('gs://')) {
          storagePath = documentUrl.replace('gs://your-bucket-name/', '');
        } else {
          const url = new URL(documentUrl);
          storagePath = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
        }
      } else {
        storagePath = `docx/${userId}/${documentId}_${docName}.docx`;
      }
      
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, blob);
      const newUrl = await getDownloadURL(uploadResult.ref);
      console.log('Storage upload complete:', newUrl);
  
      // 3. Update Firestore with new content and metadata
      console.log('Updating Firestore...');
      const semesterRef = doc(db, 'semesters', semesterId);
      const semesterDoc = await getDoc(semesterRef);
      
      if (!semesterDoc.exists()) {
        throw new Error('Semester not found');
      }

      const semesterData = semesterDoc.data();
      const updatedClasses = JSON.parse(JSON.stringify(semesterData.classes));
      
      const classIndex = updatedClasses.findIndex(c => c.id === classId);
      if (classIndex === -1) {
        throw new Error('Class not found');
      }

      const section = updatedClasses[classIndex].sections?.[sectionPath] || [];
      const docIndex = section.findIndex(d => d.id === documentId);
      
      const updatedDoc = {
        id: documentId,
        name: docName,
        content: content, // Save the HTML content
        lastUpdated: new Date(),
        url: newUrl,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: blob.size
      };

      if (docIndex === -1) {
        updatedClasses[classIndex].sections = {
          ...updatedClasses[classIndex].sections,
          [sectionPath]: [...section, updatedDoc]
        };
      } else {
        updatedClasses[classIndex].sections[sectionPath][docIndex] = updatedDoc;
      }

      await updateDoc(semesterRef, { classes: updatedClasses });
      
      setLastSaved(new Date());
      console.log('Full save completed at', new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [semesterId, classId, documentId, docName, sectionPath, editor, documentUrl]);



  // Manual save handler
  const handleManualSave = async () => {
    if (editor) {
      const content = editor.getHTML();
      await saveDocument(content);
    }
  };

  // Load initial content when component mounts
  useEffect(() => {
    loadInitialContent();
  }, [loadInitialContent]);

  const handleExportToDocx = async () => {
    if (!editor || !auth.currentUser) return;
    
    try {
      const blob = await exportToDocx(editor, docName);
      const userId = auth.currentUser.uid;
      const storageRef = ref(storage, `docx/${userId}/${originalFilename}`);
      await uploadBytes(storageRef, blob);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docName}.docx`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };



  if (loading || loadingMessage) return <div className="document-loading">{loadingMessage}</div>;
  if (error) return <div className="document-error">Error: {error}</div>;

  return (
    <div className={`document-editor`}>
      <Toolbar 
        editor={editor}
        docName={docName}
        setDocName={setDocName}
        onExport={handleExportToDocx}
        onClose={() => window.history.back()}
        wordCount={wordCount}
        characterCount={characterCount}
        onSave={handleManualSave}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
      
      <div className="document-main">
        <DocEditorContent 
          editor={editor}    
          initialContentLoaded={initialContentLoaded}
        />
        
        
      </div>
    </div>
  );
};

export default DocumentEditor;