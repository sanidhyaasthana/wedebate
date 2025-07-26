'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, DataPacket_Kind } from 'livekit-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '../../lib/utils';

interface ChatMessage {
  id: string;
  sender: string;
  senderSid: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system' | 'moderator';
}

interface ChatComponentProps {
  room: Room | null;
  participantName: string;
  role?: 'moderator' | 'participant' | 'audience';
  className?: string;
  maxMessages?: number;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  room,
  participantName,
  role = 'participant',
  className,
  maxMessages = 100,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isChatMuted, setIsChatMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle incoming data messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'chat_message') {
          const newMessage: ChatMessage = {
            id: data.id || `${Date.now()}-${Math.random()}`,
            sender: participant?.identity || 'Unknown',
            senderSid: participant?.sid || 'unknown',
            message: data.message,
            timestamp: new Date(data.timestamp || Date.now()),
            type: data.messageType || 'message',
          };

          setMessages(prev => {
            const updated = [...prev, newMessage];
            // Keep only the last maxMessages
            return updated.slice(-maxMessages);
          });
        } else if (data.type === 'typing_indicator') {
          const senderName = participant?.identity || 'Unknown';
          
          if (data.isTyping) {
            setTypingUsers(prev => new Set([...prev, senderName]));
            
            // Clear typing indicator after 3 seconds
            setTimeout(() => {
              setTypingUsers(prev => {
                const updated = new Set(prev);
                updated.delete(senderName);
                return updated;
              });
            }, 3000);
          } else {
            setTypingUsers(prev => {
              const updated = new Set(prev);
              updated.delete(senderName);
              return updated;
            });
          }
        } else if (data.type === 'chat_moderation' && role === 'moderator') {
          // Handle moderation actions
          if (data.action === 'mute_chat') {
            setIsChatMuted(data.muted);
          } else if (data.action === 'clear_chat') {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Failed to parse chat data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, role, maxMessages]);

  // Send chat message
  const sendMessage = async () => {
    if (!room || !newMessage.trim() || isChatMuted) return;

    try {
      const messageData = {
        type: 'chat_message',
        id: `${Date.now()}-${Math.random()}`,
        message: newMessage.trim(),
        timestamp: Date.now(),
        messageType: role === 'moderator' ? 'moderator' : 'message',
      };

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(messageData));
      
      await room.localParticipant.publishData(encodedData, { reliable: true });

      // Add message to local state immediately
      const localMessage: ChatMessage = {
        id: messageData.id,
        sender: participantName,
        senderSid: room.localParticipant.sid,
        message: messageData.message,
        timestamp: new Date(messageData.timestamp),
        type: messageData.messageType as 'message' | 'moderator',
      };

      setMessages(prev => {
        const updated = [...prev, localMessage];
        return updated.slice(-maxMessages);
      });

      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        sendTypingIndicator(false);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Send typing indicator
  const sendTypingIndicator = async (typing: boolean) => {
    if (!room) return;

    try {
      const typingData = {
        type: 'typing_indicator',
        isTyping: typing,
        timestamp: Date.now(),
      };

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(typingData));
      
      await room.localParticipant.publishData(encodedData, { reliable: false });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
      }
    }, 2000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Moderator actions
  const toggleChatMute = async () => {
    if (!room || role !== 'moderator') return;

    try {
      const moderationData = {
        type: 'chat_moderation',
        action: 'mute_chat',
        muted: !isChatMuted,
        timestamp: Date.now(),
      };

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(moderationData));
      
      await room.localParticipant.publishData(encodedData, { reliable: true });
      setIsChatMuted(!isChatMuted);
    } catch (error) {
      console.error('Failed to toggle chat mute:', error);
    }
  };

  const clearChat = async () => {
    if (!room || role !== 'moderator') return;

    try {
      const moderationData = {
        type: 'chat_moderation',
        action: 'clear_chat',
        timestamp: Date.now(),
      };

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(moderationData));
      
      await room.localParticipant.publishData(encodedData, { reliable: true });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-gray-900">Chat</h3>
        {role === 'moderator' && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleChatMute}
              className="text-xs"
            >
              {isChatMuted ? 'Unmute Chat' : 'Mute Chat'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col space-y-1',
                message.type === 'moderator' && 'bg-blue-50 p-2 rounded',
                message.type === 'system' && 'bg-gray-50 p-2 rounded'
              )}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    message.type === 'moderator' && 'text-blue-600',
                    message.type === 'system' && 'text-gray-600',
                    message.type === 'message' && 'text-gray-900'
                  )}
                >
                  {message.sender}
                  {message.type === 'moderator' && ' (Moderator)'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-700 break-words">
                {message.message}
              </p>
            </div>
          ))
        )}
        
        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="text-sm text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        {isChatMuted && role !== 'moderator' ? (
          <div className="text-center text-gray-500 text-sm py-2">
            Chat has been muted by the moderator
          </div>
        ) : (
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!room}
            />
            <Button
              onClick={sendMessage}
              disabled={!room || !newMessage.trim()}
              size="sm"
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;