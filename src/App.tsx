import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { UserProfile, ChatMessage } from './types'
import { LoginScreen } from './components/LoginScreen'
import { DashboardHeader } from './components/DashboardHeader'
import { ChatWorkspace } from './components/ChatWorkspace'
import './App.css'

function App() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Initial Load: Retrieve persistent sessions
  useEffect(() => {
    const savedUser = localStorage.getItem('cura_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse saved user credentials', e)
      }
    }

    const savedHistory = localStorage.getItem('cura_chat_history')
    if (savedHistory) {
      try {
        setChatHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to parse saved chat history', e)
      }
    }
  }, [])

  // 2. Synchronize history to local storage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('cura_chat_history', JSON.stringify(chatHistory))
    }
  }, [chatHistory])

  // Login flow events
  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      const decodedUser: UserProfile = jwtDecode(credentialResponse.credential!)
      console.log('Logged in successfully. User:', decodedUser)
      setUser(decodedUser)
      localStorage.setItem('cura_user', JSON.stringify(decodedUser))
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
    setChatHistory([])
    localStorage.removeItem('cura_user')
    localStorage.removeItem('cura_chat_history')
    setError(null)
  }

  // Slicer API prompt sender handler
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const queryText = input.trim()
    if (!queryText || loading) return

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
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          <DashboardHeader user={user} onLogout={handleLogout} />
          
          <ChatWorkspace
            user={user}
            chatHistory={chatHistory}
            input={input}
            setInput={setInput}
            loading={loading}
            error={error}
            setError={setError}
            onSendPrompt={handleSendPrompt}
          />
        </main>
      )}

      <footer className="footer-text">
        Cura MCP Client Studio • Local Test Workspace
      </footer>
    </div>
  )
}

export default App