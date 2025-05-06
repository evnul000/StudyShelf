import { AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent } from 'lucide-react';

const AlignmentButtons = ({ editor }) => {
  return (
    <div className="alignment-buttons">
      <button 
        className={`alignment-button ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <AlignLeft size={18} />
      </button>
      
      <button 
        className={`alignment-button ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <AlignCenter size={18} />
      </button>
      
      <button 
        className={`alignment-button ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <AlignRight size={18} />
      </button>
      
      <button 
        className={`alignment-button ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justify"
      >
        <AlignJustify size={18} />
      </button>
      
      <div className="format-divider"></div>
      
      <button 
        className={`alignment-button ${editor.isActive('bulletList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      
      <button 
        className={`alignment-button ${editor.isActive('orderedList') ? 'active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </button>
      
      <button 
        className="alignment-button"
        onClick={() => editor.chain().focus().indent().run()}
        title="Indent"
      >
        <Indent size={18} />
      </button>
      
      <button 
        className="alignment-button"
        onClick={() => editor.chain().focus().outdent().run()}
        title="Outdent"
      >
        <Outdent size={18} />
      </button>
    </div>
  );
};

export default AlignmentButtons;