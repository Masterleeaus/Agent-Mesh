import { Link } from 'react-router-dom'

export function ButtonPrimary({ children, to, href, onClick, size = 'md', className = '' }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold text-white bg-nx-purple hover:bg-nx-purple-dark rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30'
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-3 rounded-xl',
  }

  // External link (to Rails app, etc.)
  if (href) {
    return (
      <a href={href} className={`${base} ${sizes[size]} ${className}`}>
        {children}
      </a>
    )
  }
  // Internal React Router link
  if (to) {
    return (
      <Link to={to} className={`${base} ${sizes[size]} ${className}`}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}

export function ButtonOutline({ children, to, href, onClick, size = 'md', className = '' }) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold text-nx-text2 border border-nx-border2 hover:border-nx-purple hover:text-nx-text hover:bg-nx-purple-glow rounded-lg transition-all hover:-translate-y-0.5'
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-3 rounded-xl',
  }

  if (href) {
    return (
      <a href={href} className={`${base} ${sizes[size]} ${className}`}>
        {children}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} className={`${base} ${sizes[size]} ${className}`}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}
