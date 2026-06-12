import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Home from './pages/Home'
import CreateTicket from './pages/CreateTicket'
import TicketDetail from './pages/TicketDetail'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import VerifyOtp from './pages/VerifyOtp'

import MainLayout from './layouts/MainLayout'
import { DarkModeProvider } from './context/DarkModeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import FullPageSpinner from './components/FullPageSpinner'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullPageSpinner label="Restoring session" />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <FullPageSpinner label="Restoring session" />
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: '12px',
                background: 'rgb(19 19 26 / 0.95)',
                color: '#ffffff',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 40px -8px rgba(0,0,0,0.4)'
              },
              success: { iconTheme: { primary: '#8b5cf6', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
            }}
          />
          <MainLayout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
              <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />
              <Route path="/tickets/new" element={<CreateTicket />} />
              <Route path="/dashboard" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/tickets/:ticketId" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </AuthProvider>
      </BrowserRouter>
    </DarkModeProvider>
  )
}
