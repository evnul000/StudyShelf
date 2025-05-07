import { useState, useEffect } from 'react';
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
  X,
  Save
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
        <button 
          className="toolbar-button" 
          onClick={onSave}
          title="Save document"
        >
          <Save size={20} />
          {lastSaved && (
            <span className="last-saved-tooltip">
              <Clock size={20} /> {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </button>

        <button 
          className="toolbar-button" 
          onClick={onExport}
          title="Export document"
        >
          <Download size={20}/>
        </button>

        <button 
          className="toolbar-button star-button"
          title="Add to favorites"
        >
          <Star size={20} />
        </button>

        <button 
          className="toolbar-button close-button"
          onClick={onClose}
          title="Close editor"
        >
          <X size={20} />
        </button>
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