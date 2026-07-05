import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Shield, Crown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Input, Dialog, ConfirmDialog, Select, StatusBadge, Avatar, EmptyState, toast } from '../../components/ui';
import { simpleHash, AVATAR_COLORS } from '../../lib/utils';
import type { User } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'main_admin']),
});
type FormData = z.infer<typeof schema>;

export function AdminManagement() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'admin' },
  });

  const admins = users.filter(u => u.role === 'admin' || u.role === 'main_admin');

  const openEdit = (u: User) => {
    setEditAdmin(u);
    setValue('name', u.name);
    setValue('email', u.email);
    setValue('password', '');
    setValue('role', u.role as 'admin' | 'main_admin');
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    const emailExists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.id !== editAdmin?.id);
    if (emailExists) { toast.error('This email is already in use.'); return; }

    if (editAdmin) {
      if (editAdmin.role === 'main_admin' && data.role !== 'main_admin') {
        const otherMainAdmins = admins.filter(a => a.id !== editAdmin.id && a.role === 'main_admin');
        if (otherMainAdmins.length === 0) {
          toast.error('Cannot demote the only Main Admin!');
          return;
        }
      }
      const updates: Partial<User> = { name: data.name, email: data.email, role: data.role };
      if (data.password) updates.passwordHash = simpleHash(data.password);
      await updateUser(editAdmin.id, updates);
      toast.success('Admin updated!');
    } else {
      await addUser({
        name: data.name,
        email: data.email,
        passwordHash: simpleHash(data.password || 'admin123'),
        role: data.role,
        accountStatus: 'active',
        avatarColor: AVATAR_COLORS[admins.length % AVATAR_COLORS.length],
      });
      toast.success('Admin added!');
    }
    setShowForm(false);
    setEditAdmin(null);
    reset({ role: 'admin' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Admins 🛡️</h1>
          <p className="text-gray-500 text-sm">{admins.length} admin accounts</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditAdmin(null); reset({ role: 'admin' }); }}>
          <Plus className="w-4 h-4" /> Add Admin
        </Button>
      </div>

      {/* Permission info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Main Admin</h3>
          </div>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>✓ All admin permissions</li>
            <li>✓ Manage admin accounts</li>
            <li>✓ Change badge settings</li>
            <li>✓ Access all data</li>
          </ul>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Regular Admin</h3>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Manage participants</li>
            <li>✓ Manage activities</li>
            <li>✓ Approve/deny submissions</li>
            <li>✗ Cannot manage admins</li>
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {admins.length === 0 ? (
          <EmptyState icon="🛡️" title="No admins" description="Add admin accounts" />
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <Avatar name={a.name} color={a.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{a.name}</p>
                    {a.id === currentUser?.id && <span className="text-xs text-gray-400">(You)</span>}
                  </div>
                  <p className="text-sm text-gray-400">{a.email}</p>
                </div>
                <StatusBadge variant={a.role === 'main_admin' ? 'purple' : 'blue'}>
                  {a.role === 'main_admin' ? '👑 Main Admin' : '⚙️ Admin'}
                </StatusBadge>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {a.id !== currentUser?.id && a.role !== 'main_admin' && (
                    <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditAdmin(null); }} title={editAdmin ? 'Edit Admin' : 'Add New Admin'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" placeholder="Admin Name" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" placeholder="admin@example.com" error={errors.email?.message} {...register('email')} />
          <Input label={editAdmin ? 'New Password (leave blank to keep)' : 'Password'} type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Select label="Role" error={errors.role?.message} {...register('role')}>
            <option value="admin">Regular Admin</option>
            <option value="main_admin">Main Admin</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditAdmin(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editAdmin ? 'Save Changes' : 'Add Admin'}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteUser(deleteId!); toast.success('Admin removed.'); }} title="Remove Admin" message="This will remove admin access for this user. Are you sure?" />
    </div>
  );
}
