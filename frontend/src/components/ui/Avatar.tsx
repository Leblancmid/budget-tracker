import { useState } from 'react'
import { avatarGradient, initials } from '@/lib/users'

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-24 w-24 text-3xl sm:h-28 sm:w-28',
}

/** A user's profile picture, or their initials on a colour that's always the same for them. */
export function Avatar({ user, size = 'md', className = '' }: {
  user: { id: number; name: string; avatar_url?: string | null }
  size?: keyof typeof SIZES
  className?: string
}) {
  // A picture that fails to load (deleted, offline) falls back to the initials
  const [broken, setBroken] = useState<string | null>(null)
  const src = user.avatar_url && user.avatar_url !== broken ? user.avatar_url : null

  return (
    <span className={['relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white', SIZES[size], src ? 'bg-gray-200 dark:bg-gray-700' : `bg-gradient-to-br ${avatarGradient(user.id)}`, className].join(' ')}>
      {src
        ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(src)} />
        : <span aria-hidden="true">{initials(user.name)}</span>}
    </span>
  )
}
