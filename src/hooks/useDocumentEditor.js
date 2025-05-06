import { useEditor } from '@tiptap/react';
import { useState, useEffect, useCallback } from 'react';
import { configureEditor } from '../utils/editorConfig';

export const useDocumentEditor = ({ documentId }) => {
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  // Calculate word and character counts
  const calculateCounts = useCallback((editor) => {
    if (!editor) return;
    const text = editor.getText();
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharacterCount(text.length);
  }, []);

  // Initialize editor
  const editorInstance = useEditor({
    extensions: configureEditor(),
    content: content,
    onUpdate: ({ editor }) => {
      calculateCounts(editor);
    },
    onCreate: () => {
      setLoading(false);
    },
    onDestroy: () => {
      setLoading(true);
    },
  });

  useEffect(() => {
    setEditor(editorInstance);
    return () => {
      if (editorInstance) {
        editorInstance.destroy();
      }
    };
  }, [editorInstance]);

  // Handle content updates
  useEffect(() => {
    if (editorInstance && content) {
      editorInstance.commands.setContent(content);
      calculateCounts(editorInstance);
    }
  }, [content, editorInstance, calculateCounts]);

  // Error handling
  useEffect(() => {
    if (error) {
      console.error('Editor error:', error);
      setLoading(false);
    }
  }, [error]);

  return {
    editor: editorInstance,
    loading,
    error,
    setContent,
    wordCount,
    characterCount
  };
};