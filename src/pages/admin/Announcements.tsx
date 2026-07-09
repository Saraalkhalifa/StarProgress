import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { Card, Button, Input, Textarea, Dialog, toast } from '../../components/ui';
import { format } from 'date-fns';
import { generateId } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export function Announcements() {
  const { currentUser } = useAuth();
  const { adminAnnouncements, addAnnouncement, updateAnnouncement, removeAnnouncement } = useAnnouncements();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [existingImagePath, setExistingImagePath] = useState('');
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke blob URL when preview changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const resetForm = () => {
    setTitle(''); setMessage(''); setExpiresAt('');
    setEditId(null); setShowForm(false);
    setImageFile(null); setImagePreview('');
    setExistingImageUrl(''); setExistingImagePath('');
    setRemoveCurrentImage(false); setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (id: string) => {
    const a = adminAnnouncements.find(x => x.id === id);
    if (!a) return;
    setTitle(a.title);
    setMessage(a.message);
    setExpiresAt(a.expiresAt ? a.expiresAt.slice(0, 10) : '');
    setExistingImageUrl(a.imageUrl ?? '');
    setExistingImagePath(a.imagePath ?? '');
    setImageFile(null); setImagePreview('');
    setRemoveCurrentImage(false); setImageError('');
    setEditId(id); setShowForm(true);
  };

  const handleFileSelect = (file: File) => {
    setImageError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setImageError(`Image must be under 1 MB (selected: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveCurrentImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveCurrentImage(true);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toBase64 = (file: File): Promise<{ imageUrl: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve({ imageUrl: e.target!.result as string });
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    });

  const uploadToStorage = async (file: File): Promise<{ imageUrl: string; imagePath?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `announcements/${generateId()}.${ext}`;
      const { error } = await supabase.storage
        .from('announcement-images')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (!error) {
        const { data } = supabase.storage.from('announcement-images').getPublicUrl(path);
        return { imageUrl: data.publicUrl, imagePath: path };
      }
      // Bucket may not exist yet — fall back to base64 so the feature works
      // before the migration is applied. Run supabase/migrations/009_announcement_images_bucket.sql
      // in the Supabase Dashboard to enable proper cloud storage.
      console.warn('Supabase Storage upload failed, falling back to base64:', error.message);
    }
    return toBase64(file);
  };

  const cleanupStorageImage = async (imagePath: string) => {
    if (!imagePath || !isSupabaseConfigured || !supabase) return;
    try {
      await supabase.storage.from('announcement-images').remove([imagePath]);
    } catch {
      // Non-critical: storage cleanup failure should not block the operation
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!message.trim()) { toast.error('Message is required'); return; }

    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      let imagePath: string | undefined;

      if (imageFile) {
        // New image selected — upload and replace any existing
        if (editId && existingImagePath) {
          await cleanupStorageImage(existingImagePath);
        }
        const result = await uploadToStorage(imageFile);
        imageUrl = result.imageUrl;
        imagePath = result.imagePath;
      } else if (removeCurrentImage) {
        // Admin explicitly removed the image
        if (editId && existingImagePath) {
          await cleanupStorageImage(existingImagePath);
        }
        imageUrl = undefined;
        imagePath = undefined;
      } else {
        // No change — preserve existing image (or undefined for new announcements)
        imageUrl = existingImageUrl || undefined;
        imagePath = existingImagePath || undefined;
      }

      if (editId) {
        updateAnnouncement(editId, {
          title: title.trim(), message: message.trim(),
          expiresAt: expiresAt || undefined,
          imageUrl, imagePath,
        });
        toast.success('Announcement updated!');
      } else {
        addAnnouncement({
          title: title.trim(), message: message.trim(),
          authorId: currentUser!.id, authorName: currentUser!.name,
          isActive: true, expiresAt: expiresAt || undefined,
          imageUrl, imagePath,
        });
        toast.success('Announcement posted! 📢');
      }
      resetForm();
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    const a = adminAnnouncements.find(x => x.id === deleteId);
    if (a?.imagePath) await cleanupStorageImage(a.imagePath);
    removeAnnouncement(deleteId!);
    setDeleteId(null);
    toast.info('Announcement deleted.');
  };

  // The image to show in the form (new preview, or existing if not removed)
  const displayPreview = imagePreview || (!removeCurrentImage ? existingImageUrl : '');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-blue-600" /> Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1">Post announcements that appear on the participant dashboard.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4" /> Post Announcement
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border-blue-200 bg-blue-50/30">
            <h2 className="font-semibold text-gray-700 mb-4">{editId ? 'Edit Announcement' : 'New Announcement'}</h2>
            <div className="space-y-3">
              <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Double Points Week! 🎉" />
              <Textarea label="Message" value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder="e.g. This week all approved activities earn double Hero Points! Submit your activities before Sunday." />
              <Input label="Expires At (optional)" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />

              {/* Image upload */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Image (optional)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {displayPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={displayPreview}
                      alt="Preview"
                      className="h-40 max-w-full rounded-xl object-cover border border-blue-100"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm transition-colors text-xs text-gray-600 px-2"
                      title="Replace image"
                    >
                      Replace
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-500 hover:text-blue-600 text-sm transition-colors bg-white/50 hover:bg-blue-50/50"
                  >
                    <ImagePlus className="w-4 h-4" />
                    Add image
                  </button>
                )}
                {imageError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    ⚠️ {imageError}
                  </p>
                )}
                <p className="text-xs text-gray-400">JPG, PNG, or WEBP · Max 1 MB</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={resetForm} disabled={isUploading}>Cancel</Button>
              <Button onClick={() => { void handleSave(); }} loading={isUploading}>
                {editId ? 'Update' : 'Post'} Announcement
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {adminAnnouncements.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p className="text-3xl mb-2">📢</p>
          <p>No announcements yet. Post one to let heroes know about upcoming challenges!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {adminAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(a => {
            const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
            return (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className={`p-5 ${!a.isActive || isExpired ? 'opacity-60' : 'border-l-4 border-l-blue-400'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{a.title}</h3>
                        {!a.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>}
                        {isExpired && <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Expired</span>}
                        {a.isActive && !isExpired && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Active</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                      {a.imageUrl && (
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="mt-3 max-h-32 rounded-xl object-cover border border-gray-100"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Posted by {a.authorName} · {format(new Date(a.createdAt), 'MMM d, yyyy')}
                        {a.expiresAt && ` · Expires ${format(new Date(a.expiresAt), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => updateAnnouncement(a.id, { isActive: !a.isActive })}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title={a.isActive ? 'Hide' : 'Show'}>
                        {a.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => startEdit(a.id)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(a.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!deleteId}
        title="Delete Announcement?"
        onClose={() => setDeleteId(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { void handleDelete(); }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">This will permanently remove the announcement from the platform.</p>
      </Dialog>
    </div>
  );
}
