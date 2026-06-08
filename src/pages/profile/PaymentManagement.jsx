import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, CreditCard, Smartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentManagement() {
  const navigate = useNavigate();
  const [upis, setUpis] = useState([]);
  const [upiInput, setUpiInput] = useState('');
  const [adding, setAdding] = useState(false);

  const addUpi = () => {
    if (!upiInput.includes('@')) { toast.error('Enter a valid UPI ID (e.g. name@upi)'); return; }
    setUpis([...upis, upiInput]);
    setUpiInput('');
    setAdding(false);
    toast.success('UPI ID added');
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg">Payment Management</h1>
      </div>

      <div className="px-4 pt-4 pb-10 space-y-4">
        {/* UPI Section */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">UPI IDs</span>
            </div>
            <button onClick={() => setAdding(!adding)} className="text-primary text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {adding && (
            <div className="flex gap-2 mb-3">
              <Input value={upiInput} onChange={e => setUpiInput(e.target.value)}
                placeholder="yourname@upi" className="rounded-xl bg-muted/40" />
              <Button onClick={addUpi} className="rounded-xl shrink-0">Save</Button>
            </div>
          )}

          {upis.length === 0 && !adding ? (
            <p className="text-sm text-muted-foreground text-center py-4">No UPI IDs saved yet</p>
          ) : (
            <div className="space-y-2">
              {upis.map((upi, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">UPI</div>
                    <span className="text-sm font-medium">{upi}</span>
                  </div>
                  <button onClick={() => { setUpis(upis.filter((_, j) => j !== i)); toast.success('Removed'); }}
                    className="text-destructive text-xs font-medium">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cards - coming soon */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Debit / Credit Cards</span>
            <span className="ml-auto text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-xs text-muted-foreground">Card payments will be available soon</p>
        </div>
      </div>
    </div>
  );
}