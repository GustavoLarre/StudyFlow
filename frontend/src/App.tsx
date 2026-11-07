import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/materias" element={<ProtectedRoute><h1>Matérias</h1></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/materias" replace />} />
      <Route path="/cadastro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/recuperar-senha" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
    </Routes>
  )
}