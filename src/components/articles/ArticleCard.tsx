import type { Article } from '@/services/news'
import { formatLongDate, formatRelative } from '@/utils/date'
import { ArticleImage } from './ArticleImage'
import { Byline } from './Byline'

export type CardSize = 'lead' | 'secondary' | 'standard'

const STYLES: Record<CardSize, { image: string; title: string; description: string }> = {
  lead: {
    image: 'aspect-[16/9]',
    title: 'text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08]',
    description:
      'text-lg leading-relaxed first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-headline first-letter:text-6xl first-letter:leading-[0.8] first-letter:font-bold',
  },
  secondary: {
    image: 'aspect-[2/1]',
    title: 'text-xl font-bold leading-snug',
    description: 'line-clamp-3',
  },
  standard: {
    image: 'aspect-[3/2]',
    title: 'text-lg font-semibold leading-snug',
    description: 'line-clamp-3 text-[0.95rem]',
  },
}

interface ArticleCardProps {
  article: Article
  size?: CardSize
}

export function ArticleCard({ article, size = 'standard' }: ArticleCardProps) {
  const styles = STYLES[size]

  return (
    <article className="group relative flex h-full flex-col">
      {article.imageUrl && <ArticleImage src={article.imageUrl} className={`mb-3 ${styles.image}`} />}

      <p className="kicker text-accent">
        {article.section && <>{article.section} · </>}
        <span className="text-ink-faint">{article.publisher}</span>
      </p>

      <h3 className={`mt-1.5 font-headline text-balance ${styles.title}`}>
        {/* Stretched link: the whole card is clickable without nesting the byline buttons in it. */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline"
        >
          {article.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </h3>

      {article.description && (
        <p className={`mt-2 text-ink-soft ${styles.description}`}>{article.description}</p>
      )}

      <footer className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-3 text-sm">
        <Byline authors={article.authors} />
        <time
          dateTime={article.publishedAt}
          title={formatLongDate(article.publishedAt)}
          className="text-ink-faint italic"
        >
          {formatRelative(article.publishedAt)}
        </time>
      </footer>
    </article>
  )
}
