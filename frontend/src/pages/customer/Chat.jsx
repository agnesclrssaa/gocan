import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ImagePlus,
  Paperclip,
  Search,
  Send,
  Smile,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import './Chat.css';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const demoConversations = [
  {
    id: 'courier-001',
    role: 'Kurir',
    name: 'Andi',
    orderId: '001',
    canteenName: 'Molen Mini',
    status: 'Dalam perjalanan',
    online: true,
    unread: 2,
    lastTime: '10:42',
    lastMessage: 'Pesanan sudah saya ambil dari kantin.',
  },
  {
    id: 'canteen-001',
    role: 'Kantin',
    name: 'Molen Mini',
    orderId: '001',
    canteenName: 'Molen Mini',
    status: 'Pesanan diproses',
    online: true,
    unread: 0,
    lastTime: '09:58',
    lastMessage: 'Pesanan Anda sedang kami siapkan.',
  },
  {
    id: 'courier-002',
    role: 'Kurir',
    name: 'Rama',
    orderId: '002',
    canteenName: 'Pangsit Bu Sari',
    status: 'Pesanan selesai',
    online: false,
    unread: 0,
    lastTime: 'Kemarin',
    lastMessage: 'Terima kasih, pesanan sudah diterima.',
  },
];

const initialMessages = {
  'courier-001': [
    { id: 1, sender: 'courier', text: 'Halo! Saya Andi, kurir untuk pesanan #001.', time: '10:30' },
    { id: 2, sender: 'customer', text: 'Baik kak, tolong antar ke Gedung A ya.', time: '10:31' },
    { id: 3, sender: 'courier', text: 'Pesanan sudah saya ambil dari kantin.', time: '10:42' },
  ],
  'canteen-001': [
    { id: 1, sender: 'canteen', text: 'Halo! Pesanan #001 sudah kami terima.', time: '09:55' },
    { id: 2, sender: 'customer', text: 'Terima kasih, mohon disiapkan dengan baik ya.', time: '09:56' },
    { id: 3, sender: 'canteen', text: 'Pesanan Anda sedang kami siapkan.', time: '09:58' },
  ],
  'courier-002': [
    { id: 1, sender: 'customer', text: 'Pesanan sudah sampai kak?', time: 'Kemarin, 14:20' },
    { id: 2, sender: 'courier', text: 'Sudah sampai di lokasi. Terima kasih!', time: 'Kemarin, 14:25' },
  ],
};

function Avatar({ conversation, size = 'normal' }) {
  const isCanteen = conversation.role === 'Kantin';
  return (
    <div className={`chat-avatar chat-avatar-${size} ${isCanteen ? 'chat-avatar-canteen' : 'chat-avatar-courier'}`} aria-hidden="true">
      {isCanteen ? <Store /> : <UserRound />}
    </div>
  );
}

