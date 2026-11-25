import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Send,
  Smile,
  Store,
  UserRound,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  getRunnerActiveOrderId,
  isRunnerOrderAssignedTo,
  setRunnerActiveOrderId,
} from '../../lib/runnerCampus';
import './Chat.css';

const formatTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

function Avatar({ conversation, size = 'normal' }) {
  const isCanteen = conversation.partner?.role === 'Kantin';
  return (
    <div
      className={`chat-avatar chat-avatar-${size} ${isCanteen ? 'chat-avatar-canteen' : 'chat-avatar-courier'}`}
      aria-hidden="true"
    >
      {isCanteen ? <Store /> : <UserRound />}
    </div>
  );
}

function ChatList({ conversations, activeId, onSelect, loading, error }) {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((conversation) =>
    `${conversation.partner.name} ${conversation.partner.role} ${conversation.orderId || ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <aside className="chat-list-panel">
      <div className="chat-list-heading">
        <div>
          <p className="chat-eyebrow">Pesan saya</p>
          <h1>Live Chat</h1>
        </div>
      </div>

      <label className="chat-search">
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama atau pesanan..."
        />
      </label>

      {error && <div role="alert" className="chat-error">{error}</div>}

      {loading ? (
        <div className="chat-list-loading" aria-label="Memuat percakapan">
          {[1, 2, 3].map((item) => (
            <div className="chat-skeleton" key={item}>
              <span />
              <div><i /><i /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="chat-empty-list">
          <div><Search /></div>
          <h2>Tidak ada percakapan</h2>
          <p>Coba kata kunci lain atau buka chat dari detail pesanan.</p>
        </div>
      ) : (
        <div className="chat-list">
          {filtered.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              className={`chat-list-item ${String(activeId) === String(conversation.id) ? 'is-active' : ''}`}
              onClick={() => onSelect(conversation)}
            >
              <div className="chat-avatar-wrap">
                <Avatar conversation={conversation} />
              </div>
              <div className="chat-list-copy">
                <div className="chat-list-name-row">
                  <div>
                    <strong>{conversation.partner.name}</strong>
                    <span>{conversation.partner.role}</span>
                  </div>
                  <time>{formatTime(conversation.lastMessageAt)}</time>
                </div>
                <div className="chat-list-preview-row">
                  <p>{conversation.lastMessage || 'Belum ada pesan'}</p>
                  {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function ChatBubble({ message, conversation }) {
  const isCustomer = message.sender === 'customer';
  return (
    <div className={`chat-bubble-row ${isCustomer ? 'is-customer' : 'is-partner'}`}>
      {!isCustomer && <Avatar conversation={conversation} size="small" />}
      <div>
        <div className="chat-bubble">{message.text}</div>
        <time>{formatTime(message.createdAt)}</time>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();
  const { profile } = useAuth();
  const role = String(profile?.role || '').toLowerCase();
  const runnerUserId = profile?.id;
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [runnerActiveOrderId, setRunnerActiveOrderIdState] = useState(getRunnerActiveOrderId);
  const [runnerOrderCheckComplete, setRunnerOrderCheckComplete] = useState(false);
  const messageEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  const fetchConversations = useCallback(async (signal) => {
    try {
      const result = await api.get('/chats', { signal });
      setConversations(Array.isArray(result) ? result : []);
      setChatError('');
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Gagal memuat percakapan:', error);
        setChatError(error.message || 'Gagal memuat percakapan.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchConversations(controller.signal);
    const intervalId = window.setInterval(
      () => fetchConversations(controller.signal),
      3000
    );
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (role !== 'runner') return undefined;

    let active = true;
    const fetchActiveOrder = async () => {
      try {
        const orders = await api.get('/orders/courier');
        if (!Array.isArray(orders)) {
          throw new Error('Daftar pesanan aktif Runner dari server tidak valid.');
        }

        const activeOrders = orders.filter((order) => {
          const status = String(order.status || '').toLowerCase();
          return isRunnerOrderAssignedTo(order, { id: runnerUserId }) &&
            !['completed', 'cancelled'].includes(status);
        });
        const savedOrderId = getRunnerActiveOrderId();
        const activeOrder = activeOrders.find(
          (order) => String(order.id) === savedOrderId
        ) || activeOrders[0];

        if (active) {
          const orderId = activeOrder ? String(activeOrder.id) : '';
          setRunnerActiveOrderId(orderId);
          setRunnerActiveOrderIdState(orderId);
          setRunnerOrderCheckComplete(true);
        }
      } catch (error) {
        if (active) console.error('Gagal memuat pesanan aktif untuk navigasi Chat Runner:', error);
      }
    };

    fetchActiveOrder();
    return () => {
      active = false;
    };
  }, [role, runnerUserId]);

  const activeConversation = useMemo(
    () => conversations.find((item) => String(item.id) === String(conversationId)),
    [conversationId, conversations]
  );

  const fetchMessages = useCallback(async (id, signal) => {
    try {
      const result = await api.get(`/chats/${encodeURIComponent(id)}/messages`, { signal });
      if (signal?.aborted) return;
      const currentUserId = String(profile?.id);
      setMessages(
        (Array.isArray(result) ? result : []).map((message) => ({
          ...message,
          sender: String(message.senderId) === currentUserId ? 'customer' : 'partner',
          text: message.content,
        }))
      );
      setMessageError('');
    } catch (error) {
      if (!signal?.aborted) {
        console.error('Gagal memuat pesan chat:', error);
        setMessageError(error.message || 'Gagal memuat pesan.');
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    setMessages([]);
    lastMessageIdRef.current = null;
    if (!conversationId || !activeConversation) return undefined;

    const controller = new AbortController();
    fetchMessages(activeConversation.id, controller.signal);
    const intervalId = window.setInterval(
      () => fetchMessages(activeConversation.id, controller.signal),
      3000
    );
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [conversationId, activeConversation?.id, fetchMessages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages]);

  const selectConversation = (conversation) => {
    navigate(`/chat/${conversation.id}`);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!activeConversation || !content || sending) return;

    setSending(true);
    setMessageError('');
    try {
      await api.post(`/chats/${encodeURIComponent(activeConversation.id)}/messages`, { content });
      setDraft('');
      setShowEmoji(false);
      await fetchMessages(activeConversation.id);
      await fetchConversations();
    } catch (error) {
      console.error('Gagal mengirim pesan chat:', error);
      setMessageError(error.message || 'Pesan gagal dikirim. Silakan coba lagi.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const isCustomer = role === 'customer';
  const runnerReturnTo = location.state?.returnTo;
  const validRunnerReturnTo = typeof runnerReturnTo === 'string' &&
    /^\/runner-portal\/detail\?orderId=\d+$/.test(runnerReturnTo);
  const returnToOrderId = validRunnerReturnTo
    ? new URLSearchParams(runnerReturnTo.split('?')[1]).get('orderId')
    : '';
  const portalPath = role === 'runner'
    ? runnerActiveOrderId
      ? validRunnerReturnTo && returnToOrderId === runnerActiveOrderId
        ? runnerReturnTo
        : `/runner-portal/detail?orderId=${encodeURIComponent(runnerActiveOrderId)}`
      : validRunnerReturnTo && !runnerOrderCheckComplete
        ? runnerReturnTo
        : '/runner-portal'
    : role === 'canteen' || role === 'canteen_staff'
      ? '/canteen-portal'
      : role === 'courier'
        ? '/courier-portal'
        : '/runner-portal';

  return (
    <div className={`chat-page ${isCustomer ? 'is-customer' : 'is-partner'}`}>
      {isCustomer ? (
        <Navbar />
      ) : (
        <header className="chat-partner-bar">
          <Link to={portalPath}>← Kembali ke portal</Link>
          <strong>Live Chat</strong>
        </header>
      )}
      <main className={`chat-shell ${activeConversation ? 'has-conversation' : ''}`}>
        <ChatList
          conversations={conversations}
          activeId={activeConversation?.id}
          onSelect={selectConversation}
          loading={loading}
          error={chatError}
        />

        {activeConversation ? (
          <section className="chat-conversation" aria-label={`Percakapan dengan ${activeConversation.partner.name}`}>
            <header className="chat-header">
              <button type="button" className="chat-back" onClick={() => navigate('/chat')} aria-label="Kembali ke daftar chat">
                <ArrowLeft />
              </button>
              <Avatar conversation={activeConversation} />
              <div className="chat-header-copy">
                <div>
                  <h2>{activeConversation.partner.name}</h2>
                  <span>{activeConversation.partner.role}</span>
                </div>
                {activeConversation.orderId && (
                  <p>Pesanan #{activeConversation.orderId}</p>
                )}
              </div>
            </header>

            {activeConversation.orderId && (
              <div className="chat-order-context">
                <span>Pesanan #{activeConversation.orderId}</span>
                {activeConversation.canteenName && <b>{activeConversation.canteenName}</b>}
                {activeConversation.status && (
                  <>
                    {activeConversation.canteenName && <i>·</i>}
                    <em>{activeConversation.status}</em>
                  </>
                )}
              </div>
            )}

            <div className="chat-messages">
              {messages.length > 0 && <div className="chat-date-divider"><span>Riwayat pesan</span></div>}
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} conversation={activeConversation} />
              ))}
              {messageError && <p className="chat-message-error" role="alert">{messageError}</p>}
              <div ref={messageEndRef} />
            </div>

            <div className="chat-input-area">
              {showEmoji && (
                <div className="chat-emoji-picker" aria-label="Pilihan emoji">
                  {['😊', '👍', '🙏', '❤️', '😂', '🔥'].map((emoji) => (
                    <button type="button" key={emoji} onClick={() => setDraft((value) => `${value}${emoji}`)}>{emoji}</button>
                  ))}
                </div>
              )}
              <div className="chat-input-row">
                <button type="button" className="chat-tool" onClick={() => setShowEmoji((value) => !value)} aria-label="Buka emoji">
                  <Smile />
                </button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={4000}
                  placeholder="Tulis pesan..."
                />
                <button type="button" className="chat-send" onClick={sendMessage} aria-label="Kirim pesan" disabled={!draft.trim() || sending}>
                  <Send />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="chat-placeholder">
            <div className="chat-placeholder-icon"><UserRound /></div>
            <h2>Pilih percakapan</h2>
            <p>Pilih Customer, Kantin, atau Runner untuk melihat dan membalas pesan.</p>
          </section>
        )}
      </main>
    </div>
  );
}
