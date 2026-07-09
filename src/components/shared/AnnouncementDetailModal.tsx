import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import type { Announcement } from '../../types';

interface Props {
  announcement: Announcement | null;
  onClose: () => void;
}

export function AnnouncementDetailModal({ announcement, onClose }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError]         = useState(false);
  const [downloading, setDownloading]   = useState(false);

  // Reset per-announcement state when the announcement changes
  useEffect(() => {
    setImgError(false);
    setLightboxOpen(false);
  }, [announcement?.id]);

  // Keyboard + scroll-lock
  useEffect(() => {
    if (!announcement) return;
    document.body.style.overflow = 'hidden';

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (lightboxOpen) { setLightboxOpen(false); }
      else { onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [announcement, lightboxOpen, onClose]);

  const handleDownload = useCallback(async () => {
    const url = announcement?.imageUrl;
    if (!url) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${(announcement?.title ?? 'announcement').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      // Fallback: open in new tab so user can save manually
      if (url) window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  }, [announcement]);

  if (!announcement) return null;

  const hasImage = !!announcement.imageUrl && !imgError;

  return (
    <>
      {/* ── Modal ────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ann-detail-title"
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-blue-100/50 animate-scale-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Hero image — edge-to-edge at the top */}
          {hasImage && (
            <div className="relative flex-shrink-0 bg-gray-100">
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                className="w-full max-h-64 object-cover cursor-zoom-in"
                onError={() => setImgError(true)}
                onClick={() => setLightboxOpen(true)}
              />
              {/* Image action buttons */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setLightboxOpen(true); }}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-xl p-1.5 transition-colors backdrop-blur-sm"
                  title="Zoom in"
                  aria-label="Zoom image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); void handleDownload(); }}
                  disabled={downloading}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-xl p-1.5 transition-colors backdrop-blur-sm disabled:opacity-50"
                  title={downloading ? 'Downloading…' : 'Download image'}
                  aria-label="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-2 flex-shrink-0 gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">📢</span>
              <h2
                id="ann-detail-title"
                className="text-lg font-bold text-gray-800 leading-snug"
              >
                {announcement.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {announcement.message}
            </p>

            {/* Meta footer */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              {announcement.authorName && (
                <span>
                  Posted by{' '}
                  <span className="font-medium text-gray-500">{announcement.authorName}</span>
                </span>
              )}
              <span>
                {format(new Date(announcement.createdAt), 'MMM d, yyyy · h:mm a')}
              </span>
              {announcement.expiresAt && new Date(announcement.expiresAt) > new Date() && (
                <span>
                  Expires {format(new Date(announcement.expiresAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxOpen && hasImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close lightbox */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Full-size image */}
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="max-w-full max-h-full object-contain rounded-xl cursor-zoom-out select-none"
            onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
            draggable={false}
          />

          {/* Download button in lightbox */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); void handleDownload(); }}
            disabled={downloading}
            className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading…' : 'Download'}
          </button>
        </div>
      )}
    </>
  );
}
