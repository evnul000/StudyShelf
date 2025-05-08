import { EditorContent } from '@tiptap/react';
import { useEffect , useState} from 'react';
import './styles/editor.scss';

const DocEditorContent = ({ editor, initialContentLoaded }) => {
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (editor && initialContentLoaded) {
      // Force content refresh after initial load
      const currentContent = editor.getHTML();
      editor.commands.setContent(currentContent);
      setHasContent(true);
    }
  }, [editor, initialContentLoaded]);


// Handle Tab key for indentation
useEffect(() => {
  if (!editor || !initialContentLoaded) return;

  const handleKeyDown = (event) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      editor.chain().focus().indent().run();
    }
  };

  const editorDOM = editor.view.dom;
  editorDOM.addEventListener('keydown', handleKeyDown);

  return () => {
    editorDOM.removeEventListener('keydown', handleKeyDown);
  };
}, [editor, initialContentLoaded]);

  if (!initialContentLoaded || !hasContent) {
    return (
      <div className="editor-content-wrapper">
        <div className="document-page loading-content">
          Loading document content...
        </div>
      </div>
    );
  }


  const getFloatingMenu = () => {
    if (!editor || !initialContentLoaded) return null;
    
    // This is a simple floating menu that appears on selection
    return (
      <div className="floating-menu">
        {/* Floating menu content could be added here */}
      </div>
    );
  };

  if (!initialContentLoaded) {
    return (
      <div className="editor-content-wrapper">
        <div className="document-page loading-content">
          Loading document content...
        </div>
      </div>
    );
  }

  return (
    <div className="editor-content-wrapper">
      <div className="document-page">
        {editor && <EditorContent editor={editor} />}
        {getFloatingMenu()}
      </div>
    </div>
  );
};

export default DocEditorContent;