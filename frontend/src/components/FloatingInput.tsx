import { useState, type InputHTMLAttributes } from 'react'
import eyeOpen from '../assets/eye-open.png'
import eyeClosed from '../assets/eye-closed.png'
import styles from './FloatingInput.module.css'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}

export function FloatingInput({ id, label, value, onChange, error, type = 'text', ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={styles.field}>
      <div className={styles.box}>
        <input
          id={id}
          className={styles.input}
          type={isPassword && visible ? 'text' : type}
          placeholder=" "
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        <label htmlFor={id} className={styles.label}>{label}</label>
        {isPassword && (
          <button type="button" className={styles.eye}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setVisible((v) => !v)}>
            <img src={visible ? eyeOpen : eyeClosed} alt="" />
          </button>
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}