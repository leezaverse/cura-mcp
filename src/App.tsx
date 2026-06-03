import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

function App() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <h1>CuraMCP</h1>

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const user: any = jwtDecode(
            credentialResponse.credential!
          )

          console.log('User Details:', user)

          alert(`Welcome ${user.name}`)
        }}
        onError={() => {
          console.log('Login Failed')
        }}
      />
    </div>
  )
}

export default App