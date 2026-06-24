import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Send, Search, Plus, X, Check, CheckCheck, MoreVertical,
  Paperclip, Smile, Mic, Phone, Video, Info, Star, StarOff,
  Reply, Forward, Trash2, Pin, PinOff, BellOff, Bell,
  Users, User, Hash, ChevronLeft, ChevronDown, ChevronRight,
  Image, FileText, Download, Archive, Settings, Filter,
  MessageSquare, Edit3, Megaphone, AlertCircle, ArrowLeft,
  Clock, Shield, Lock, Eye, EyeOff, Volume2, VolumeX,
  UserPlus, UserMinus, AtSign, Bold, Italic
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Staff';
type ChatType = 'direct' | 'group' | 'channel' | 'broadcast';
type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
type Reaction = { emoji: string; users: number[] };

interface Contact {
  id: number;
  name: string;
  avatar: string;
  role: UserRole;
  department?: string;
  class?: string;
  section?: string;
  isOnline: boolean;
  lastSeen?: string;
  phone?: string;
  email?: string;
  isBlocked?: boolean;
  isMuted?: boolean;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  type: MessageType;
  fileName?: string;
  fileSize?: string;
  time: string;
  timestamp: number;
  status: MessageStatus;
  reactions: Reaction[];
  isPinned?: boolean;
  replyTo?: { id: number; text: string; senderName: string } | null;
  isEdited?: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
}

interface Chat {
  id: number;
  type: ChatType;
  name: string;
  avatar: string;
  participantIds: number[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  description?: string;
  adminIds?: number[];
  createdAt?: string;
  isReadOnly?: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const ME: Contact = {
  id: 0, name: 'Admin (You)', avatar: 'AD', role: 'Admin',
  isOnline: true, email: 'admin@school.com'
};

const CONTACTS: Contact[] = [
  { id: 1, name: 'Dr. Vikram Singh', avatar: 'VS', role: 'Teacher', department: 'Physics', isOnline: true, email: 'vikram@school.com', phone: '+91 98765 43210' },
  { id: 2, name: 'Priya Sharma', avatar: 'PS', role: 'Teacher', department: 'Mathematics', isOnline: false, lastSeen: '2 hours ago', email: 'priya@school.com' },
  { id: 3, name: 'Rahul Mehta', avatar: 'RM', role: 'Teacher', department: 'Chemistry', isOnline: true, email: 'rahul@school.com' },
  { id: 4, name: 'Anjali Verma', avatar: 'AV', role: 'Student', class: '10', section: 'A', isOnline: false, lastSeen: '30 minutes ago' },
  { id: 5, name: 'Rohit Gupta', avatar: 'RG', role: 'Student', class: '12', section: 'B', isOnline: true },
  { id: 6, name: 'Sunita Patel (Parent)', avatar: 'SP', role: 'Parent', isOnline: false, lastSeen: 'Yesterday', phone: '+91 94321 87654' },
  { id: 7, name: 'Mohan Kumar (Parent)', avatar: 'MK', role: 'Parent', isOnline: false, lastSeen: '3 days ago' },
  { id: 8, name: 'Rajesh Pandey', avatar: 'RP', role: 'Staff', department: 'Library', isOnline: true },
  { id: 9, name: 'Kavita Joshi', avatar: 'KJ', role: 'Staff', department: 'Administration', isOnline: false, lastSeen: '1 hour ago' },
  { id: 10, name: 'Suresh Nair', avatar: 'SN', role: 'Teacher', department: 'English', isOnline: true, email: 'suresh@school.com' },
];

const INITIAL_CHATS: Chat[] = [
  { id: 1, type: 'direct', name: 'Dr. Vikram Singh', avatar: 'VS', participantIds: [0, 1], lastMessage: 'Great, I will upload it right away!', lastMessageTime: '6:35 PM', unreadCount: 0, isPinned: true },
  { id: 2, type: 'group', name: 'Science Teachers Group', avatar: '🔬', participantIds: [0, 1, 2, 3, 10], lastMessage: 'Lab schedule updated for next week', lastMessageTime: '5:00 PM', unreadCount: 3, isPinned: true, description: 'Coordination group for all science department teachers', adminIds: [0] },
  { id: 3, type: 'direct', name: 'Priya Sharma', avatar: 'PS', participantIds: [0, 2], lastMessage: 'Math test results are ready', lastMessageTime: '3:20 PM', unreadCount: 1 },
  { id: 4, type: 'channel', name: '📣 School Announcements', avatar: '📣', participantIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], lastMessage: 'Annual day celebration on Dec 15!', lastMessageTime: '2:00 PM', unreadCount: 0, isPinned: false, isReadOnly: true, description: 'Official school-wide announcements. Only admins can post.' },
  { id: 5, type: 'group', name: 'Class 10-A Parents', avatar: '👨‍👩‍👧', participantIds: [0, 6, 7], lastMessage: 'PTM scheduled for Saturday', lastMessageTime: '11:30 AM', unreadCount: 2, adminIds: [0] },
  { id: 6, type: 'direct', name: 'Anjali Verma', avatar: 'AV', participantIds: [0, 4], lastMessage: 'Sir, about the biology project...', lastMessageTime: 'Yesterday', unreadCount: 0 },
  { id: 7, type: 'direct', name: 'Rajesh Pandey', avatar: 'RP', participantIds: [0, 8], lastMessage: 'Library fine collection done', lastMessageTime: 'Yesterday', unreadCount: 0 },
  { id: 8, type: 'broadcast', name: '📢 Broadcast List', avatar: '📢', participantIds: [0, 1, 2, 3, 4, 5], lastMessage: 'Fee reminder sent to all parents', lastMessageTime: '2 days ago', unreadCount: 0, description: 'One-way broadcast to multiple recipients' },
];

const INITIAL_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 101, chatId: 1, senderId: 1, senderName: 'Dr. Vikram Singh', senderAvatar: 'VS', text: 'Good evening sir, did you check the exam blueprint for next week?', type: 'text', time: '6:30 PM', timestamp: Date.now() - 600000, status: 'read', reactions: [], isPinned: false, replyTo: null },
    { id: 102, chatId: 1, senderId: 0, senderName: 'Admin (You)', senderAvatar: 'AD', text: 'Yes Vikram, it looks perfect. Please share it with the students today itself.', type: 'text', time: '6:32 PM', timestamp: Date.now() - 480000, status: 'read', reactions: [{ emoji: '👍', users: [1] }], isPinned: false, replyTo: null },
    { id: 103, chatId: 1, senderId: 1, senderName: 'Dr. Vikram Singh', senderAvatar: 'VS', text: 'Great, I will upload it as a class notice right away!', type: 'text', time: '6:35 PM', timestamp: Date.now() - 360000, status: 'read', reactions: [], isPinned: true, replyTo: null },
    { id: 104, chatId: 1, senderId: 1, senderName: 'Dr. Vikram Singh', senderAvatar: 'VS', text: 'Exam_Blueprint_Nov2026.pdf', type: 'file', fileName: 'Exam_Blueprint_Nov2026.pdf', fileSize: '2.4 MB', time: '6:36 PM', timestamp: Date.now() - 300000, status: 'read', reactions: [], isPinned: false, replyTo: null },
    { id: 105, chatId: 1, senderId: 0, senderName: 'Admin (You)', senderAvatar: 'AD', text: 'Received. Thank you!', type: 'text', time: '6:40 PM', timestamp: Date.now() - 240000, status: 'read', reactions: [{ emoji: '❤️', users: [1] }], isPinned: false, replyTo: null },
  ],
  2: [
    { id: 201, chatId: 2, senderId: 0, senderName: 'Admin (You)', senderAvatar: 'AD', text: 'Welcome to the Science Teachers Group! This is our coordination hub.', type: 'system', time: '9:00 AM', timestamp: Date.now() - 3600000, status: 'read', reactions: [], isPinned: false, replyTo: null },
    { id: 202, chatId: 2, senderId: 1, senderName: 'Dr. Vikram Singh', senderAvatar: 'VS', text: 'Great initiative! We can share resources and coordinate test schedules here.', type: 'text', time: '9:05 AM', timestamp: Date.now() - 3300000, status: 'read', reactions: [{ emoji: '🙌', users: [2, 3, 10] }], isPinned: false, replyTo: null },
    { id: 203, chatId: 2, senderId: 2, senderName: 'Priya Sharma', senderAvatar: 'PS', text: 'Lab schedule has been updated. Class 10 labs shifted to Wednesday 2pm.', type: 'text', time: '5:00 PM', timestamp: Date.now() - 120000, status: 'delivered', reactions: [], isPinned: false, replyTo: null },
    { id: 204, chatId: 2, senderId: 3, senderName: 'Rahul Mehta', senderAvatar: 'RM', text: 'Noted! Chemistry practical will also be on same day then.', type: 'text', time: '5:02 PM', timestamp: Date.now() - 60000, status: 'delivered', reactions: [], isPinned: false, replyTo: null },
    { id: 205, chatId: 2, senderId: 10, senderName: 'Suresh Nair', senderAvatar: 'SN', text: 'Lab schedule updated for next week', type: 'text', time: '5:10 PM', timestamp: Date.now() - 30000, status: 'sent', reactions: [], isPinned: false, replyTo: null },
  ],
  3: [
    { id: 301, chatId: 3, senderId: 2, senderName: 'Priya Sharma', senderAvatar: 'PS', text: 'Sir, the math test results are ready. Should I post them on the notice board?', type: 'text', time: '3:20 PM', timestamp: Date.now() - 900000, status: 'delivered', reactions: [], isPinned: false, replyTo: null },
  ],
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

