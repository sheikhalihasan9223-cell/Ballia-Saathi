import { useState, useEffect } from 'react';
import { localClient } from '@/api/localClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, ChevronRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SupportAdmin() {
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['all-tickets'],
    queryFn: () => localClient.entities.SupportTicket.list('-created_date', 100),
    refetchInterval: activeTicket ? 4000 : 10000,
  });

  useEffect(() => {
    if (activeTicket) {
      const updated = tickets.find(t => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [tickets]);

  const sendReply = useMutation({
    mutationFn: () => {
      const newMessages = [...(activeTicket.messages || []), {
        sender: 'admin', sender_name: 'Ballia Saathi Support',
        content: reply, timestamp: new Date().toISOString(), is_admin: true,
      }];
      return localClient.entities.SupportTicket.update(activeTicket.id, { messages: newMessages });
    },
    onSuccess: (updated) => {
      setActiveTicket(updated);
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      setReply('');
    },
  });

  const closeTicket = useMutation({
    mutationFn: () => localClient.entities.SupportTicket.update(activeTicket.id, { status: 'closed' }),
    onSuccess: (updated) => {
      setActiveTicket(updated);
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      toast.success('Ticket closed');
    },
  });

  const openCount = tickets.filter(t => t.status === 'open').length;

  if (activeTicket) return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => setActiveTicket(null)} className="text-primary font-medium text-sm">← Back</button>
        <div className="flex-1">
          <p className="font-heading font-bold text-sm">{activeTicket.user_name} · {activeTicket.user_email}</p>
          <p className="text-xs text-muted-foreground">{activeTicket.ticket_id} · {activeTicket.subject}</p>
        </div>
        {activeTicket.status !== 'closed' && (
          <button onClick={() => closeTicket.mutate()} className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-200">
            <CheckCircle className="w-3.5 h-3.5" /> Close
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(activeTicket.messages || []).map((m, i) => (
          <div key={i} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-3 ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
              <p className={`text-xs font-bold mb-1 ${m.is_admin ? 'text-primary-foreground/80' : 'text-primary'}`}>{m.sender_name}</p>
              <p className="text-sm">{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.is_admin ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                {format(new Date(m.timestamp), 'hh:mm aa')}
              </p>
            </div>
          </div>
        ))}
        {activeTicket.status === 'closed' && (
          <p className="text-center text-xs text-muted-foreground bg-muted rounded-full py-1.5 px-4 mx-auto w-fit">
            Ticket Closed
          </p>
        )}
      </div>

      {activeTicket.status !== 'closed' && (
        <div className="border-t border-border p-4 flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && reply.trim() && sendReply.mutate()}
            placeholder="Type reply..." className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none" />
          <button onClick={() => reply.trim() && sendReply.mutate()} disabled={!reply.trim() || sendReply.isPending}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-xl">Support Tickets</h1>
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">{openCount} Open</span>
          <span className="bg-muted text-muted-foreground text-sm font-bold px-3 py-1 rounded-full">{tickets.length} Total</span>
        </div>
      </div>

      <div className="space-y-3">
        {tickets.map(t => (
          <button key={t.id} onClick={() => setActiveTicket(t)}
            className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:bg-muted/40 transition-colors flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{t.user_name}</p>
                <span className="text-xs text-muted-foreground">{t.user_email}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ml-auto ${t.status === 'closed' ? 'bg-muted text-muted-foreground' : t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.subject}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.ticket_id} · {(t.messages || []).length} messages · {format(new Date(t.created_date), 'MMM d, h:mm a')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
        {tickets.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No support tickets yet</p>
        )}
      </div>
    </div>
  );
}