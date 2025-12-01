// src/components/ChatWidget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';
import api from '@/lib/axios';
// [FIX 1] Import User type to avoid 'any'
import { User } from '@/features/auth/types';

// --- ICONS ---
const CloseIcon = () => <svg className="w-5 h-5 text-white hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>;
const OpenIcon = () => <svg className="w-5 h-5 text-white hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>;
const SendIcon = () => <svg className="w-5 h-5 text-white translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackIcon = () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;

interface ChatUser {
  _id: string;
  fullName: string;
  profilePictureUrl: string;
}

interface Message {
  _id: string;
  content: string;
  sender: string | { _id: string, fullName: string };
  sentAt: string;
}

interface ChatRoom {
  _id: string;
  participants: ChatUser[];
  messages: Message[];
  updatedAt: string;
}

// [FIX 1] Use User type instead of any
export default function ChatWidget({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // [FIX 2] Use useRef for socket to avoid setState in useEffect causing cascading renders
  const socketRef = useRef<Socket | null>(null);
  
  const [isUnread, setIsUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

  const myId = user?._id || user?.userId;

  useEffect(() => {
    const token = localStorage.getItem('posko_token');
    if (!token) return;

    api.get('/chat').then(res => setRooms(res.data.data)).catch(console.error);

    const newSocket = io(SOCKET_URL, { 
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    newSocket.on('receive_message', (data: { roomId: string, message: Message }) => {
      setRooms(prev => {
        const roomIndex = prev.findIndex(r => r._id === data.roomId);
        if (roomIndex === -1) return prev; 

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
        if (!current || current._id !== data.roomId) setIsUnread(true);
        return current;
      });
    });

    // [FIX 2] Store socket in ref instead of state
    socketRef.current = newSocket;

    return () => { 
      console.log('🔌 Disconnecting socket...');
      newSocket.disconnect(); 
      socketRef.current = null;
    };
  }, [SOCKET_URL]);

  useEffect(() => {
    if (isOpen && activeRoom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        // [FIX 3] Removed setIsUnread(false) from here to avoid cascading updates.
        // It is now handled in the toggle handler.
    }
  }, [activeRoom?.messages, isOpen, activeRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!newMessage.trim() || !activeRoom || !socket) return;

    socket.emit('send_message', {
      roomId: activeRoom._id,
      content: newMessage
    });
    setNewMessage('');
  };

  const openRoom = async (room: ChatRoom) => {
    try {
        const res = await api.get(`/chat/${room._id}`);
        setActiveRoom(res.data.data);
        socketRef.current?.emit('join_chat', room._id);
    } catch (error) {
        console.error(error);
    }
  };

  const getOpponent = (room: ChatRoom) => {
    return room.participants.find(p => p._id !== myId) || room.participants[0];
  };

  const getSenderId = (sender: string | { _id: string }) => {
    return typeof sender === 'object' ? sender._id : sender;
  };

  return (
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end font-sans">
        <div 
            className={`bg-white border border-gray-300 rounded-t-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out overflow-hidden w-[320px] md:w-[360px] ${
                isOpen ? 'h-[500px]' : 'h-[48px]'
            }`}
        >
            <div 
                onClick={() => {
                    setIsOpen(!isOpen);
                    // [FIX 3] Handle unread clearing here
                    if (!isOpen) setIsUnread(false);
                }}
                className={`h-12 px-4 flex items-center justify-between cursor-pointer shrink-0 ${
                    isOpen ? 'bg-red-600 border-b border-red-700' : 'bg-white hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {isOpen && activeRoom ?  (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveRoom(null); }} 
                                className="p-1 -ml-2 rounded-full hover:bg-white/20 transition-colors mr-1"
                            >
                                <BackIcon />
                            </button>
                            <div className="relative w-8 h-8 shrink-0">
                                <Image 
                                    src={getOpponent(activeRoom)?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOpponent(activeRoom)?.fullName}`} 
                                    alt="User" width={32} height={32} 
                                    className="rounded-full bg-white border border-white/30 object-cover"
                                />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-red-600 rounded-full"></span>
                            </div>
                            <div className="flex flex-col text-white">
                                <span className="font-bold text-sm leading-tight truncate max-w-[140px]">
                                    {getOpponent(activeRoom)?.fullName}
                                </span>
                                <span className="text-[10px] text-red-100 opacity-90">Active now</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isOpen ? 'bg-white/20 border-white/30 text-white' : 'bg-red-600 border-transparent text-white'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                {isUnread && !isOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>}
                            </div>
                            <span className={`font-bold text-sm ${isOpen ? 'text-white' : 'text-gray-800'}`}>
                                Pesan
                            </span>
                        </div>
                    )}
                </div>

                <div className={`${isOpen ? 'text-white' : 'text-gray-500'}`}>
                    {isOpen ?  <CloseIcon /> : <OpenIcon />}
                </div>
            </div>

            {isOpen && (
                <div className="flex-1 bg-gray-50 overflow-y-auto custom-scrollbar relative flex flex-col">
                    {!activeRoom ? (
                        <div className="divide-y divide-gray-100 bg-white min-h-full">
                            {rooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center opacity-60">
                                    <p className="text-sm">Belum ada pesan.</p>
                                </div>
                            ) : (
                                rooms.map(room => {
                                    const opponent = getOpponent(room);
                                    const lastMsg = room.messages[room.messages.length - 1];
                                    return (
                                        <button 
                                            key={room._id} 
                                            onClick={() => openRoom(room)} 
                                            className="w-full flex items-center gap-3 p-3 hover:bg-red-50/50 transition-colors text-left group"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                                                    <Image 
                                                        src={opponent?.profilePictureUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.fullName}`} 
                                                        alt="User" width={40} height={40} className="object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600">{opponent?.fullName}</h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{lastMsg ?  new Date(lastMsg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false}) : ''}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate font-medium">
                                                    {lastMsg ? (
                                                        getSenderId(lastMsg.sender) === myId 
                                                        ? `Anda: ${lastMsg.content}` 
                                                        : lastMsg.content
                                                    ) : <span className="italic font-normal text-gray-400">Mulai percakapan...</span>}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar bg-[#f0f2f5]">
                            {activeRoom.messages.map((msg, idx) => {
                                const senderId = getSenderId(msg.sender);
                                const isMe = senderId === myId;

                                return (
                                    <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] px-3 py-2 text-sm shadow-sm break-words ${
                                            isMe 
                                            ? 'bg-red-600 text-white rounded-2xl rounded-br-sm' 
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                                                {new Date(msg.sentAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false})}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            )}

            {isOpen && activeRoom && (
                <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tulis pesan..." 
                            className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none placeholder-gray-500 text-gray-900"
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()} 
                            className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-all disabled:bg-gray-200 disabled:shadow-none active:scale-95"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
}