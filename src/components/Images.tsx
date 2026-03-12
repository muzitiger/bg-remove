import React, { useState } from "react";
import type { ImageFile } from "../App";
import { EditModal } from "./EditModal";

interface ImagesProps {
  images: ImageFile[];
  onDelete: (id: number) => void;
}

export function Images({ images, onDelete }: ImagesProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const activeId = selectedId ?? (images.length > 0 ? images[images.length - 1].id : null);
  const activeImage = images.find((img) => img.id === activeId) || null;

  if (images.length === 0) return null;

  return (
    <div className="animate-fade-in">
      {activeImage && (
        <ActivePreview
          image={activeImage}
          onDelete={(id) => {
            onDelete(id);
            setSelectedId(null);
          }}
        />
      )}

      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {images.map((image) => {
            const thumbUrl = image.processedFile
              ? URL.createObjectURL(image.processedFile)
              : URL.createObjectURL(image.file);
            const isActive = image.id === activeId;
            return (
              <button
                key={image.id}
                onClick={() => setSelectedId(image.id)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 ring-2 transition-all duration-200 active:scale-[0.93] ${
                  isActive
                    ? "ring-primary shadow-glow scale-105"
                    : "ring-transparent hover:ring-slate-300 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={thumbUrl} alt={`Thumbnail ${image.id}`} className="w-full h-full object-cover" />
                {!image.processedFile && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivePreview({ image, onDelete }: { image: ImageFile; onDelete: (id: number) => void }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState("");

  const url = URL.createObjectURL(image.file);
  const processedURL = image.processedFile ? URL.createObjectURL(image.processedFile) : "";
  const isProcessing = !image.processedFile;
  const displayUrl = processedImageUrl || processedURL;

  const handleEditSave = (editedImageUrl: string) => {
    setProcessedImageUrl(editedImageUrl);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden animate-scale-in border border-slate-200">
      {!isProcessing && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ToolbarBtn icon="edit" label="Edit" onClick={() => setIsEditModalOpen(true)} hoverClass="hover:text-primary hover:bg-primary/10" />
            <ToolbarBtn icon="download" label="Download" href={displayUrl} download={`processed-${image.id}.png`} hoverClass="hover:text-green-600 hover:bg-green-50" />
          </div>
          <ToolbarBtn icon="delete" label="Delete" onClick={() => onDelete(image.id)} hoverClass="hover:text-red-500 hover:bg-red-50" />
        </div>
      )}

      <div className="relative bg-checkered flex items-center justify-center p-4 sm:p-6">
        {isProcessing ? (
          <div className="relative inline-block max-w-full">
            <img className="max-w-full max-h-[70vh] object-contain opacity-40 rounded-xl" src={url} alt={`Processing image ${image.id}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3 shadow-card">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-slate-700 text-sm font-medium">Processing...</span>
              </div>
            </div>
          </div>
        ) : (
          <img className="max-w-full max-h-[70vh] object-contain rounded-xl transition-transform duration-300" src={displayUrl} alt={`Processed image ${image.id}`} />
        )}
      </div>

      <EditModal image={image} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleEditSave} />
    </div>
  );
}

interface ToolbarBtnProps {
  icon: string;
  label: string;
  onClick?: () => void;
  href?: string;
  download?: string;
  hoverClass: string;
}

function ToolbarBtn({ icon, label, onClick, href, download, hoverClass }: ToolbarBtnProps) {
  const cls = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 text-sm font-medium active:scale-[0.95] transition-all ${hoverClass}`;

  if (href) {
    return (
      <a href={href} download={download} className={cls} title={label}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={cls} title={label}>
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
