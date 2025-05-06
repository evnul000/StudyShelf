import { useState } from 'react';
import { Image, Table, FileText, Link as LinkIcon } from 'lucide-react';

const InsertMenu = ({ editor }) => {
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target.result }).run();
      };
      reader.readAsDataURL(file);
    }
    setShowInsertMenu(false);
  };
  
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowInsertMenu(false);
  };
  
  const insertLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };
  
  return (
    <div className="insert-menu-container">
      <button 
        className="insert-button"
        onClick={() => setShowInsertMenu(!showInsertMenu)}
      >
        Insert
      </button>
      
      {showInsertMenu && (
        <div className="insert-dropdown">
          <div className="insert-item" onClick={() => document.getElementById('image-upload').click()}>
            <Image size={18} />
            <span>Image</span>
            <input 
              type="file" 
              id="image-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
            />
          </div>
          
          <div className="insert-item" onClick={insertTable}>
            <Table size={18} />
            <span>Table</span>
          </div>
          
          <div className="insert-item" onClick={() => {
            setShowLinkDialog(true);
            setShowInsertMenu(false);
          }}>
            <LinkIcon size={18} />
            <span>Link</span>
          </div>
          
          <div className="insert-item">
            <FileText size={18} />
            <span>Page break</span>
          </div>
        </div>
      )}
      
      {showLinkDialog && (
        <div className="link-dialog">
          <input
            type="text"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <div className="link-dialog-buttons">
            <button onClick={() => setShowLinkDialog(false)}>Cancel</button>
            <button onClick={insertLink}>Insert</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsertMenu;