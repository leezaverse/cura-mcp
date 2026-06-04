import React from 'react'
import type { UserProfile } from '../types'

interface DashboardHeaderProps {
  user: UserProfile
  currentPage: 'chat' | 'history'
  setCurrentPage: (page: 'chat' | 'history') => void
  onLogout: () => void
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  user, 
  currentPage, 
  setCurrentPage, 
  onLogout 
}) => {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="app-logo">
          <span>🔮</span> Cura MCP
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          API Connected
        </div>
      </div>

      <nav className="header-nav">
        <button 
          className={`nav-item ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentPage('chat')}
        >
          <span>💬</span> Chat Workspace
        </button>
        <button 
          className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentPage('history')}
        >
          <span>📂</span> History Page
        </button>
      </nav>
      
      <div className="header-right">
        <div className="user-profile">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="user-avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              👤
            </div>
          )}
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Log out
        </button>
      </div>
    </header>
  )
}
