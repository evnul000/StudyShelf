import { useState } from 'react';
import { FileText, Layout, Search } from 'lucide-react';

const DocumentOptions = ({ editor }) => {
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  const findTextInDocument = () => {
    // Implementation would depend on which editor extensions you're using
    // This is a simple placeholder
    console.log('Finding:', findText);
  };
  
  const replaceTextInDocument = () => {
    console.log('Replace:', findText, 'with:', replaceText);
  };
  
  const replaceAllInDocument = () => {
    console.log('Replace all:', findText, 'with:', replaceText);
  };
  
  return (
    <div className="document-options">
      <button 
        className="doc-option-button"
        onClick={() => setShowPageSetup(!showPageSetup)}
        title="Page setup"
      >
        <FileText size={18} />
        <span>Page setup</span>
      </button>
      
      {showPageSetup && (
        <div className="page-setup-dialog">
          <h3>Page setup</h3>
          
          <div className="setup-option">
            <label>Paper size</label>
            <select>
              <option>Letter (8.5" x 11")</option>
              <option>Legal (8.5" x 14")</option>
              <option>Tabloid (11" x 17")</option>
              <option>A4 (210 x 297 mm)</option>
            </select>
          </div>
          
          <div className="setup-option">
            <label>Orientation</label>
            <div className="orientation-options">
              <label>
                <input type="radio" name="orientation" value="portrait" defaultChecked />
                Portrait
              </label>
              <label>
                <input type="radio" name="orientation" value="landscape" />
                Landscape
              </label>
            </div>
          </div>
          
          <div className="setup-option">
            <label>Margins</label>
            <select>
              <option>Normal (1" all sides)</option>
              <option>Narrow (0.5" all sides)</option>
              <option>Wide (2" left and right, 1" top and bottom)</option>
              <option>Custom</option>
            </select>
          </div>
          
          <div className="dialog-buttons">
            <button onClick={() => setShowPageSetup(false)}>Cancel</button>
            <button onClick={() => setShowPageSetup(false)}>Apply</button>
          </div>
        </div>
      )}
      
      <button 
        className="doc-option-button"
        onClick={() => setShowFindReplace(!showFindReplace)}
        title="Find and replace"
      >
        <Search size={18} />
        <span>Find & replace</span>
      </button>
      
      {showFindReplace && (
        <div className="find-replace-dialog">
          <div className="find-container">
            <input
              type="text"
              placeholder="Find"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
            />
            <button onClick={findTextInDocument}>Find</button>
          </div>
          
          <div className="replace-container">
            <input
              type="text"
              placeholder="Replace with"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
            <button onClick={replaceTextInDocument}>Replace</button>
            <button onClick={replaceAllInDocument}>Replace all</button>
          </div>
          
          <button 
            className="close-find-replace"
            onClick={() => setShowFindReplace(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentOptions;