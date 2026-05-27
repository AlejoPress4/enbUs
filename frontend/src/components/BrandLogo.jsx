import { useState } from 'react'

export default function BrandLogo({ className = 'h-14' }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <h1 className="text-4xl font-extrabold text-brand-blue tracking-tight">
        en<span className="text-brand-orange">Bus</span>
      </h1>
    )
  }

  return (
    <img
      src="/logo.jpg"
      alt="enbUs"
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  )
}
