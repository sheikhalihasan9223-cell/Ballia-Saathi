import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Send, MessageCircle, Mail, Loader2, Bot } from 'lucide-react';
import { format } from 'date-fns';

const QUICK_ACTIONS = [
  { label: '📦 Track my order', text: 'I want to track my order status' },
  { label: '❌ Cancel order', text: 'I want to cancel my order' },
  { label: '💰 Request refund', text: 'I want a refund for my order' },
  { label: '⭐ Leave a review', text: 'I want to leave a review for my order' },
  { label: '🚚 Delivery issue', text: 'I have a delivery problem' },
  { label: '❓ Other help', text: 'I need help with something else' },
];

async function getAiReply(ticket, userMessage) {
  const userOrders = await base44.entities.Order.filter(
    { user_email: ticket.user_email }, '-created_date', 5
  ).catch(() => []);

  const ordersContext = userOrders.length > 0
    ? `Customer's recent orders:\n${userOrders.map(o =>
        `- Order #${o.order_number}: ${o.status}, ₹${o.total}, ${o.items?.length || 0} items, placed on ${new Date(o.created_date).toLocaleDateString('en-IN')}`
      ).join('\n')}`
    : 'Customer has no orders yet.';

  const history = (ticket.messages || [])
    .slice(-6)
    .map(m => `${m.is_admin ? 'Support' : 'Customer'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a friendly customer support agent for Ballia Saathi, an Indian grocery delivery app.

${ordersContext}

Recent conversation:
${history}
Customer: ${userMessage}

Instructions:
- For order tracking: share the exact status from orders listed above.
- For cancellation: if order is in 'placed' or 'confirmed' state say we can cancel it. If in other states say it cannot be cancelled.
- For refund: acknowledge, say refund takes 3-5 business days to original payment method. COD orders get store credit.
- For delivery issues: empathize, apologize, say a team member will follow up within 2 hours.
- For reviews: thank them and ask them to share their feedback.
- Always be warm, concise (2-3 sentences max), helpful.
- Respond in the same language as the customer (Hindi or English).
- Sign off by asking if there's anything else you can help with.`;

  return base44.integrations.Core.InvokeLLM({ prompt });
}

