import React, { useState, useEffect } from 'react';
import type { ImageFile } from "../App";

interface EditModalProps {
  image: ImageFile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
}

const backgroundOptions = [
  { id: 'color', label: 'Solid Color' },
  { id: 'image', label: 'Image' }
];

const effectOptions = [
  { id: 'none', label: 'None' },
  { id: 'blur', label: 'Blur' },
  { id: 'brightness', label: 'Bright' },
  { id: 'contrast', label: 'Contrast' }
];

const predefinedColors = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#00ffff', '#ff00ff', '#808080', '#c0c0c0'
];

const predefinedPatterns = [
  { id: 'dots', label: 'Dots' },
  { id: 'lines', label: 'Lines' },
  { id: 'grid', label: 'Grid' },
  { id: 'waves', label: 'Waves' }
];

export function EditModal({ image, isOpen, onClose, onSave }: EditModalProps) {
  const [bgType, setBgType] = useState('color');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [customBgImage, setCustomBgImage] = useState<File | null>(null);
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [blurValue, setBlurValue] = useState(50);
  const [brightnessValue, setBrightnessValue] = useState(50);
  const [contrastValue, setContrastValue] = useState(50);
  const [exportUrl, setExportUrl] = useState('');
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  const processedURL = image.processedFile ? URL.createObjectURL(image.processedFile) : '';

  useEffect(() => {
    if (image.processedFile) {
      applyChanges();
    }
  }, [bgType, bgColor, customBgImage, selectedEffect, blurValue, brightnessValue, contrastValue]);

  const getCurrentEffectValue = () => {
    switch (selectedEffect) {
      case 'blur':
        return blurValue;
      case 'brightness':
        return brightnessValue;
      case 'contrast':
        return contrastValue;
      default:
        return 50;
    }
  };

  const handleEffectValueChange = (value: number) => {
    switch (selectedEffect) {
      case 'blur':
        setBlurValue(value);
        break;
      case 'brightness':
        setBrightnessValue(value);
        break;
      case 'contrast':
        setContrastValue(value);
        break;
    }
  };

  const applyChanges = async () => {
    if (!image.processedFile) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = processedURL;
    await new Promise(resolve => img.onload = resolve);
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Apply background
    if (bgType === 'color') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bgType === 'image' && customBgImage) {
      const bgImg = new Image();
      bgImg.src = URL.createObjectURL(customBgImage);
      await new Promise(resolve => bgImg.onload = resolve);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }
    
    // Draw the processed image
    ctx.drawImage(img, 0, 0);
    
    // Apply effects
    if (selectedEffect !== 'none') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      switch (selectedEffect) {
        case 'blur':
          // Create a temporary canvas for blur effect
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) break;
          
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          
          // Draw current state to temp canvas
          tempCtx.drawImage(canvas, 0, 0);
          
          // Clear main canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Apply blur using CSS filter
          ctx.filter = `blur(${blurValue / 10}px)`;
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.filter = 'none';
          break;
          
        case 'brightness':
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * (brightnessValue / 50));
            data[i + 1] = Math.min(255, data[i + 1] * (brightnessValue / 50));
            data[i + 2] = Math.min(255, data[i + 2] * (brightnessValue / 50));
          }
          ctx.putImageData(imageData, 0, 0);
          break;
          
        case 'contrast':
          const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
          for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
          }
          ctx.putImageData(imageData, 0, 0);
          break;
      }
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    setExportUrl(dataUrl);
  };

  const handleSave = () => {
    onSave(exportUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-1 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-modal border border-border animate-scale-in">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-on-surface">Edit Image</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-faint hover:text-on-surface hover:bg-surface-3 active:scale-[0.92]"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-5">
            {/* Background section */}
            <div>
              <h3 className="text-sm font-medium text-on-surface-dim mb-2.5">Background</h3>
              <div className="flex gap-1.5 mb-4">
                {backgroundOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setBgType(option.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
                      bgType === option.id
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-surface-3 text-on-surface-dim hover:text-on-surface hover:bg-surface-4'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {bgType === 'color' && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setBgColor(color)}
                        className={`w-7 h-7 rounded-full border-2 hover:scale-110 active:scale-95 ${
                          bgColor === color ? 'border-accent ring-2 ring-accent-ring' : 'border-border'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                      className="px-3 py-1.5 bg-surface-3 rounded-lg hover:bg-surface-4 text-sm text-on-surface-dim hover:text-on-surface active:scale-[0.96]"
                    >
                      Custom Color
                    </button>
                    {showCustomColorPicker && (
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg"
                      />
                    )}
                  </div>
                </div>
              )}

              {bgType === 'image' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomBgImage(e.target.files?.[0] || null)}
                  className="w-full text-sm text-on-surface-dim file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface-3 file:text-on-surface-dim hover:file:bg-surface-4 file:cursor-pointer"
                />
              )}
            </div>

            {/* Effects section */}
            <div>
              <h3 className="text-sm font-medium text-on-surface-dim mb-2.5">Effects</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {effectOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedEffect(option.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.96] ${
                      selectedEffect === option.id
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-surface-3 text-on-surface-dim hover:text-on-surface hover:bg-surface-4'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedEffect !== 'none' && (
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getCurrentEffectValue()}
                    onChange={(e) => handleEffectValueChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-on-surface-faint mt-1">
                    <span>0</span>
                    <span className="text-accent font-medium">{getCurrentEffectValue()}</span>
                    <span>100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <h3 className="text-sm font-medium text-on-surface-dim mb-2.5">Preview</h3>
            <div className="border border-border rounded-xl overflow-hidden bg-surface-2">
              <img
                src={exportUrl || processedURL}
                alt="Preview"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-on-surface-dim bg-surface-3 rounded-xl hover:bg-surface-4 hover:text-on-surface active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-xl hover:bg-accent-hover active:scale-[0.97] shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
