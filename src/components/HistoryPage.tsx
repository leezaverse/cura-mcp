import React, { useState, useEffect } from 'react'

interface ConversationItem {
  conversation_id: string
  last_message_time: string
}

interface HistoryPageProps {
  onSelectConversation: (conversationId: string) => void
  onStartNewConversation: () => void
  activeConversationId: string | null
  jwt: string | null
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectConversation,
  onStartNewConversation,
  activeConversationId,
  jwt,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!jwt) {
      setLoading(false)
      return
    }

    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('http://localhost:3000/conversations', {
          headers: {
            'Authorization': `Bearer ${jwt}`,
          },
        })
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`)
        }
        const data = await response.json()
        setConversations(data)
      } catch (err: any) {
        console.error('Failed to load conversations:', err)
        setError(err.message || 'Failed to connect to the backend server.')
      } finally {
        setLoading(false)
      }
    };

    fetchConversations()
  }, [jwt])

  // Helper to format date strings nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Unknown Date'
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter conversations based on search query (by ID or date)
  const filteredConversations = conversations.filter((c) => {
    const query = searchQuery.toLowerCase()
    const idMatches = c.conversation_id.toLowerCase().includes(query)
    const dateMatches = formatDate(c.last_message_time).toLowerCase().includes(query)
    return idMatches || dateMatches
  })

  return (
    <div className="history-page-container">
      <div className="history-header">
        <div className="history-title-group">
          <h2 className="history-page-title">Conversation History</h2>
          <p className="history-page-desc">
            Browse and resume your past interactions with the Cura MCP slicer engine.
          </p>
        </div>
        <button className="new-chat-history-btn" onClick={onStartNewConversation}>
          <span className="plus-icon">+</span> New Conversation
        </button>
      </div>

      <div className="history-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="history-search-input"
            placeholder="Search conversations by ID or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="history-loading-container">
          <div className="history-spinner"></div>
          <p>Retrieving conversation logs from the database...</p>
        </div>
      ) : error ? (
        <div className="history-error-container">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load history</h3>
          <p>{error}</p>
          <button 
            className="retry-btn" 
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="history-empty-state">
          <div className="empty-history-icon">📂</div>
          <h3>{searchQuery ? 'No matching conversations' : 'No history found'}</h3>
          <p>
            {searchQuery
              ? 'Try refining your search query or check the ID structure.'
              : 'You haven\'t started any conversation yet. Create a new prompt to begin.'}
          </p>
          {!searchQuery && (
            <button className="start-chat-btn" onClick={onStartNewConversation}>
              Start a new session
            </button>
          )}
        </div>
      ) : (
        <div className="conversations-grid">
          {filteredConversations.map((item) => {
            const isActive = item.conversation_id === activeConversationId
            return (
              <div 
                key={item.conversation_id} 
                className={`conversation-card ${isActive ? 'active-card' : ''}`}
                onClick={() => onSelectConversation(item.conversation_id)}
              >
                <div className="card-top">
                  <div className="conversation-avatar">
                    <span>💬</span>
                  </div>
                  {isActive && <span className="active-badge">Active Session</span>}
                </div>
                
                <div className="card-middle">
                  <h4 className="conversation-card-title">
                    Session {item.conversation_id.slice(0, 8)}...
                  </h4>
                  <p className="conversation-id-full">ID: {item.conversation_id}</p>
                </div>
                
                <div className="card-bottom-info">
                  <div className="timestamp-info">
                    <span className="clock-icon">🕒</span>
                    <span className="time-text">{formatDate(item.last_message_time)}</span>
                  </div>
                  <button className="resume-btn">
                    Resume ➔
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
