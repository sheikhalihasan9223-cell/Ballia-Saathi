import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { localClient } from '@/api/localClient';
import { ChevronLeft, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    localClient.auth.me().then(u => {
      setForm({ full_name: u.full_name || '', phone: u.phone || '', email: u.email || '' });
      if (u.avatar_url) setAvatar(u.avatar_url);
    });
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await localClient.integrations.Core.UploadFile({ file });
    setAvatar(file_url);
  };

  const handleSave = async () => {
    setSaving(true);
    await localClient.auth.updateMe({ phone: form.phone, avatar_url: avatar });
    setSaving(false);
    toast.success('Profile updated!');
    navigate('/profile');
  };

  const handleDeleteAccount = async () => {
    toast.info('Account deletion requested. Please contact support.');
    navigate('/profile');
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg text-center flex-1">Profile</h1>
      </div>

      <div className="px-4 pt-6 pb-10">
        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-3xl text-primary">
                  {form.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-primary text-sm font-semibold">Name *</Label>
            <Input value={form.full_name} readOnly className="mt-2 bg-muted/40 rounded-xl" />
            <p className="text-[10px] text-muted-foreground mt-1">Name cannot be changed</p>
          </div>
          <div>
            <Label className="text-primary text-sm font-semibold">Mobile Number *</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="mt-2 bg-muted/40 rounded-xl" placeholder="Enter mobile number" type="tel" />
          </div>
          <div>
            <Label className="text-primary text-sm font-semibold">Email Address *</Label>
            <Input value={form.email} readOnly className="mt-2 bg-muted/40 rounded-xl" />
            <p className="text-[10px] text-muted-foreground mt-1">We promise not to spam you</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-2xl bg-primary font-bold text-base mt-4">
            {saving ? 'Saving...' : 'Submit'}
          </Button>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs text-muted-foreground mb-3">Deleting your account will remove all your orders, wallet amount and any active referral</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full h-11 rounded-2xl font-bold">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, all orders, wallet balance, and referral history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-white">
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
