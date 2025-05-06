import { useState } from 'react';
import { Palette } from 'lucide-react';

const ColorPicker = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  ];

  return (
    <div className="color-picker-container">
      <button 
        className="format-button color-button"
        onClick={() => {
          setShowColorPicker(!showColorPicker);
          setShowBgColorPicker(false);
        }}
        title="Text Color"
      >
        <Palette size={18} />
        <span className="color-indicator" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}></span>
      </button>
      
      {showColorPicker && (
        <div className="color-picker-dropdown">
          <div className="color-picker-header">
            <span>Text Color</span>
          </div>
          <div className="color-grid">
            {colors.map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  setShowColorPicker(false);
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
      
      <button 
        className="format-button color-button"
        onClick={() => {
          setShowBgColorPicker(!showBgColorPicker);
          setShowColorPicker(false);
        }}
        title="Highlight Color"
      >
        <span className="highlight-icon">
          <Palette size={18} />
        </span>
        <span className="color-indicator highlight" style={{ backgroundColor: editor.getAttributes('highlight').color || 'transparent' }}></span>
      </button>
      
      {showBgColorPicker && (
        <div className="color-picker-dropdown">
          <div className="color-picker-header">
            <span>Highlight Color</span>
          </div>
          <div className="color-grid">
            {colors.map((color) => (
              <button
                key={color}
                className="color-swatch"
                style={{ backgroundColor: color }}
                onClick={() => {
                  editor.chain().focus().toggleHighlight({ color }).run();
                  setShowBgColorPicker(false);
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;