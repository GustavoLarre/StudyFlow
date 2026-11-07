import { useEffect, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { tasksApi, MAX_TASK_TEXT, type Task, type TasksApi } from '../services/tasksApi'
import styles from './TasksPage.module.css'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

const formatDate = (iso: string) => iso.split('-').reverse().join('/')

const today = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const byDate = (a: Task, b: Task) => a.date.localeCompare(b.date)

export function TasksPage({ tasks: api = tasksApi }: { tasks?: TasksApi }) {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [text, setText] = useState('')
  const [date, setDate] = useState(today)
  const [textError, setTextError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editDate, setEditDate] = useState('')
  const [toDelete, setToDelete] = useState<Task | null>(null)

  useEffect(() => {
    api.list()
      .then(setItems)
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api])

  const replace = (updated: Task) =>
    setItems((prev) => prev.map((t) => (t.taskId === updated.taskId ? updated : t)))

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setAlert('')
    const trimmed = text.trim()
    if (!trimmed) return setTextError('Informe o texto da tarefa.')
    if (trimmed.length > MAX_TASK_TEXT) return setTextError(`A tarefa pode ter no máximo ${MAX_TASK_TEXT} caracteres.`)
    setTextError('')
    try {
      const created = await api.create({ date, text: trimmed })
      setItems((prev) => [...prev, created])
      setText('')
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleToggle(task: Task) {
    setAlert('')
    try {
      replace(await api.setCompleted(task.taskId, !task.completed))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleSaveEdit(id: string) {
    setAlert('')
    try {
      replace(await api.update(id, { text: editText.trim(), date: editDate }))
      setEditingId(null)
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    const { taskId } = toDelete
    setToDelete(null)
    try {
      await api.remove(taskId)
      setItems((prev) => prev.filter((t) => t.taskId !== taskId))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  function renderItem(t: Task) {
    if (editingId === t.taskId) {
      return (
        <li key={t.taskId} className={styles.item}>
          <label htmlFor={`et-${t.taskId}`} className={styles.srOnly}>Texto da tarefa</label>
          <input id={`et-${t.taskId}`} className={styles.input} value={editText}
            onChange={(e) => setEditText(e.target.value)} />
          <label htmlFor={`ed-${t.taskId}`} className={styles.srOnly}>Data da tarefa</label>
          <input id={`ed-${t.taskId}`} type="date" className={styles.input} value={editDate}
            onChange={(e) => setEditDate(e.target.value)} />
          <button type="button" className={styles.primary} onClick={() => void handleSaveEdit(t.taskId)}>Salvar</button>
          <button type="button" className={styles.ghost} onClick={() => setEditingId(null)}>Cancelar</button>
        </li>
      )
    }
    return (
      <li key={t.taskId} className={styles.item}>
        <input type="checkbox" checked={t.completed}
          aria-label={`${t.completed ? 'Reabrir' : 'Concluir'} ${t.text}`}
          onChange={() => void handleToggle(t)} />
        <span className={t.completed ? styles.doneText : styles.text}>{t.text}</span>
        <span className={styles.date}>{formatDate(t.date)}</span>
        <button type="button" className={styles.ghost} aria-label={`Editar ${t.text}`}
          onClick={() => { setEditingId(t.taskId); setEditText(t.text); setEditDate(t.date) }}>Editar</button>
        <button type="button" className={styles.ghostDanger} aria-label={`Excluir ${t.text}`}
          onClick={() => setToDelete(t)}>Excluir</button>
      </li>
    )
  }

  const pending = items.filter((t) => !t.completed).sort(byDate)
  const done = items.filter((t) => t.completed).sort(byDate)

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Tarefas</h1>

      <form className={styles.form} onSubmit={(e) => void handleCreate(e)} noValidate>
        <label htmlFor="task-text" className={styles.srOnly}>Nova tarefa</label>
        <input id="task-text" className={styles.input} placeholder="Nova tarefa" value={text}
          onChange={(e) => setText(e.target.value)} />
        <label htmlFor="task-date" className={styles.srOnly}>Data</label>
        <input id="task-date" type="date" className={styles.input} value={date}
          onChange={(e) => setDate(e.target.value)} />
        <button type="submit" className={styles.primary}>Adicionar</button>
      </form>
      {textError && <p className={styles.fieldError}>{textError}</p>}
      {alert && <p className={styles.alert} role="alert">{alert}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <section aria-labelledby="pending-title">
            <h2 id="pending-title" className={styles.sub}>Pendentes</h2>
            {pending.length === 0
              ? <p className={styles.empty}>Nenhuma tarefa pendente.</p>
              : <ul className={styles.list}>{pending.map(renderItem)}</ul>}
          </section>
          <section aria-labelledby="done-title">
            <h2 id="done-title" className={styles.sub}>Concluídas</h2>
            {done.length === 0
              ? <p className={styles.empty}>Nenhuma tarefa concluída.</p>
              : <ul className={styles.list}>{done.map(renderItem)}</ul>}
          </section>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Excluir a tarefa "${toDelete.text}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  )
}