// src/app/(dashboard)/messages/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { fetchProfile } from '@/features/auth/api';
import { fetchMyOrders } from '@/features/orders/api';
import { User } from '@/features/auth/types';
import { Order, PopulatedUser } from '@/features/orders/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

const SendIcon = () => <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const PaperClipIcon = () => <svg className="w-6 h-6 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;

interface ChatUser { _id: string; fullName: string; profilePictureUrl: string; }
interface Attachment { url: string; type: 'image' | 'video' | 'document'; }
interface Message { _id: string; content: string; attachment?: Attachment; sender: string | { _id: string, fullName: string }; sentAt: string; }
interface ChatRoom { _id: string; participants: ChatUser[]; messages: Message[]; updatedAt: string; }

export default function ProviderMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myId = user?._id;
  const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

  // Function to fetch rooms separately (reusable)
  const fetchRooms = async () => {
    try {
        const chatRes = await api.get('/chat');
        setRooms(chatRes.data.data);
    } catch (e) { console.error("Error fetching rooms", e); }
  };

  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem('posko_token');
      if (!token) { router.push('/login'); return; }

      try {
        const profileRes = await fetchProfile();
        setUser(profileRes.data.profile);

        // Load Rooms & Orders
        await fetchRooms();
        const ordersRes = await fetchMyOrders('provider');
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const activeOnly = orders.filter(o => 
            ['accepted', 'on_the_way', 'working', 'waiting_approval'].includes(o.status)
        );
        setActiveOrders(activeOnly);

        // Inisialisasi Socket
        if (!socketRef.current) {
          const newSocket = io(SOCKET_URL, { 
            auth: { token }, 
            transports: ['websocket', 'polling'],
            reconnection: true,
          });

          newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
            setRooms(prev => {
              const roomIndex = prev.findIndex(r => r._id === data.roomId);
              // Handle new room (re-fetch if room doesn't exist yet)
              if (roomIndex === -1) {
                fetchRooms(); 
                return prev;
              }
              
              const updatedRoom = { 
                 ...prev[roomIndex], 
                 messages: [...prev[roomIndex].messages, data.message],
                 updatedAt: new Date().toISOString()
              };
              const newRooms = [...prev];
              newRooms.splice(roomIndex, 1);
              newRooms.unshift(updatedRoom);
              return newRooms;
            });

            setActiveRoom(current => {
              if (current && current._id === data.roomId) {
                return { ...current, messages: [...current.messages, data.message] };
              }
              return current;
            });
          });

          socketRef.current = newSocket;
        }

      } catch (error) { 
        console.error(error); 
      } finally { 
        setIsLoading(false); 
      }
    };

    initChat();

    return () => { 
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  const getOpponent = useCallback((room: ChatRoom | null) => {
    if (!room) return null;
    if (!myId) return room.participants[0];
    return room.participants.find(p => p._id !== myId) || room.participants[0];
  }, [myId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!newMessage.trim() || !activeRoom || !socket) return;
    
    socket.emit('send_message', { roomId: activeRoom._id, content: newMessage });
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeRoom && socketRef.current) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) { 
            alert("Ukuran file maksimal 5MB");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/chat/attachment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            socketRef.current.emit('send_message', {
                roomId: activeRoom._id,
                content: '',
                attachment: res.data.data
            });
        } catch (error) {
            console.error("Gagal upload:", error);
            alert("Gagal mengirim gambar");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
  };

  const openRoom = async (room: ChatRoom) => {
    try {
        const res = await api.get(`/chat/${room._id}`);
        setActiveRoom(res.data.data);
        socketRef.current?.emit('join_chat', room._id);
    } catch (error) { console.error(error); }
  };

  const relatedOrder = useMemo(() => {
    if (!activeRoom || !user || activeOrders.length === 0) return null;
    const opponent = getOpponent(activeRoom);
    if (!opponent) return null;

    return activeOrders.find(order => {
        const uId = order.userId;
        const custId = (typeof uId === 'object' && uId !== null) ? (uId as PopulatedUser)._id : String(uId);
        return String(custId) === String(opponent._id);
    });
  }, [activeRoom, activeOrders, user, getOpponent]);

  if (isLoading) return <div className="h-full flex items-center justify-center bg-gray-50 text-sm text-gray-500">Memuat Pesan...</div>;

  return (
    // [LAYOUT FIX] Gunakan h-screen dan overflow-hidden untuk layout dasar
    <div className="h-screen bg-gray-50 font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* LIST ROOMS */}
      <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col ${activeRoom ? 'hidden md:flex' : 'flex'} h-full`}>
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-900">Pesan Pelanggan</h1>
        </div>
        {/* [LAYOUT FIX] pb-24 untuk mengakomodasi bottom nav di mobile */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 md:pb-0">
            {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm p-4 text-center">
                    <p>Belum ada percakapan dengan pelanggan.</p>
                </div>
            ) : (
                rooms.map(room => {
                    const opponent = getOpponent(room);
                    const lastMsg = room.messages[room.messages.length - 1];
                    const isActive = activeRoom?._id === room._id;
                    const senderId = typeof lastMsg?.sender === 'object' ? lastMsg.sender._id : lastMsg?.sender;

                    return (
                        <button key={room._id} onClick={() => openRoom(room)} className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-all text-left border-b border-gray-50 ${isActive ? 'bg-red-50' : ''}`}>
                            <div className="relative w-12 h-12 shrink-0">
                                <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                    <Image src={opponent?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.fullName}`} alt="User" width={48} height={48} className="object-cover" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={`text-sm font-bold truncate ${isActive ? 'text-red-700' : 'text-gray-900'}`}>{opponent?.fullName || 'Pelanggan'}</h4>
                                    <span className="text-[10px] text-gray-400">{lastMsg ? new Date(lastMsg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false}) : ''}</span>
                                </div>
                                <p className={`text-xs truncate ${isActive ? 'text-red-600/70' : 'text-gray-500'}`}>
                                    {lastMsg ? (
                                        lastMsg.attachment ? (
                                            <span className="flex items-center gap-1">📸 Gambar</span>
                                        ) : (
                                            senderId === myId ? `Anda: ${lastMsg.content}` : lastMsg.content
                                        )
                                    ) : <span className="italic opacity-60">Mulai obrolan...</span>}
                                </p>
                            </div>
                        </button>
                    );
                })
            )}
        </div>
      </div>

      {/* DETAIL CHAT */}
      <div className={`w-full md:w-2/3 lg:w-3/4 bg-[#f0f2f5] flex-col ${activeRoom ? 'flex' : 'hidden md:flex'} h-full relative`}>
        {activeRoom ? (
            <>
                {/* HEADER CHAT */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col sticky top-0 z-20 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><BackIcon /></button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                            <Image src={getOpponent(activeRoom)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOpponent(activeRoom)?.fullName}`} alt="User" width={40} height={40} className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{getOpponent(activeRoom)?.fullName || 'Pelanggan'}</span>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                            </span>
                        </div>
                    </div>
                    
                    {/* [FITUR BARU] ORDER SNIPPET */}
                    {relatedOrder && (
                        <div onClick={() => router.push(`/jobs/${relatedOrder._id}`)} className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-200 text-blue-700 p-1.5 rounded-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Order Aktif: #{relatedOrder.orderNumber.split('-')[2]}</p>
                                    <p className="text-xs text-blue-700 font-medium">{relatedOrder.items[0]?.name} {relatedOrder.items.length > 1 && `+${relatedOrder.items.length - 1} lainnya`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-blue-700">
                                Detail <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* MESSAGE LIST */}
                {/* [LAYOUT FIX] pb-32 agar input area dan bottom nav tidak menutupi pesan terakhir */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32 md:pb-24">
                    {activeRoom.messages.map((msg, idx) => {
                        const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                        const isMe = senderId === myId;
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[60%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words ${
                                    isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                                }`}>
                                    {/* [FIXED] SAFE CHECK UNTUK ATTACHMENT URL */}
                                    {msg.attachment && msg.attachment.type === 'image' && msg.attachment.url && (
                                        <div className="mb-2 rounded-lg overflow-hidden relative w-full h-48 sm:w-64 sm:h-48 bg-black/10">
                                            <Image 
                                                src={msg.attachment.url.startsWith('http') ? msg.attachment.url : `${SERVER_URL}${msg.attachment.url}`} 
                                                alt="Attachment"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    
                                    {msg.content && <p>{msg.content}</p>}
                                    
                                    <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                                        {new Date(msg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {isUploading && (
                        <div className="flex justify-end">
                            <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl text-xs text-gray-500 shadow-sm animate-pulse">
                                📤 Mengirim gambar...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA */}
                {/* [LAYOUT FIX] absolute bottom-0 dengan padding bottom (pb-20) untuk menghindari BottomNav di mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 z-30 pb-20 md:pb-3">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <PaperClipIcon />
                        </button>

                        <input 
                            type="text" 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder="Tulis pesan..." 
                            className="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white outline-none" 
                        />
                        <button 
                            type="submit" 
                            disabled={(!newMessage.trim() && !isUploading)} 
                            className="w-11 h-11 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </>
        ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="font-medium">Pilih percakapan untuk melihat detail</p>
            </div>
        )}
      </div>
    </div>
  );
}