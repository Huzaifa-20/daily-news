import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="This page has gone to press without us"
      action={
        <Link to="/" className={buttonClass()}>
          Back to the front page
        </Link>
      }
    >
      We couldn’t find the page you were looking for.
    </EmptyState>
  )
}