function ChatList({ conversations, activeId, onSelect, loading }) {
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((conversation) =>
    `${conversation.name} ${conversation.role} ${conversation.orderId}`
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
              className={`chat-list-item ${activeId === conversation.id ? 'is-active' : ''}`}
              onClick={() => onSelect(conversation)}
            >
              <div className="chat-avatar-wrap">
                <Avatar conversation={conversation} />
                {conversation.online && <span className="chat-online-dot" />}
              </div>
              <div className="chat-list-copy">
                <div className="chat-list-name-row">
                  <div>
                    <strong>{conversation.name}</strong>
                    <span>{conversation.role}</span>
                  </div>
                  <time>{conversation.lastTime}</time>
                </div>
                <div className="chat-list-preview-row">
                  <p>{conversation.lastMessage}</p>
                  {conversation.unread > 0 && <b>{conversation.unread}</b>}
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
        {message.imageUrl && (
          <img className="chat-message-image" src={message.imageUrl} alt="Lampiran foto" />
        )}
        {message.text && <div className="chat-bubble">{message.text}</div>}
        <time>{message.time}</time>
      </div>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState(demoConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);
  const messageEndRef = useRef(null);
  const localObjectUrlsRef = useRef(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const requestedOrderId = searchParams.get('orderId');
  const requestedRole = searchParams.get('role');

  const activeConversation = useMemo(() => {
    if (conversationId) {
      const exact = conversations.find((item) => item.id === conversationId);
      if (exact) return exact;

      const requestedRole = conversationId.startsWith('canteen') ? 'Kantin' : 'Kurir';
      const contextOrderId = searchParams.get('orderId');
      return conversations.find((item) =>
        item.role === requestedRole &&
        (!contextOrderId || String(item.orderId) === String(contextOrderId))
      ) || conversations.find((item) => item.role === requestedRole) || conversations[0];
    }
    if (requestedOrderId && requestedRole) {
      const roleMatch = requestedRole === 'canteen' ? 'Kantin' : 'Kurir';
      return conversations.find((item) =>
        String(item.orderId) === String(requestedOrderId) && item.role === roleMatch
      ) || conversations[0];
    }
    return null;
  }, [conversationId, conversations, requestedOrderId, requestedRole]);

  useEffect(() => () => {
    localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    localObjectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.id, messages]);

  const selectConversation = (conversation) => {
    navigate(`/chat/${conversation.id}`, { replace: false });
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setImageError('Format foto harus JPG, JPEG, PNG, atau WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Ukuran foto maksimal 5 MB.');
      return;
    }
    setImageError('');
    setImagePreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
        localObjectUrlsRef.current.delete(current.url);
      }
      const url = URL.createObjectURL(file);
      localObjectUrlsRef.current.add(url);
      return { file, url, name: file.name };
    });
  };

  const cancelImage = () => {
    if (imagePreview?.url) {
      URL.revokeObjectURL(imagePreview.url);
      localObjectUrlsRef.current.delete(imagePreview.url);
    }
    setImagePreview(null);
    setImageError('');
  };

  const appendDemoMessage = () => {
    if (!activeConversation) return;
    const text = draft.trim();
    if (!text && !imagePreview) return;
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: Date.now(),
      sender: 'customer',
      text,
      imageUrl: imagePreview?.url,
      time,
      localDemo: true,
    };
    setMessages((current) => ({
      ...current,
      [activeConversation.id]: [...(current[activeConversation.id] || []), newMessage],
    }));
    setDraft('');
    setImagePreview(null);
    setShowEmoji(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      appendDemoMessage();
    }
  };

  const mobileConversationOpen = Boolean(activeConversation);

  return (
    <div className="chat-page">
      <Navbar />
      <main className={`chat-shell ${mobileConversationOpen ? 'has-conversation' : ''}`}>
        <ChatList
          conversations={conversations}
          activeId={activeConversation?.id}
          onSelect={selectConversation}
          loading={loading}
        />

        {activeConversation ? (
          <section className="chat-conversation" aria-label={`Percakapan dengan ${activeConversation.name}`}>
            <header className="chat-header">
              <button type="button" className="chat-back" onClick={() => navigate('/chat')} aria-label="Kembali ke daftar chat">
                <ArrowLeft />
              </button>
              <Avatar conversation={activeConversation} />
              <div className="chat-header-copy">
                <div>
                  <h2>{activeConversation.name}</h2>
                  <span>{activeConversation.role}</span>
                </div>
                <p>
                  <i className={activeConversation.online ? 'online' : ''} />
                  {activeConversation.online ? 'Online' : 'Offline'}
                  <b>·</b> Pesanan #{activeConversation.orderId}
                </p>
              </div>
            </header>

            <div className="chat-order-context">
              <span>Pesanan #{activeConversation.orderId}</span>
              <b>{activeConversation.canteenName}</b>
              <i>·</i>
              <em>{activeConversation.status}</em>
            </div>

            <div className="chat-messages">
              <div className="chat-date-divider"><span>Hari ini</span></div>
              {(messages[activeConversation.id] || []).map((message) => (
                <ChatBubble key={message.id} message={message} conversation={activeConversation} />
              ))}
              <div ref={messageEndRef} />
            </div>

            {imageError && <div className="chat-image-error" role="alert">{imageError}</div>}

            {imagePreview && (
              <div className="chat-image-preview">
                <img src={imagePreview.url} alt={`Preview ${imagePreview.name}`} />
                <div>
                  <p>{imagePreview.name}</p>
                  <span>Preview lokal · belum dikirim</span>
                </div>
                <button type="button" onClick={cancelImage} aria-label="Batalkan foto"><X /></button>
              </div>
            )}

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
                <button type="button" className="chat-tool" onClick={() => fileInputRef.current?.click()} aria-label="Lampirkan foto">
                  <Paperclip />
                </button>
                <input
                  ref={fileInputRef}
                  className="chat-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                />
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Tulis pesan..."
                />
                <button type="button" className="chat-send" onClick={appendDemoMessage} aria-label="Kirim pesan" disabled={!draft.trim() && !imagePreview}>
                  <Send />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="chat-placeholder">
            <div className="chat-placeholder-icon"><ImagePlus /></div>
            <h2>Pilih percakapan</h2>
            <p>Pilih kurir atau kantin untuk melihat pesan terkait pesanan Anda.</p>
          </section>
        )}
      </main>
    </div>
  );
}
