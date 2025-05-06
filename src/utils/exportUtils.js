import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export const exportToDocx = async (editor, docName) => {
  if (!editor) throw new Error('Editor not available');

  const content = editor.getJSON();
  const sections = [];

  // Process content into DOCX sections
  content.content?.forEach(node => {
    if (node.type === 'paragraph') {
      const paragraph = new Paragraph({
        children: node.content ? node.content.map(child => {
          const textOptions = {
            text: child.text || '',
          };
          
          if (child.marks) {
            child.marks.forEach(mark => {
              if (mark.type === 'bold') textOptions.bold = true;
              if (mark.type === 'italic') textOptions.italic = true;
              if (mark.type === 'underline') textOptions.underline = true;
            });
          }
          
          return new TextRun(textOptions);
        }) : [],
        alignment: convertAlignment(node.attrs?.textAlign)
      });
      
      sections.push(paragraph);
    } else if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const headingLevel = convertHeadingLevel(level);
      
      const heading = new Paragraph({
        heading: headingLevel,
        children: node.content ? node.content.map(child => {
          return new TextRun({
            text: child.text || '',
          });
        }) : [],
        alignment: convertAlignment(node.attrs?.textAlign)
      });
      
      sections.push(heading);
    }
  });

  // Create the document
  const doc = new DocxDocument({
    sections: [{
      children: sections
    }]
  });

  // Generate the file - USE toBlob INSTEAD of toBuffer for browser
  const blob = await Packer.toBlob(doc);
  return blob;
};

// Helper functions remain the same
function convertHeadingLevel(level) {
  switch (level) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    default: return HeadingLevel.HEADING_1;
  }
}

function convertAlignment(alignment) {
  switch (alignment) {
    case 'left': return AlignmentType.LEFT;
    case 'center': return AlignmentType.CENTER;
    case 'right': return AlignmentType.RIGHT;
    case 'justify': return AlignmentType.JUSTIFIED;
    default: return AlignmentType.LEFT;
  }
}