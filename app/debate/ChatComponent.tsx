'use client';

import { useEffect, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ChatComponentProps {
  room: Room;
  participantName: string;
  isModerator?: boolean;
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: Date;
}

export default function ChatComponent({
  room,
  participantName,
  isModerator = false,
}: ChatComponentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Handle receiving messages
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant: any) => {
      const text = new TextDecoder().decode(payload);
      const message: ChatMessage = {
        sender: participant?.identity ?? 'Unknown',
        message: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, message]);
    };

    room.on(RoomEvent.DataReceived, handleData);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await room.localParticipant?.publishData(
      new TextEncoder().encode(newMessage),
      { reliable: true }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: participantName,
        message: newMessage,
        timestamp: new Date(),
      },
    ]);
    setNewMessage('');
  };

  return (
    <div className="p-4 border rounded-md shadow-md bg-white">
      <h3 className="text-lg font-semibold mb-2">Live Chat</h3>

      <div className="h-60 overflow-y-auto mb-3 border p-2 rounded">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong className="text-blue-600">{msg.sender}:</strong>{' '}
            <span>{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Input
          value={newMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button onClick={sendMessage} className="bg-blue-600 text-white">
          Send
        </Button>
      </div>
    </div>
  );
}
