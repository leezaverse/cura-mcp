import React, { useEffect, useRef } from 'react'
import type { UserProfile, ChatMessage } from '../types'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ChatWorkspaceProps {
  user: UserProfile
  chatHistory: ChatMessage[]
  input: string
  setInput: (val: string) => void
  loading: boolean
  error: string | null
  setError: (val: string | null) => void
  onSendPrompt: (e: React.FormEvent) => void
  activeConversationId: string | null
  onStartNewConversation: () => void
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  user,
  chatHistory,
  input,
  setInput,
  loading,
  error,
  setError,
  onSendPrompt,
  activeConversationId,
  onStartNewConversation,
}) => {
  const chatHistoryEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat window when new elements arrive
  useEffect(() => {
    chatHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  return (
    <div className="workspace">
      <section className="chat-area">
        <div className="chat-workspace-toolbar">
          <div className="toolbar-left">
            <span className="session-icon">📂</span>
            <span className="session-label">Session:</span>
            <span className="session-id" title={activeConversationId || ''}>
              {activeConversationId ? activeConversationId : 'None'}
            </span>
          </div>
          <button className="toolbar-new-chat-btn" onClick={onStartNewConversation}>
            ＋ New Chat
          </button>
        </div>

        <div className="chat-history">
          {chatHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3 className="empty-title">Start a new conversation</h3>
              <p className="empty-desc">
                Type a command below to communicate with the Cura MCP backend. You can ask for print profiles, print settings, or slicing calculations.
              </p>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <React.Fragment key={chat.id}>
                {/* User Prompt Message */}
                <div className="message-row user">
                  <div className="message-bubble user">
                    <div className="bubble-header">{user.name} ({chat.timestamp})</div>
                    <div>{chat.prompt}</div>
                  </div>
                </div>

                {/* Assistant Response Message */}
                {chat.response && (
                  <div className="message-row assistant">
                    <div className="message-bubble assistant">
                      <div className="bubble-header">AI response</div>
                      <MarkdownRenderer text={chat.response} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}

          {/* Loading state item */}
          {loading && (
            <div className="message-row assistant">
              <div className="message-bubble assistant" style={{ background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                <div className="bubble-header">Executing Slicer Pipeline</div>
                <div className="loading-row">
                  <div className="pulse-spinner"></div>
                  <span>Processing prompt and building Cura output...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatHistoryEndRef} />
        </div>

        {/* Error notification display */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <span className="error-close" onClick={() => setError(null)}>×</span>
          </div>
        )}

        {/* Bottom entry form bar */}
        <div className="chat-input-container">
          <form className="chat-input-form" onSubmit={onSendPrompt}>
            <textarea
              className="chat-input"
              placeholder="Ask Cura MCP... (e.g. Set bed temperature to 60°C)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSendPrompt(e)
                }
              }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="send-btn" 
              disabled={loading || !input.trim()}
            >
              <span className="send-icon">➔</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
