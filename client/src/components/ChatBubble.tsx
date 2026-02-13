import { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './ChatBubble.module.css';

export function ChatBubble() {
  const { chatMessages, unreadCount, chatOpen, toggleChat, sendChat, playerId } = useGame();
  const [inputText, setInputText] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages when chat is open
  useEffect(() => {
    if (chatOpen && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages, chatOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendChat(text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      {chatOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>CHAT</span>
            <button className={styles.closeButton} onClick={toggleChat}>
              &times;
            </button>
          </div>

          <div className={styles.messageList} ref={messageListRef}>
            {chatMessages.map(msg => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className={`${styles.message} ${styles.systemMessage}`}>
                    <p className={styles.messageText}>{msg.text}</p>
                  </div>
                );
              }

              const isOwn = msg.playerId === playerId;
              return (
                <div
                  key={msg.id}
                  className={`${styles.message} ${isOwn ? styles.ownMessage : styles.otherMessage}`}
                >
                  {!isOwn && <div className={styles.messageNickname}>{msg.nickname}</div>}
                  <p className={styles.messageText}>{msg.text}</p>
                </div>
              );
            })}
          </div>

          <div className={styles.inputArea}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder="Typ een bericht..."
              maxLength={200}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!inputText.trim()}
            >
              &#10148;
            </button>
          </div>
        </div>
      )}

      <button className={styles.bubble} onClick={toggleChat}>
        &#128172;
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
