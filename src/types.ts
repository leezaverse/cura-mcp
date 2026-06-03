export interface UserProfile {
  name: string
  email: string
  picture: string
  sub: string
}

export interface ChatMessage {
  id: string
  prompt: string
  response: string
  timestamp: string
}
