import { useState } from 'react'

interface ArticleImageProps {
  src: string
  className?: string
}

/** Decorative (the headline carries the meaning); disappears if the image fails to load. */
export function ArticleImage({ src, className = '' }: ArticleImageProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <div className={`overflow-hidden bg-paper-deep ${className}`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="card-image h-full w-full object-cover"
      />
    </div>
  )
}
