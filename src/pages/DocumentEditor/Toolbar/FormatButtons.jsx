import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Subscript,
  Superscript,
  Type
} from 'lucide-react';
import ColorPicker from './ColorPicker';

const FormatButtons = ({ editor }) => {
  const fontOptions = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' }
  ];
  
  const fontSizeOptions = [
    { label: '8', value: '8px' },
    { label: '10', value: '10px' },
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '18', value: '18px' },
    { label: '24', value: '24px' },
    { label: '36', value: '36px' }
  ];
  
  const headingOptions = [
    { label: 'Normal text', value: '' },
    { label: 'Heading 1', value: '1' },
    { label: 'Heading 2', value: '2' },
    { label: 'Heading 3', value: '3' }
  ];

  return (
    <div className="format-buttons">
      <select
        className="font-family-select"
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setFontFamily(e.target.value).run();
          }
        }}
        style={{
          color: '#333', // Dark gray for better visibility
          backgroundColor: '#fff', // White background
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <option value="" style={{ color: '#666' }}>Font</option>
        {fontOptions.map((font) => (
          <option 
            key={font.value} 
            value={font.value}
            style={{ color: '#333' }}
          >
            {font.label}
          </option>
        ))}
      </select>
      
      <select
        className="font-size-select"
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().setFontSize(e.target.value).run();
          }
        }}
        style={{
          color: '#333',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <option value="" style={{ color: '#666' }}>Size</option>
        {fontSizeOptions.map((size) => (
          <option 
            key={size.value} 
            value={size.value}
            style={{ color: '#333' }}
          >
            {size.label}
          </option>
        ))}
      </select>
      
      <select
        className="heading-select"
        value={editor.isActive('heading') ? editor.getAttributes('heading').level : ''}
        onChange={(e) => {
          if (e.target.value) {
            editor.chain().focus().toggleHeading({ level: parseInt(e.target.value) }).run();
          } else {
            editor.chain().focus().setParagraph().run();
          }
        }}
        style={{
          color: '#333',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        {headingOptions.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            style={{ color: '#333' }}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      <div className="format-divider"></div>
      
      <button 
        className={`format-button ${editor.isActive('bold') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold size={18} />
      </button>
      
      <button 
        className={`format-button ${editor.isActive('italic') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic size={18} />
      </button>
      
      <button 
        className={`format-button ${editor.isActive('underline') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <Underline size={18} />
      </button>
      
      <button 
        className={`format-button ${editor.isActive('strike') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>
      
      <ColorPicker editor={editor} />
      
      <div className="format-divider"></div>
      
      <button 
        className={`format-button ${editor.isActive('subscript') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        title="Subscript"
      >
        <Subscript size={18} />
      </button>
      
      <button 
        className={`format-button ${editor.isActive('superscript') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        title="Superscript"
      >
        <Superscript size={18} />
      </button>
      
      <button 
        className={`format-button ${editor.isActive('codeBlock') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        <Code size={18} />
      </button>
    </div>
  );
};

export default FormatButtons;