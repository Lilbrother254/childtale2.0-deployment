
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircleIcon, XIcon, SendIcon, SparklesIcon } from './Icons';
import { sendChatMessage } from '../services/geminiService';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

import { useAuth } from '../src/contexts/AuthContext';

export const ChatBot: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const SYSTEM_PROMPT = `You are "Sparky" ✨, ChildTale's playful and helpful magical assistant! You help parents create magical, personalized coloring books for their children.

POLICIES (CRITICAL):
- 1-Free Regeneration Rule: Every paid book (Digital or Hardcover) includes exactly ONE free regeneration if you're not happy with the first magic weave.
- The Safety Net: If a generation fails or the magic sparkles lose their way, we offer a manual fix or a credit refund for a new try. Just email childtale4@gmail.com!
- Refund Policy: Due to the personalized nature of our magic, all sales are final. Our "Safety Net" and free regeneration ensure every parent and child loves their story!

ABOUT CHILDTALE:
- Personalized children's story generator powered by ChildTale's Magic.
- NO PHOTOS REQUIRED: We value your child's privacy. We do NOT use or support photo uploads. 
- Character consistency: Your child looks the same across all 25 pages! This is achieved entirely through a text description you provide.
- Creates professional coloring book pages (B&W line art, perfect for coloring).
- Digital coloring in the "Magic Studio" or download high-quality PDFs to print at home.
- Free 5-page sample for every new user.

PRICING:
- Free: 5-page sample (Magic Studio access included).
- Digital Book ($24.99): 25-page PDF + Magic Studio.
- Hardcover Book ($49.99): Premium physical keepsake, 8.5" x 11", delivered to your door.

TONE:
- Be playful, enthusiastic, and helpful! 
- Use magical metaphors (weaving stories, magic sparkles, library of dreams).
- Guide users to try the free sample if they are new.
- Ensure parents feel their child is the star of the show!
- You can use markdown formatting (*italic*, **bold**) to emphasize important points.`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Convert markdown formatting to HTML
    const formatMessage = (text: string): string => {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italic
            .replace(/\n/g, '<br/>'); // Line breaks
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Hook Re-ordering Fix: Return null ONLY after all hooks are called
    if (!user) return null;

    const sendMessage = async (messageText?: string) => {
        const textToSend = messageText || input.trim();
        if (!textToSend) return;

        const userMessage: Message = {
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history including the new message
            const newHistory = [...messages, userMessage];

            const responseText = await sendChatMessage(newHistory, SYSTEM_PROMPT);

            const assistantMessage: Message = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Chatbot error:', error);

            // Extract user-friendly error message from the response
            let errorContent = "I'm having trouble connecting right now. Please try again in a moment, or email us at childtale4@gmail.com for immediate help!";

            // Check if error has a message property (from Edge Function)
            if (error?.message) {
                errorContent = error.message;
            }

            const errorMessage: Message = {
                role: 'assistant',
                content: errorContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        "How does ChildTale work?",
        "What's your refund policy?",
        "Tell me about digital coloring",
        "How much does it cost?"
    ];

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
                    style={{ animationDuration: '2s' }}
                >
                    <MessageCircleIcon className="w-8 h-8 text-white" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </button>
            )}

            {/* Chat Interface */}
            {isOpen && (
                <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 animate-fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-black">Sparky ✨</h3>
                                <p className="text-indigo-200 text-xs font-bold">Your magical helper!</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 -mr-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.length === 0 && (
                            <div className="text-center mt-8">
                                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <SparklesIcon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <p className="font-bold text-slate-900 mb-2">Hi! I'm Sparky! ✨👋</p>
                                <p className="text-sm text-slate-500 mb-6">Ask me anything about ChildTale's magic:</p>
                                <div className="space-y-2">
                                    {quickActions.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(action)}
                                            className="w-full bg-white p-3 rounded-xl text-sm text-left hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium border border-slate-200 hover:border-indigo-200"
                                        >
                                            {action}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-white text-slate-900 border border-slate-200'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <p
                                            className="text-sm leading-relaxed font-medium"
                                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                        />
                                    ) : (
                                        <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-600 font-medium text-sm disabled:opacity-50 bg-white text-slate-900"
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isLoading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
                            Need more help? <a href="mailto:childtale4@gmail.com" className="hover:text-indigo-600">Email Support</a>
                        </p>
                    </div>
                </div >
            )}
        </>
    );
};
