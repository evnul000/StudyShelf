import { useState } from 'react';
import FormatButtons from './FormatButtons';
import AlignmentButtons from './AlignmentButtons';
import InsertMenu from './InsertMenu';
import DocumentOptions from './DocumentOptions';
import { 
  CornerDownLeft, 
  Clock, 
  MessageSquare, 
  Share2, 
  Star, 
  Download, 
  X 
} from 'lucide-react';
import '../styles/toolbar.scss';

const Toolbar = ({ 
  editor, 
  docName, 
  setDocName, 
  onExport, 
  onClose, 
  wordCount,
  characterCount,
  onSave,
  lastSaved
}) => {
  const [showWordCount, setShowWordCount] = useState(false);
  
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar-top">
        <div className="toolbar-left">
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
          <button onClick={onSave}>Save Now</button>
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <div className="document-title">
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="doc-name-input"
              placeholder="Untitled document"
            />
            <button className="star-button">
              <Star size={18} />
            </button>
        
          </div>
        </div>
        
        <div className="toolbar-center">
          <DocumentOptions editor={editor} />
        </div>
        
        <div className="toolbar-right">
        
          <button 
            className="export-button" 
            onClick={onExport}
            title="Download as DOCX"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      <div className="toolbar-bottom">
        <FormatButtons editor={editor} />
        <AlignmentButtons editor={editor} />
        <InsertMenu editor={editor} />
      
        
        <div 
          className="word-count-toggle" 
          onClick={() => setShowWordCount(!showWordCount)}
          title="Word count"
        >
          {showWordCount && (
            <div className="word-count-popup">
              <p>Words: {wordCount}</p>
              <p>Characters: {characterCount}</p>
            </div>
          )}
          <span>{wordCount} words</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;