export default function HelpSupport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: tickets = [] } = useQuery({
    queryKey: ['my-tickets', user?.email],
    queryFn: () => base44.entities.SupportTicket.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: activeTicket ? 5000 : false,
  });

  useEffect(() => {
    if (activeTicket) {
      const updated = tickets.find(t => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [tickets]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [activeTicket?.messages?.length, isAiThinking]);

  const appendAiReply = async (ticket, userMessage) => {
    setIsAiThinking(true);
    try {
      const aiText = await getAiReply(ticket, userMessage);
      const newMessages = [...(ticket.messages || []), {
        sender: 'support',
        sender_name: 'Ballia Saathi AI',
        content: aiText,
        timestamp: new Date().toISOString(),
        is_admin: true,
      }];
      const updated = await base44.entities.SupportTicket.update(ticket.id, { messages: newMessages });
      setActiveTicket(updated);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    } finally {
      setIsAiThinking(false);
    }
  };

  const createTicket = useMutation({
    mutationFn: () => base44.entities.SupportTicket.create({
      ticket_id: 'TK' + Date.now().toString(36).toUpperCase(),
      user_email: user.email,
      user_name: user.full_name || 'User',
      subject,
      status: 'open',
      messages: [{
        sender: user.email, sender_name: user.full_name || 'User',
        content: subject, timestamp: new Date().toISOString(), is_admin: false,
      }],
    }),
    onSuccess: async (ticket) => {
      setActiveTicket(ticket);
      setShowNew(false);
      setSubject('');
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      await appendAiReply(ticket, subject);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const userMsg = msg.trim();
      setMsg('');
      const newMessages = [...(activeTicket.messages || []), {
        sender: user.email, sender_name: user.full_name || 'User',
        content: userMsg, timestamp: new Date().toISOString(), is_admin: false,
      }];
      const updated = await base44.entities.SupportTicket.update(activeTicket.id, { messages: newMessages });
      setActiveTicket(updated);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      return { updated, userMsg };
    },
    onSuccess: async ({ updated, userMsg }) => {
      await appendAiReply(updated, userMsg);
    },
  });

  // ── CHAT VIEW ──
  if (activeTicket) return (
    <div className="max-w-lg mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-5 pb-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => setActiveTicket(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-heading font-bold text-sm">Ballia Saathi Support</h1>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-muted-foreground">AI-powered · {activeTicket.ticket_id}</p>
        </div>
        <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${activeTicket.status === 'closed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
          {activeTicket.status}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="flex justify-center">
          <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {format(new Date(), 'EEEE, dd MMM yyyy')}
          </span>
        </div>

        {(activeTicket.messages || []).map((m, i) => (
          <div key={i} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
            {m.is_admin && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-auto shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.is_admin
              ? 'bg-card border border-border rounded-tl-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm'}`}>
              <p className="text-sm leading-relaxed">{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
                {format(new Date(m.timestamp), 'hh:mm aa')}
              </p>
            </div>
          </div>
        ))}

        {isAiThinking && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {activeTicket.status === 'closed' && (
          <p className="text-center text-xs text-muted-foreground bg-muted rounded-full py-1.5 px-4 mx-auto w-fit">
            This conversation is closed
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {activeTicket.status !== 'closed' && (
        <div className="border-t border-border bg-background pb-safe">
          <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK_ACTIONS.map((qa, i) => (
              <button key={i} onClick={() => setMsg(qa.text)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors whitespace-nowrap">
                {qa.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-4 pb-4">
            <input value={msg} onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && msg.trim() && !sendMessage.isPending && !isAiThinking && sendMessage.mutate()}
              placeholder="Type a message..."
              className="flex-1 bg-muted rounded-2xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary/50 transition-colors" />
            <button
              onClick={() => msg.trim() && !sendMessage.isPending && !isAiThinking && sendMessage.mutate()}
              disabled={!msg.trim() || sendMessage.isPending || isAiThinking}
              className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0">
              {sendMessage.isPending || isAiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-bold text-lg">Help & Support</h1>
      </div>

      <div className="px-4 pt-5 pb-10 space-y-4">
        {/* AI Chat CTA */}
        {!showNew && (
          <button onClick={() => setShowNew(true)}
            className="w-full bg-gradient-to-r from-primary to-accent text-white rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition-opacity shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="font-bold text-base">Chat with AI Support</p>
              <p className="text-sm text-white/80 mt-0.5">Get instant help for orders, refunds & more</p>
            </div>
          </button>
        )}

        {/* New ticket form */}
        {showNew && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="font-semibold text-sm mb-1">What do you need help with?</p>
            <p className="text-xs text-muted-foreground mb-3">Select a topic or describe your issue.</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {QUICK_ACTIONS.map((qa, i) => (
                <button key={i} onClick={() => setSubject(qa.text)}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${subject === qa.text ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}>
                  {qa.label}
                </button>
              ))}
            </div>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Or type your question..."
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none mb-3 border border-transparent focus:border-primary/40 transition-colors" />
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => subject.trim() && createTicket.mutate()} disabled={!subject.trim() || createTicket.isPending}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                {createTicket.isPending ? 'Starting...' : 'Start Chat'}
              </button>
            </div>
          </div>
        )}

        {/* Email */}
        <a href="mailto:balliasaathi@gmail.com"
          className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:bg-muted/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Email Support</p>
            <p className="text-xs text-primary">balliasaathi@gmail.com</p>
          </div>
        </a>

        {/* Previous tickets */}
        {tickets.length > 0 && (
          <div>
            <h3 className="font-heading font-bold text-sm mb-2">Previous Conversations</h3>
            <div className="space-y-2">
              {tickets.map(t => (
                <button key={t.id} onClick={() => setActiveTicket(t)}
                  className="w-full bg-card rounded-2xl border border-border p-4 text-left hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{t.subject}</p>
                        <p className="text-xs text-muted-foreground">{t.ticket_id} · {(t.messages || []).length} messages</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'closed' ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'}`}>
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}