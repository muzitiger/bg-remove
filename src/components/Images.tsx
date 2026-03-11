import React, { useState, useMemo } from "react";
import type { ImageFile } from "../App";
import { EditModal } from "./EditModal";

interface ImagesProps {
  images: ImageFile[];
  onDelete: (id: number) => void;
}

export function Images({ images, onDelete }: ImagesProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Auto-select first image or latest
  const activeId = selectedId ?? (images.length > 0 ? images[images.length - 1].id : null);
  const activeImage = images.find(img => img.id === activeId) || null;

  if (images.length === 0) return null;

  return (
    <div className="animate-fade-in">
      {/* Active image large preview */}
      {activeImage && (
        <ActivePreview
          image={activeImage}
          onDelete={(id) => {
            onDelete(id);
            setSelectedId(null);
          }}
        />
      )}

      {/* Thumbnail strip */}
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
                    ? 'ring-accent shadow-glow scale-105'
                    : 'ring-transparent hover:ring-border-hover opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${image.id}`}
                  className="w-full h-full object-cover"
                />
                {!image.processedFile && (
                  <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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

/* ─── Large preview for the active/selected image ─── */

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
    <div className="bg-surface-1 rounded-2xl shadow-card overflow-hidden animate-scale-in">
      {/* Toolbar */}
      {!isProcessing && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ToolbarBtn
              icon={<EditIcon />}
              label="Edit"
              onClick={() => setIsEditModalOpen(true)}
              hoverClass="hover:text-accent hover:bg-accent-dim"
            />
            <ToolbarBtn
              icon={<DownloadIcon />}
              label="Download"
              href={displayUrl}
              download={`processed-${image.id}.png`}
              hoverClass="hover:text-success hover:bg-success-dim"
            />
          </div>
          <ToolbarBtn
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => onDelete(image.id)}
            hoverClass="hover:text-danger hover:bg-danger-dim"
          />
        </div>
      )}

      {/* Image area */}
      <div className="relative bg-checkered flex items-center justify-center min-h-[320px] sm:min-h-[480px] lg:min-h-[560px] p-4 sm:p-6">
        {isProcessing ? (
          <div className="relative w-full max-w-2xl mx-auto">
            <img
              className="w-full max-h-[560px] object-contain opacity-40 rounded-xl"
              src={url}
              alt={`Processing image ${image.id}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-surface/80 backdrop-blur-sm px-5 py-3 rounded-xl flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-on-surface text-sm font-medium">Processing...</span>
              </div>
            </div>
          </div>
        ) : (
          <img
            className="w-full max-w-2xl max-h-[560px] object-contain rounded-xl transition-transform duration-300"
            src={displayUrl}
            alt={`Processed image ${image.id}`}
          />
        )}
      </div>

      <EditModal
        image={image}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />
    </div>
  );
}

/* ─── Toolbar button component ─── */

interface ToolbarBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  download?: string;
  hoverClass: string;
}

function ToolbarBtn({ icon, label, onClick, href, download, hoverClass }: ToolbarBtnProps) {
  const cls = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-on-surface-dim text-sm font-medium active:scale-[0.95] transition-all ${hoverClass}`;

  if (href) {
    return (
      <a href={href} download={download} className={cls} title={label}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={cls} title={label}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ─── Icons ─── */

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
