import type { ButtonHTMLAttributes } from 'react'
import { buttonClass, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
