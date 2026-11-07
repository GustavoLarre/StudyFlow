import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectDetailPage } from './pages/SubjectDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/cadastro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/recuperar-senha" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/materias" element={<SubjectsPage />} />
        <Route path="/materias/:id" element={<h1>Detalhe da matéria</h1>} />
        <Route path="/revisao" element={<h1>Revisão</h1>} />
        <Route path="/progresso" element={<h1>Progresso</h1>} />
        <Route path="/tarefas" element={<h1>Tarefas</h1>} />
        <Route path="/materias/:id" element={<SubjectDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/materias" replace />} />
    </Routes>
  )
}