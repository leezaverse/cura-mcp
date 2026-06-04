import React from 'react'
import { GoogleLogin } from '@react-oauth/google'

interface LoginScreenProps {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
  error: string | null
  onClearError: () => void
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onError,
  error,
  onClearError,
}) => {
  return (
    <main className="landing-page">
      <div className="login-card">
        <div className="logo-container">
          <span className="logo-icon">🔮</span>
        </div>
        
        <h1 className="landing-title">Cura MCP</h1>
        <p className="landing-subtitle">
          AI-assisted clinical retrieval system that combines natural language interaction with schema-aware database querying.
        </p>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            useOneTap
          />
        </div>

        {error && (
          <div className="error-banner" style={{ margin: '0 0 20px 0', width: '100%' }}>
            <span>{error}</span>
            <span className="error-close" onClick={onClearError}>×</span>
          </div>
        )}
      </div>
    </main>
  )
}
