import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ChooseUsernamePage } from './pages/ChooseUsernamePage'
import { SubjectsPage } from './pages/SubjectsPage'
import { SubjectDetailPage } from './pages/SubjectDetailPage'
import { NoteEditorPage } from './pages/NoteEditorPage'
import { ReviewPage } from './pages/ReviewPage'
import { ProgressPage } from './pages/ProgressPage'
import { TasksPage } from './pages/TasksPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfileProvider } from './profile/ProfileContext'
import { UsernameGate, NeedsUsernameRoute } from './profile/guards'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/cadastro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/recuperar-senha" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

      <Route element={<ProtectedRoute><ProfileProvider><Outlet /></ProfileProvider></ProtectedRoute>}>
        <Route
          path="/escolher-username"
          element={<NeedsUsernameRoute><ChooseUsernamePage /></NeedsUsernameRoute>}
        />

        <Route element={<UsernameGate><AppLayout /></UsernameGate>}>
          <Route path="/materias" element={<SubjectsPage />} />
          <Route path="/materias/:id" element={<SubjectDetailPage />} />
          <Route path="/materias/:id/notas/nova" element={<NoteEditorPage />} />
          <Route path="/materias/:id/notas/:noteId" element={<NoteEditorPage />} />
          <Route path="/revisao" element={<ReviewPage />} />
          <Route path="/progresso" element={<ProgressPage />} />
          <Route path="/tarefas" element={<TasksPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/materias" replace />} />
    </Routes>
  )
}