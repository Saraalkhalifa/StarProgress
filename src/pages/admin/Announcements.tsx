import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { Card, Button, Input, Textarea, Dialog, toast } from '../../components/ui';
import { format } from 'date-fns';
import { generateId } from '../../lib/utils';

export function Announcements() {
  const { currentUser } = useAuth();
  const { adminAnnouncements, addAnnouncement, updateAnnouncement, removeAnnouncement } = useAnnouncements();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const resetForm = () => { setTitle(''); setMessage(''); setExpiresAt(''); setEditId(null); setShowForm(false); };

  const startEdit = (id: string) => {
    const a = adminAnnouncements.find(x => x.id === id);
    if (!a) return;
    setTitle(a.title);
    setMessage(a.message);
    setExpiresAt(a.expiresAt ? a.expiresAt.slice(0, 10) : '');
    setEditId(id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!message.trim()) { toast.error('Message is required'); return; }

    if (editId) {
      updateAnnouncement(editId, { title: title.trim(), message: message.trim(), expiresAt: expiresAt || undefined });
      toast.success('Announcement updated!');
    } else {
      addAnnouncement({
        title: title.trim(),
        message: message.trim(),
        authorId: currentUser!.id,
        authorName: currentUser!.name,
        isActive: true,
        expiresAt: expiresAt || undefined,
      });
      toast.success('Announcement posted! 📢');
    }
    resetForm();
  };

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
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSave}>{editId ? 'Update' : 'Post'} Announcement</Button>
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
            <Button variant="danger" onClick={() => { removeAnnouncement(deleteId!); setDeleteId(null); toast.info('Announcement deleted.'); }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">This will permanently remove the announcement from the platform.</p>
      </Dialog>
    </div>
  );
}
