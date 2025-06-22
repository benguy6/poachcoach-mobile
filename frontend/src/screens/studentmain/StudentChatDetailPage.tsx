import React, { useState } from 'react';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';

interface ChatDetailsPageProps {
  contact: {
    avatar: string;
    name: string;
    // add other fields if needed
  };
  messages: { sender: string; text: string }[];
  onBack: () => void;
}

const ChatDetailsPage: React.FC<ChatDetailsPageProps> = ({ contact, messages, onBack }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim() === '') return;
    // logic to send the message (e.g., call backend or update state)
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-orange-500 text-white">
        <button onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <img src={contact.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
          <div>
            <h2 className="text-lg font-bold">{contact.name}</h2>
            <p className="text-xs text-orange-200">Online</p>
          </div>
        </div>
        <button>
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[75%] px-4 py-2 rounded-lg text-sm shadow-sm ${
              msg.sender === 'me'
                ? 'ml-auto bg-orange-500 text-white'
                : 'bg-white text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center px-4 py-3 border-t border-gray-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none"
        />
        <button onClick={handleSend} className="ml-3 p-2 bg-orange-500 rounded-full text-white">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatDetailsPage;