const ROLE_COLORS: Record<UserRole, string> = {
  Admin: 'bg-purple-600',
  Teacher: 'bg-blue-600',
  Student: 'bg-emerald-600',
  Parent: 'bg-orange-500',
  Staff: 'bg-slate-600',
};

const ROLE_BADGES: Record<UserRole, string> = {
  Admin: 'bg-purple-100 text-purple-700 border-purple-200',
  Teacher: 'bg-blue-100 text-blue-700 border-blue-200',
  Student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Parent: 'bg-orange-100 text-orange-700 border-orange-200',
  Staff: 'bg-slate-100 text-slate-700 border-slate-200',
};

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🙌', '✅'];

function getContactById(id: number): Contact | undefined {
  if (id === 0) return ME;
  return CONTACTS.find(c => c.id === id);
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// Avatar component
const Avatar: React.FC<{ text: string; size?: 'xs' | 'sm' | 'md' | 'lg'; colorClass?: string; isOnline?: boolean }> = ({
  text, size = 'md', colorClass = 'bg-indigo-600', isOnline
}) => {
  const sizeMap = { xs: 'w-5 h-5 text-[7px]', sm: 'w-7 h-7 text-[9px]', md: 'w-8 h-8 text-[10px]', lg: 'w-10 h-10 text-xs' };
  const dotMap = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizeMap[size]} ${colorClass} text-white font-bold rounded-full flex items-center justify-center`}>
        {text.length <= 2 ? text : text.charAt(0)}
      </div>
      {isOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 ${dotMap[size]} rounded-full border-2 border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      )}
    </div>
  );
};

// Typing indicator
const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const InternalMessagingManager: React.FC = () => {
  // ── State ──
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [messages, setMessages] = useState<Record<number, Message[]>>(INITIAL_MESSAGES);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(1);
  const [contacts, setContacts] = useState<Contact[]>(CONTACTS);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts' | 'starred' | 'archived'>('chats');
  const [searchQ, setSearchQ] = useState('');
  const [msgText, setMsgText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<number[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<number[]>([]);
  const [msgSearchQ, setMsgSearchQ] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | 'All'>('All');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTargets, setBroadcastTargets] = useState<number[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);

  // ── Derived data ──
  const selectedChat = chats.find(c => c.id === selectedChatId) || null;
  const chatMessages = selectedChatId ? (messages[selectedChatId] || []) : [];
  const pinnedMsgs = chatMessages.filter(m => m.isPinned);

  const filteredChats = chats.filter(c => {
    if (c.isArchived && activeTab !== 'archived') return false;
    if (!c.isArchived && activeTab === 'archived') return false;
    if (activeTab === 'starred') return c.isPinned;
    if (!searchQ) return true;
    return c.name.toLowerCase().includes(searchQ.toLowerCase());
  });

  const filteredContacts = contacts.filter(c => {
    const matchSearch = !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase());
    const matchRole = filterRole === 'All' || c.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredMessages = msgSearchQ
    ? chatMessages.filter(m => m.text.toLowerCase().includes(msgSearchQ.toLowerCase()))
    : chatMessages;

  const totalUnread = chats.reduce((s, c) => s + c.unreadCount, 0);

  // ── Effects ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, unreadCount: 0 } : c));
    }
  }, [selectedChatId]);

  // Typing simulation for group chat
  useEffect(() => {
    if (selectedChatId === 2) {
      const t = setTimeout(() => setIsTyping(true), 3000);
      const t2 = setTimeout(() => setIsTyping(false), 6000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [selectedChatId]);

  // ── Handlers ──
  const sendMessage = useCallback(() => {
    const text = editingMsg ? msgText : msgText.trim();
    if (!text) return;

    if (editingMsg) {
      setMessages(prev => ({
        ...prev,
        [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
          m.id === editingMsg.id ? { ...m, text, isEdited: true } : m
        )
      }));
      setEditingMsg(null);
      setMsgText('');
      toast.success('Message edited');
      return;
    }

    const newMsg: Message = {
      id: Date.now(),
      chatId: selectedChatId!,
      senderId: 0,
      senderName: 'Admin (You)',
      senderAvatar: 'AD',
      text,
      type: 'text',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'sending',
      reactions: [],
      isPinned: false,
      replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, senderName: replyingTo.senderName } : null,
    };

    setMessages(prev => ({
      ...prev,
      [selectedChatId!]: [...(prev[selectedChatId!] || []), newMsg]
    }));
    setChats(prev => prev.map(c =>
      c.id === selectedChatId ? { ...c, lastMessage: text, lastMessageTime: 'Just now' } : c
    ));
    setMsgText('');
    setReplyingTo(null);

    // Status progression
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
          m.id === newMsg.id ? { ...m, status: 'sent' } : m
        )
      }));
    }, 500);
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
          m.id === newMsg.id ? { ...m, status: 'delivered' } : m
        )
      }));
    }, 1500);
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
          m.id === newMsg.id ? { ...m, status: 'read' } : m
        )
      }));
      // Auto reply from other person (only for direct chats)
      if (selectedChat?.type === 'direct') {
        const otherParticipantId = selectedChat.participantIds.find(id => id !== 0);
        const otherContact = otherParticipantId !== undefined ? getContactById(otherParticipantId) : undefined;
        if (otherContact) {
          const replies = [
            'Got it, thanks!', 'Sure, I will look into this.', 'Noted!',
            'Okay, will update you shortly.', 'Thanks for the information!', 'Understood!'
          ];
          const replyMsg: Message = {
            id: Date.now() + 1,
            chatId: selectedChatId!,
            senderId: otherContact.id,
            senderName: otherContact.name,
            senderAvatar: otherContact.avatar,
            text: replies[Math.floor(Math.random() * replies.length)],
            type: 'text',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            status: 'read',
            reactions: [],
            isPinned: false,
            replyTo: null,
          };
          setMessages(prev => ({
            ...prev,
            [selectedChatId!]: [...(prev[selectedChatId!] || []), replyMsg]
          }));
          setChats(prev => prev.map(c =>
            c.id === selectedChatId ? { ...c, lastMessage: replyMsg.text, lastMessageTime: 'Just now' } : c
          ));
        }
      }
    }, 3000);
  }, [msgText, selectedChatId, selectedChat, replyingTo, editingMsg]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages(prev => ({
      ...prev,
      [selectedChatId!]: (prev[selectedChatId!] || []).map(m => {
        if (m.id !== msgId) return m;
        const existingIdx = m.reactions.findIndex(r => r.emoji === emoji);
        if (existingIdx >= 0) {
          const newReactions = [...m.reactions];
          if (newReactions[existingIdx].users.includes(0)) {
            newReactions[existingIdx] = { ...newReactions[existingIdx], users: newReactions[existingIdx].users.filter(u => u !== 0) };
            if (newReactions[existingIdx].users.length === 0) newReactions.splice(existingIdx, 1);
          } else {
            newReactions[existingIdx] = { ...newReactions[existingIdx], users: [...newReactions[existingIdx].users, 0] };
          }
          return { ...m, reactions: newReactions };
        }
        return { ...m, reactions: [...m.reactions, { emoji, users: [0] }] };
      })
    }));
    setShowEmojiPicker(null);
  };

  const togglePinMsg = (msgId: number) => {
    setMessages(prev => ({
      ...prev,
      [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
        m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
      )
    }));
    toast.success('Message pin status updated');
  };

  const deleteMessages = (ids: number[]) => {
    setMessages(prev => ({
      ...prev,
      [selectedChatId!]: (prev[selectedChatId!] || []).map(m =>
        ids.includes(m.id) ? { ...m, text: 'This message was deleted', isDeleted: true } : m
      )
    }));
    setSelectedMsgIds([]);
    toast.success(`${ids.length} message(s) deleted`);
  };

  const forwardMessages = (ids: number[]) => {
    toast.success(`${ids.length} message(s) forwarded`);
    setSelectedMsgIds([]);
  };

  const createGroup = () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) {
      toast.error('Group name and at least one member required');
      return;
    }
    const newChat: Chat = {
      id: Date.now(),
      type: 'group',
      name: newGroupName,
      avatar: newGroupName.charAt(0).toUpperCase(),
      participantIds: [0, ...newGroupMembers],
      lastMessage: 'Group created',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      adminIds: [0],
    };
    setChats(prev => [newChat, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newChat.id]: [{
        id: Date.now(), chatId: newChat.id, senderId: 0,
        senderName: 'Admin (You)', senderAvatar: 'AD',
        text: `Group "${newGroupName}" created with ${newGroupMembers.length + 1} members.`,
        type: 'system', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(), status: 'read', reactions: [], isPinned: false, replyTo: null
      }]
    }));
    setSelectedChatId(newChat.id);
    setShowNewGroupModal(false);
    setNewGroupName('');
    setNewGroupMembers([]);
    toast.success(`Group "${newGroupName}" created!`);
  };

  const openDirectChat = (contact: Contact) => {
    const existing = chats.find(c => c.type === 'direct' && c.participantIds.includes(contact.id));
    if (existing) {
      setSelectedChatId(existing.id);
    } else {
      const newChat: Chat = {
        id: Date.now(),
        type: 'direct',
        name: contact.name,
        avatar: contact.avatar,
        participantIds: [0, contact.id],
        unreadCount: 0,
      };
      setChats(prev => [newChat, ...prev]);
      setMessages(prev => ({ ...prev, [newChat.id]: [] }));
      setSelectedChatId(newChat.id);
    }
    setMobileView('chat');
    setShowNewChatModal(false);
  };

  const toggleArchive = (chatId: number) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived } : c));
    toast.success('Chat archive status updated');
  };

  const toggleMuteChat = (chatId: number) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c));
    toast.success('Mute status updated');
  };

  const sendBroadcast = () => {
    if (!broadcastMsg.trim() || broadcastTargets.length === 0) {
      toast.error('Select recipients and write a message');
      return;
    }
    toast.success(`Broadcast sent to ${broadcastTargets.length} recipients!`);
    setBroadcastMsg('');
    setBroadcastTargets([]);
    setShowBroadcastModal(false);
  };

  // ── Chat participants info ──
  const chatParticipants = selectedChat
    ? selectedChat.participantIds.map(id => getContactById(id)).filter(Boolean) as Contact[]
    : [];

  const otherParticipant = selectedChat?.type === 'direct'
    ? chatParticipants.find(p => p.id !== 0)
    : null;

  // ── Status icon ──
  const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
    if (status === 'sending') return <Clock className="w-3 h-3 text-slate-400" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-slate-400" />;
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-400" />;
    return <CheckCheck className="w-3 h-3 text-blue-400" />;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-120px)] min-h-[600px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white/10 rounded-lg">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-extrabold text-[11px] tracking-tight leading-tight">Internal Messaging Portal</h1>
            <p className="text-[9px] text-indigo-200 font-medium">School Communication Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {totalUnread > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {totalUnread} unread
            </span>
          )}
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
          >
            <Megaphone className="w-3 h-3" /> Broadcast
          </button>
          <button
            onClick={() => setShowNewGroupModal(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
          >
            <Users className="w-3 h-3" /> New Group
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
          >
            <Edit3 className="w-3 h-3" /> New Chat
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL: Chat/Contact List ── */}
        <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 flex-col border-r border-slate-200 flex-shrink-0`}>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 text-[10px] font-bold">
            {(['chats', 'contacts', 'starred', 'archived'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQ(''); }}
                className={`flex-1 py-2 capitalize transition ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                {tab}
                {tab === 'chats' && totalUnread > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-full">{totalUnread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={activeTab === 'contacts' ? 'Search contacts...' : 'Search chats...'}
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="bg-transparent w-full text-[10px] font-semibold outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            {/* Role filter for contacts tab */}
            {activeTab === 'contacts' && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {(['All', 'Teacher', 'Student', 'Parent', 'Staff'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border transition cursor-pointer ${
                      filterRole === role
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'contacts' ? (
              // Contacts List
              <div className="divide-y divide-slate-50">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => openDirectChat(contact)}
                    className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50/30 cursor-pointer transition group"
                  >
                    <Avatar
                      text={contact.avatar}
                      colorClass={ROLE_COLORS[contact.role]}
                      isOnline={contact.isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-800 truncate leading-tight">{contact.name}</span>
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded border flex-shrink-0 ${ROLE_BADGES[contact.role]}`}>
                          {contact.role}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate font-medium mt-0.5 leading-tight">
                        {contact.department || (contact.class ? `Class ${contact.class}-${contact.section}` : contact.email || '')}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">
                        {contact.isOnline ? '🟢 Online' : `⚫ ${contact.lastSeen || 'Offline'}`}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 bg-indigo-600 text-white rounded-lg transition flex-shrink-0">
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-[10px] font-semibold">No contacts found</p>
                  </div>
                )}
              </div>
            ) : (
              // Chats List
              <div className="divide-y divide-slate-50">
                {filteredChats.map(chat => {
                  const isSelected = chat.id === selectedChatId;
                  const chatContact = chat.type === 'direct'
                    ? chat.participantIds.find(id => id !== 0) !== undefined
                      ? getContactById(chat.participantIds.find(id => id !== 0)!)
                      : undefined
                    : undefined;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => { setSelectedChatId(chat.id); setMobileView('chat'); setShowRightPanel(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition group relative ${isSelected ? 'bg-indigo-50 border-r-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                    >
                      {/* Pinned indicator */}
                      {chat.isPinned && (
                        <div className="absolute top-1 right-1">
                          <Pin className="w-2.5 h-2.5 text-indigo-400" />
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {chat.type === 'direct' ? (
                          <Avatar
                            text={chat.avatar}
                            colorClass={chatContact ? ROLE_COLORS[chatContact.role] : 'bg-slate-600'}
                            isOnline={chatContact?.isOnline}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-full flex items-center justify-center text-base shadow-sm">
                            {chat.avatar.length > 2 ? chat.avatar : <span className="text-[10px] font-bold">{chat.avatar}</span>}
                          </div>
                        )}
                        {chat.type === 'group' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                            <Users className="w-2.5 h-2.5" />
                          </div>
                        )}
                        {chat.type === 'channel' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center">
                            <Hash className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] font-bold truncate leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
                            {chat.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium flex-shrink-0">{chat.lastMessageTime}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[9px] text-slate-400 truncate font-medium flex-1 min-w-0 leading-tight">
                            {chat.isMuted && <VolumeX className="w-2.5 h-2.5 inline mr-0.5" />}
                            {chat.lastMessage}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="flex-shrink-0 ml-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Context Actions (hover) */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm z-10">
                        <button
                          onClick={e => { e.stopPropagation(); toggleMuteChat(chat.id); }}
                          className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                          title={chat.isMuted ? 'Unmute' : 'Mute'}
                        >
                          {chat.isMuted ? <Bell className="w-3 h-3 text-slate-500" /> : <BellOff className="w-3 h-3 text-slate-500" />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleArchive(chat.id); }}
                          className="p-1 hover:bg-slate-100 rounded cursor-pointer"
                          title={chat.isArchived ? 'Unarchive' : 'Archive'}
                        >
                          <Archive className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredChats.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <MessageSquare className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-[10px] font-semibold">No chats found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER: Chat Window ── */}
        <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 overflow-hidden`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
                    onClick={() => setMobileView('list')}
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => setShowRightPanel(!showRightPanel)}
                  >
                    {selectedChat.type === 'direct' ? (
                      <Avatar
                        text={selectedChat.avatar}
                        colorClass={otherParticipant ? ROLE_COLORS[otherParticipant.role] : 'bg-slate-600'}
                        isOnline={otherParticipant?.isOnline}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-full flex items-center justify-center text-base shadow-sm">
                        {selectedChat.avatar}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-[11px] text-slate-800 leading-tight">{selectedChat.name}</div>
                      <div className="text-[9px] font-medium text-slate-400 leading-tight">
                        {selectedChat.type === 'direct'
                          ? (otherParticipant?.isOnline ? '🟢 Online' : `⚫ ${otherParticipant?.lastSeen || 'Offline'}`)
                          : selectedChat.type === 'group'
                          ? `${selectedChat.participantIds.length} members`
                          : selectedChat.type === 'channel'
                          ? `${selectedChat.participantIds.length} subscribers`
                          : 'Broadcast list'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Action buttons */}
                <div className="flex items-center gap-1.5">
                  {pinnedMsgs.length > 0 && (
                    <button
                      onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                      className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2 py-1 rounded-lg text-[10px] cursor-pointer hover:bg-amber-100 transition"
                    >
                      <Pin className="w-3 h-3" /> {pinnedMsgs.length} pinned
                    </button>
                  )}
                  {selectedMsgIds.length > 0 && (
                    <>
                      <button
                        onClick={() => forwardMessages(selectedMsgIds)}
                        className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer text-[10px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1"
                      >
                        <Forward className="w-3.5 h-3.5" /> Forward ({selectedMsgIds.length})
                      </button>
                      <button
                        onClick={() => deleteMessages(selectedMsgIds)}
                        className="p-2 hover:bg-red-50 rounded-lg cursor-pointer text-[10px] font-bold text-red-600 border border-red-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                      <button
                        onClick={() => setSelectedMsgIds([])}
                        className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  )}
                  {!showMsgSearch ? (
                    <>
                      <button onClick={() => toast.success('Voice call initiated')} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition" title="Voice Call">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => toast.success('Video call initiated')} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition" title="Video Call">
                        <Video className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => setShowMsgSearch(true)} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition" title="Search messages">
                        <Search className="w-4 h-4 text-slate-500" />
                      </button>
                      <button onClick={() => setShowRightPanel(!showRightPanel)} className={`p-2 rounded-lg cursor-pointer transition ${showRightPanel ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`} title="Chat info">
                        <Info className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search in chat..."
                        value={msgSearchQ}
                        onChange={e => setMsgSearchQ(e.target.value)}
                        className="bg-transparent text-xs font-semibold outline-none w-36 text-slate-700"
                      />
                      <button onClick={() => { setShowMsgSearch(false); setMsgSearchQ(''); }}>
                        <X className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pinned Messages Panel */}
              {showPinnedPanel && pinnedMsgs.length > 0 && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1"><Pin className="w-3 h-3" /> Pinned Messages</span>
                    <button onClick={() => setShowPinnedPanel(false)}>
                      <X className="w-3.5 h-3.5 text-amber-500 cursor-pointer" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {pinnedMsgs.map(pm => (
                      <div key={pm.id} className="text-[10px] text-amber-700 font-semibold bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg flex items-center justify-between">
                        <span className="truncate">{pm.senderName}: "{pm.text}"</span>
                        <button onClick={() => togglePinMsg(pm.id)} className="ml-2 flex-shrink-0">
                          <PinOff className="w-3 h-3 cursor-pointer text-amber-500 hover:text-amber-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/30">
                {filteredMessages.map((msg, idx) => {
                  const isMe = msg.senderId === 0;
                  const isSystem = msg.type === 'system';
                  const isSelected = selectedMsgIds.includes(msg.id);
                  const showAvatar = !isMe && !isSystem && (idx === 0 || filteredMessages[idx - 1].senderId !== msg.senderId);
                  const showName = !isMe && !isSystem && selectedChat.type !== 'direct';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <span className="bg-slate-200 text-slate-500 text-[10px] font-semibold px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 group relative ${isSelected ? 'bg-indigo-50/80 rounded-xl -mx-2 px-2 py-1' : 'py-0.5'}`}
                    >
                      {/* Select checkbox (on hover) */}
                      <button
                        onClick={() => setSelectedMsgIds(prev =>
                          prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                        )}
                        className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition cursor-pointer`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-400 bg-white'}`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>

                      {/* Avatar for other person */}
                      {!isMe && (
                        <div className="flex-shrink-0 self-end mb-1">
                          {showAvatar ? (
                            <Avatar text={msg.senderAvatar} size="sm" colorClass={
                              getContactById(msg.senderId) ? ROLE_COLORS[getContactById(msg.senderId)!.role] : 'bg-slate-600'
                            } />
                          ) : <div className="w-8" />}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {showName && (
                          <span className="text-[9px] font-bold text-indigo-600 ml-1 leading-tight">{msg.senderName}</span>
                        )}

                        {/* Reply preview */}
                        {msg.replyTo && (
                          <div className={`text-[9px] font-semibold px-2 py-1 rounded-lg border-l-2 mb-0.5 ${isMe ? 'bg-indigo-500/30 border-white text-white/80 self-end' : 'bg-slate-200 border-indigo-400 text-slate-600'}`}>
                            <span className="font-bold">{msg.replyTo.senderName}:</span> {msg.replyTo.text.slice(0, 50)}...
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`relative px-2.5 py-1.5 rounded-2xl text-[11px] shadow-sm ${
                          msg.isDeleted
                            ? 'bg-slate-200 text-slate-400 italic'
                            : isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                        }`}>
                          {msg.isForwarded && (
                            <div className={`text-[8px] font-bold mb-1 flex items-center gap-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                              <Forward className="w-2.5 h-2.5" /> Forwarded
                            </div>
                          )}

                          {msg.type === 'file' ? (
                            <div className={`flex items-center gap-2 ${isMe ? 'text-white' : 'text-slate-700'}`}>
                              <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                                <FileText className={`w-4 h-4 ${isMe ? 'text-white' : 'text-indigo-600'}`} />
                              </div>
                              <div>
                                 <p className="font-bold text-[10px]">{msg.fileName}</p>
                                 <p className={`text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.fileSize}</p>
                              </div>
                              <button className={`ml-2 p-1.5 rounded-lg cursor-pointer hover:opacity-80 ${isMe ? 'bg-white/20' : 'bg-slate-100'}`}>
                                <Download className={`w-3.5 h-3.5 ${isMe ? 'text-white' : 'text-slate-600'}`} />
                              </button>
                            </div>
                          ) : (
                            <p className={`font-medium leading-snug ${msg.isDeleted ? 'italic' : ''}`}>{msg.text}</p>
                          )}

                          {msg.isEdited && !msg.isDeleted && (
                            <span className={`text-[8px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}> (edited)</span>
                          )}

                          {/* Timestamp + status */}
                          <div className={`flex items-center gap-1 justify-end mt-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <span className="text-[8px] font-medium">{msg.time}</span>
                            {isMe && <StatusIcon status={msg.status} />}
                            {msg.isPinned && <Pin className="w-2 h-2" />}
                          </div>
                        </div>

                        {/* Reactions */}
                        {msg.reactions.length > 0 && (
                          <div className={`flex gap-1 flex-wrap ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {msg.reactions.map(r => (
                              <button
                                key={r.emoji}
                                onClick={() => addReaction(msg.id, r.emoji)}
                                className={`text-[10px] bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm cursor-pointer hover:border-indigo-300 transition ${r.users.includes(0) ? 'border-indigo-400 bg-indigo-50' : ''}`}
                              >
                                {r.emoji} {r.users.length}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Hover Action Bar */}
                        {!msg.isDeleted && (
                          <div className={`opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ${isMe ? 'self-end' : 'self-start'} transition absolute ${isMe ? '-left-24 top-0' : 'left-full ml-2 top-0'} bg-white border border-slate-200 rounded-xl shadow-md px-1 py-0.5 z-10`}>
                            {/* Quick reactions */}
                            {['👍', '❤️', '😂'].map(e => (
                              <button key={e} onClick={() => addReaction(msg.id, e)} className="text-sm hover:scale-125 transition cursor-pointer px-0.5">
                                {e}
                              </button>
                            ))}
                            <div className="w-px h-4 bg-slate-200 mx-0.5" />
                            <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-slate-100 rounded cursor-pointer" title="Reply">
                              <Reply className="w-3 h-3 text-slate-500" />
                            </button>
                            {isMe && (
                              <button onClick={() => { setEditingMsg(msg); setMsgText(msg.text); }} className="p-1 hover:bg-slate-100 rounded cursor-pointer" title="Edit">
                                <Edit3 className="w-3 h-3 text-slate-500" />
                              </button>
                            )}
                            <button onClick={() => togglePinMsg(msg.id)} className="p-1 hover:bg-slate-100 rounded cursor-pointer" title={msg.isPinned ? 'Unpin' : 'Pin'}>
                              <Pin className="w-3 h-3 text-slate-500" />
                            </button>
                            <button onClick={() => { setSelectedMsgIds([msg.id]); forwardMessages([msg.id]); }} className="p-1 hover:bg-slate-100 rounded cursor-pointer" title="Forward">
                              <Forward className="w-3 h-3 text-slate-500" />
                            </button>
                            {isMe && (
                              <button onClick={() => deleteMessages([msg.id])} className="p-1 hover:bg-red-50 rounded cursor-pointer" title="Delete">
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            )}
                            {/* More emoji picker */}
                            <div className="relative">
                              <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 hover:bg-slate-100 rounded cursor-pointer">
                                <Smile className="w-3 h-3 text-slate-500" />
                              </button>
                              {showEmojiPicker === msg.id && (
                                <div className={`absolute bottom-full ${isMe ? 'right-0' : 'left-0'} mb-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5 z-20`}>
                                  {EMOJIS.map(e => (
                                    <button key={e} onClick={() => addReaction(msg.id, e)} className="text-lg hover:scale-125 transition cursor-pointer">
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && selectedChat.type === 'group' && (
                  <div className="flex items-center gap-2">
                    <Avatar text="PS" size="sm" colorClass="bg-blue-600" />
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-1.5 shadow-sm">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview */}
              {replyingTo && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-indigo-200 flex-shrink-0">
                  <div className="w-1 h-8 bg-indigo-600 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-indigo-600">{replyingTo.senderName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{replyingTo.text}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-indigo-100 rounded cursor-pointer">
                    <X className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>
              )}

              {/* Edit Preview */}
              {editingMsg && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-200 flex-shrink-0">
                  <Edit3 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-amber-600">Editing message</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{editingMsg.text}</p>
                  </div>
                  <button onClick={() => { setEditingMsg(null); setMsgText(''); }} className="p-1 hover:bg-amber-100 rounded cursor-pointer">
                    <X className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              )}

              {/* Message Input */}
              {selectedChat.isReadOnly && !chatParticipants.some(p => p.id === 0 && p.role === 'Admin') ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-semibold text-slate-400">This is a read-only channel. Only admins can post.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-slate-200 flex-shrink-0">
                  <button onClick={() => toast.success('File attachment picker opened')} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition flex-shrink-0">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                  </button>
                  <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                    <input
                      ref={msgInputRef}
                      type="text"
                      placeholder={editingMsg ? 'Edit message...' : 'Type a message...'}
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent text-[11px] font-medium outline-none text-slate-800 placeholder:text-slate-400"
                    />
                    <button onClick={() => toast.success('Emoji picker opened')} className="cursor-pointer hover:opacity-70 transition">
                      <Smile className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!msgText.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl cursor-pointer transition flex-shrink-0 active:scale-95 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* No chat selected empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-extrabold text-slate-700 text-xs mb-1">Select a conversation</h3>
              <p className="text-slate-400 text-[10px] font-medium max-w-[180px] leading-snug">
                Choose a chat from the list, or start a new conversation.
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: Chat Details ── */}
        {showRightPanel && selectedChat && (
          <div className="hidden lg:flex w-64 flex-col border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">
                {selectedChat.type === 'direct' ? 'Contact Info' : 'Group Info'}
              </span>
              <button onClick={() => setShowRightPanel(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Profile */}
            <div className="p-3 text-center border-b border-slate-100">
              {selectedChat.type === 'direct' ? (
                <>
                  <div className="flex justify-center mb-2">
                    <Avatar
                      text={selectedChat.avatar}
                      size="lg"
                      colorClass={otherParticipant ? ROLE_COLORS[otherParticipant.role] : 'bg-slate-600'}
                      isOnline={otherParticipant?.isOnline}
                    />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-[11px] leading-tight">{selectedChat.name}</h3>
                  {otherParticipant && (
                    <>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${ROLE_BADGES[otherParticipant.role]}`}>
                        {otherParticipant.role}
                      </span>
                      {otherParticipant.department && (
                        <p className="text-[9px] text-slate-400 font-medium mt-1">{otherParticipant.department} Dept.</p>
                      )}
                      {otherParticipant.email && (
                        <p className="text-[9px] text-slate-400 font-medium">{otherParticipant.email}</p>
                      )}
                      {otherParticipant.phone && (
                        <p className="text-[9px] text-slate-400 font-medium">{otherParticipant.phone}</p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold rounded-full flex items-center justify-center text-xl mx-auto mb-1.5 shadow-md">
                    {selectedChat.avatar}
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-[11px] leading-tight">{selectedChat.name}</h3>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5 capitalize">{selectedChat.type} • {selectedChat.participantIds.length} members</p>
                  {selectedChat.description && (
                    <p className="text-[9px] text-slate-500 font-medium mt-1.5 px-1 leading-snug">{selectedChat.description}</p>
                  )}
                </>
              )}

              {/* Action buttons row */}
              <div className="flex justify-center gap-2 mt-3">
                {[
                  { icon: <Phone className="w-3.5 h-3.5" />, label: 'Call', action: () => toast.success('Call initiated') },
                  { icon: <Video className="w-3.5 h-3.5" />, label: 'Video', action: () => toast.success('Video call') },
                  { icon: selectedChat.isMuted ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />, label: selectedChat.isMuted ? 'Unmute' : 'Mute', action: () => toggleMuteChat(selectedChat.id) },
                  { icon: <Archive className="w-3.5 h-3.5" />, label: 'Archive', action: () => { toggleArchive(selectedChat.id); setSelectedChatId(null); setShowRightPanel(false); } },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="w-8 h-8 bg-slate-100 hover:bg-indigo-100 rounded-full flex items-center justify-center text-slate-600 group-hover:text-indigo-600 transition">
                      {btn.icon}
                    </div>
                    <span className="text-[8px] text-slate-400 font-semibold">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Group Members */}
            {selectedChat.type === 'group' && (
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Members ({selectedChat.participantIds.length})</span>
                  <button
                    onClick={() => toast.success('Add member dialog opened')}
                    className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {chatParticipants.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5">
                      <Avatar text={p.avatar} size="xs" colorClass={ROLE_COLORS[p.role]} isOnline={p.isOnline} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-slate-700 truncate leading-tight">{p.name}</p>
                        <p className="text-[8px] text-slate-400 leading-tight">{p.role}</p>
                      </div>
                      {selectedChat.adminIds?.includes(p.id) && (
                        <span className="text-[7px] bg-indigo-100 text-indigo-600 font-bold px-1 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Media/Files */}
            <div className="p-4 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-3">Shared Files</p>
              {chatMessages.filter(m => m.type === 'file').length > 0 ? (
                <div className="space-y-2">
                  {chatMessages.filter(m => m.type === 'file').map(m => (
                    <div key={m.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{m.fileName}</p>
                        <p className="text-[9px] text-slate-400">{m.fileSize}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-indigo-600" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold">No shared files</p>
              )}
            </div>

            {/* Privacy & Settings */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-3">Privacy & Settings</p>
              <div className="space-y-1">
                {[
                  { icon: <BellOff className="w-3.5 h-3.5" />, label: selectedChat.isMuted ? 'Notifications On' : 'Mute Notifications', action: () => toggleMuteChat(selectedChat.id) },
                  { icon: <Archive className="w-3.5 h-3.5" />, label: selectedChat.isArchived ? 'Unarchive Chat' : 'Archive Chat', action: () => toggleArchive(selectedChat.id) },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: 'Block Contact', action: () => toast.success('Block dialog opened'), danger: true },
                  { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Clear Chat History', action: () => { setMessages(prev => ({ ...prev, [selectedChat.id]: [] })); toast.success('Chat cleared'); }, danger: true },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      item.danger ? 'hover:bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-sm">New Chat</span>
              <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search contacts..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="bg-transparent text-xs font-semibold outline-none flex-1" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {CONTACTS.filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => { openDirectChat(c); setSearchQ(''); }} className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition">
                  <Avatar text={c.avatar} size="sm" colorClass={ROLE_COLORS[c.role]} isOnline={c.isOnline} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{c.role} • {c.department || (c.class ? `Class ${c.class}-${c.section}` : '')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NEW GROUP MODAL ── */}
      {showNewGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Create Group
              </span>
              <button onClick={() => { setShowNewGroupModal(false); setNewGroupName(''); setNewGroupMembers([]); }} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-3 flex-shrink-0 border-b border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Group Name</label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. Science Department" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {newGroupMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {newGroupMembers.map(id => {
                    const c = getContactById(id);
                    return c ? (
                      <span key={id} className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        {c.name.split(' ')[0]}
                        <button onClick={() => setNewGroupMembers(prev => prev.filter(m => m !== id))} className="cursor-pointer">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Select Members</p>
              </div>
              {CONTACTS.map(c => {
                const isAdded = newGroupMembers.includes(c.id);
                return (
                  <div key={c.id} onClick={() => setNewGroupMembers(prev => isAdded ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition">
                    <Avatar text={c.avatar} size="sm" colorClass={ROLE_COLORS[c.role]} isOnline={c.isOnline} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isAdded ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {isAdded && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || newGroupMembers.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Create Group ({newGroupMembers.length} members selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST MODAL ── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" /> Broadcast Message
              </span>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Message</label>
              <textarea
                rows={3}
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Type broadcast message..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {broadcastTargets.length > 0 && (
                <p className="text-[10px] font-bold text-indigo-600 mt-2">{broadcastTargets.length} recipients selected</p>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Select Recipients</p>
              </div>
              {CONTACTS.map(c => {
                const isSelected = broadcastTargets.includes(c.id);
                return (
                  <div key={c.id} onClick={() => setBroadcastTargets(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition">
                    <Avatar text={c.avatar} size="sm" colorClass={ROLE_COLORS[c.role]} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={sendBroadcast}
                disabled={!broadcastMsg.trim() || broadcastTargets.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalMessagingManager;
