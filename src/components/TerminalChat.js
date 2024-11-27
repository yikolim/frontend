import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ArrowRight, Bot, XCircle } from 'lucide-react';
import './TerminalChat.css';

const TerminalChat = () => {
  // State declarations
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const sessionIdRef = useRef(`session-${Date.now()}`);

  const connectWebSocket = useCallback(() => {
    console.log('Connecting to WebSocket...');  // Add debug logging
    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionIdRef.current}`);
    
    ws.onopen = () => {
      console.log('Connected');  // Add debug logging
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log('WebSocket Connection Closed');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onmessage = (event) => {
      console.log('Message received:', event.data);  // Add debug logging
      const data = JSON.parse(event.data);
      
      if (data.type === 'output' || data.type === 'error') {
        setMessages(prev => [...prev, {
          type: 'system',
          content: data.content,
          isError: data.type === 'error'
        }]);
      } else if (data.type === 'completion') {
        setIsProcessing(false);
      }
    };

    wsRef.current = ws;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;

    // Add user command to messages
    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsProcessing(true);

    // Send command to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'command',
      content: input
    }));

    setInput('');
  };

  const handleInterrupt = () => {
    if (wsRef.current && isProcessing) {
      wsRef.current.send(JSON.stringify({
        type: 'interrupt'
      }));
    }
  };

  return (
    <div className="terminal-container">
      <div>
        <div className="agent-header">
          <h2 className="agent-title">Terminal</h2>
          {!isConnected && (
            <span className="disconnected">Disconnected</span>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="command-input-container">
            <div className="input-wrapper">
              <Bot className="bot-icon" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter command..."
                className="command-input"
                disabled={!isConnected}
              />
            </div>
            {isProcessing ? (
              <button 
                type="button"
                onClick={handleInterrupt}
                className="action-button interrupt-button"
                title="Interrupt (Ctrl+C)"
              >
                <XCircle className="w-5 h-5" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={!isConnected}
                className="action-button"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="console-container">
        <div 
          className="console-header"
          onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
        >
          <h3 className="console-title">Console Log</h3>
          <ChevronDown className={`rotate-icon ${isConsoleExpanded ? 'expanded' : ''}`} />
        </div>

        {isConsoleExpanded && (
          <div className="console-content">
            <div className="console-output">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${
                    msg.type === 'user' 
                      ? 'user-message' 
                      : msg.isError 
                        ? 'error-message' 
                        : 'system-message'
                  }`}
                >
                  {msg.type === 'user' ? '> ' : ''}
                  {msg.content}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="placeholder-message">print result here</div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalChat;