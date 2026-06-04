import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { UserProfile, ChatMessage } from './types'
import { LoginScreen } from './components/LoginScreen'
import { DashboardHeader } from './components/DashboardHeader'
import { ChatWorkspace } from './components/ChatWorkspace'
import { HistoryPage } from './components/HistoryPage'
import './App.css'

// Fallback UUID v4 generator
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<'chat' | 'history'>('chat')
  const [jwt, setJwt] = useState<string | null>(null)

  // 1. Initial Load: Retrieve persistent sessions
  useEffect(() => {
    const savedUser = localStorage.getItem('cura_user')
    const savedJwt = localStorage.getItem('cura_jwt')

    if (savedUser) {
      if (!savedJwt) {
        // Clear orphaned session if JWT token is missing (e.g. from an older version of the app)
        localStorage.removeItem('cura_user')
        localStorage.removeItem('cura_current_conversation_id')
        setUser(null)
      } else {
        try {
          setUser(JSON.parse(savedUser))
          setJwt(savedJwt)
        } catch (e) {
          console.error('Failed to parse saved user credentials', e)
        }
      }
    }

    let savedConversationId = localStorage.getItem('cura_current_conversation_id')
    if (!savedConversationId) {
      savedConversationId = generateUUID()
      localStorage.setItem('cura_current_conversation_id', savedConversationId)
    }
    setCurrentConversationId(savedConversationId)
  }, [])

  // 2. Fetch conversation history when currentConversationId changes and user is logged in
  useEffect(() => {
    if (!user || !currentConversationId || !jwt) return

    const loadActiveConversation = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`http://localhost:3000/conversations/${currentConversationId}/`, {
          headers: {
            'Authorization': `Bearer ${jwt || ''}`,
          },
        })
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`)
        }
        const data = await response.json()
        
        // Map postgres rows to ChatMessage
        const mappedHistory: ChatMessage[] = data.map((item: any, index: number) => ({
          id: `msg-${index}-${Date.now()}`,
          prompt: item.input_text,
          response: item.output_text,
          timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
        setChatHistory(mappedHistory)
      } catch (err: any) {
        console.error('Failed to fetch conversation history:', err)
        setError(`Could not fetch messages for this session: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadActiveConversation()
  }, [currentConversationId, user, jwt])

  // Login flow events
  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      const decodedUser: UserProfile = jwtDecode(credentialResponse.credential!)
      console.log('Logged in successfully. User:', decodedUser)
      setUser(decodedUser)
      setJwt(credentialResponse.credential!)
      localStorage.setItem('cura_user', JSON.stringify(decodedUser))
      localStorage.setItem('cura_jwt', credentialResponse.credential!)
      setError(null)
    } catch (err) {
      console.error('Authentication decode error:', err)
      setError('Could not read user profile details from Google Login.')
    }
  }

  const handleLoginError = () => {
    console.error('Google Sign-In failed')
    setError('Google Sign-In failed. Please try again.')
  }

  const handleLogout = () => {
    setUser(null)
    setJwt(null)
    setChatHistory([])
    setCurrentConversationId(null)
    localStorage.removeItem('cura_user')
    localStorage.removeItem('cura_jwt')
    localStorage.removeItem('cura_current_conversation_id')
    setError(null)
    setCurrentPage('chat')
  }

  const handleStartNewConversation = () => {
    const newId = generateUUID()
    setCurrentConversationId(newId)
    localStorage.setItem('cura_current_conversation_id', newId)
    setChatHistory([])
    setCurrentPage('chat')
    setError(null)
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    localStorage.setItem('cura_current_conversation_id', conversationId)
    setCurrentPage('chat')
    setError(null)
  }

  // Database API prompt sender handler
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const queryText = input.trim()
    if (!queryText || loading || !currentConversationId) return

    setLoading(true)
    setError(null)
    setInput('') // Clear input immediately for better UX

    const tempId = Math.random().toString(36).substring(2, 9)
    const userMessage: ChatMessage = {
      id: tempId,
      prompt: queryText,
      response: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatHistory((prev) => [...prev, userMessage])

    try {
      const response = await fetch(`http://localhost:3000/conversations/${currentConversationId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt || ''}`,
        },
        body: JSON.stringify({ input: queryText }),
      })

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`)
      }

      const data = await response.json()
      
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, response: data.response || 'No response returned from server.' }
            : msg
        )
      )
    } catch (err: any) {
      console.error('API Error:', err)
      setError(`Failed to fetch response: ${err.message || 'Server connection timed out'}`)
      
      // Update entry with failure label and restore input text
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, response: `⚠️ Error: ${err.message || 'Server connection timed out'}` }
            : msg
        )
      )
      setInput(queryText)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      {!user ? (
        <LoginScreen
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          error={error}
          onClearError={() => setError(null)}
        />
      ) : (
        <main className="dashboard">
          <DashboardHeader 
            user={user} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onLogout={handleLogout} 
          />
          
          {currentPage === 'chat' ? (
            <ChatWorkspace
              user={user}
              chatHistory={chatHistory}
              input={input}
              setInput={setInput}
              loading={loading}
              error={error}
              setError={setError}
              onSendPrompt={handleSendPrompt}
              activeConversationId={currentConversationId}
              onStartNewConversation={handleStartNewConversation}
            />
          ) : (
            <HistoryPage
              onSelectConversation={handleSelectConversation}
              onStartNewConversation={handleStartNewConversation}
              activeConversationId={currentConversationId}
              jwt={jwt}
            />
          )}
        </main>
      )}
    </div>
  )
}

export default App