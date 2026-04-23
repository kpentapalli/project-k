import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import RequestAccess from './pages/RequestAccess'
import Intake from './pages/Intake'
import Dashboard from './pages/Dashboard'
import Program from './pages/Program'
import Admin from './pages/Admin'
import About from './pages/About'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/request-access" element={<RequestAccess />} />

          <Route path="/intake" element={
            <ProtectedRoute><Intake /></ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/program" element={
            <ProtectedRoute><Program /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
          } />

          <Route path="/about" element={
            <ProtectedRoute><About /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
