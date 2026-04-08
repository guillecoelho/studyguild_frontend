import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getNewsletterEntries } from '../services/newsletterApi'
import type { NewsletterEntry } from '../types/newsletter'

type NewsletterPageProps = {
    onBackToHomepage: () => void
}

function NewsletterPage({ onBackToHomepage }: NewsletterPageProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [entries, setEntries] = useState<NewsletterEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [pageError, setPageError] = useState('')

    useEffect(() => {
        async function loadEntries() {
            setIsLoading(true)
            setPageError('')

            try {
                setEntries(await getNewsletterEntries())
            } catch (error) {
                setPageError(error instanceof Error ? error.message : t('errors.loadNewsletterEntries'))
            } finally {
                setIsLoading(false)
            }
        }

        void loadEntries()
    }, [t])

    const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage?.startsWith('es') ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('newsletter.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('newsletter.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('newsletter.description')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToHomepage}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('common.actions.backToHomepage')}
                    </button>
                </header>

                {pageError && (
                    <div className="pixel-error mb-4 px-3 py-2 text-sm text-red-100">
                        {pageError}
                    </div>
                )}

                {isLoading ? (
                    <div className="grid gap-4">
                        <div className="skeleton-line h-24" />
                        <div className="skeleton-line h-24" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="pixel-card p-4 text-sm text-amber-100/80">
                        {t('newsletter.empty')}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {entries.map((entry) => (
                            <article
                                key={entry.id}
                                className="newsletter-card p-4 sm:p-5"
                                role="button"
                                tabIndex={0}
                                onClick={() => navigate(`/newsletter/${entry.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        navigate(`/newsletter/${entry.id}`)
                                    }
                                }}
                            >
                                <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="fantasy-title text-xl leading-tight text-amber-100">
                                        {entry.title}
                                    </h3>
                                    <span className={`pixel-tag px-2 py-1 text-xs uppercase ${entry.entry_type === 'article' ? 'is-public' : 'is-private'}`}>
                                        {entry.entry_type === 'article'
                                            ? t('newsletter.types.article')
                                            : t('newsletter.types.news')}
                                    </span>
                                </header>

                                {entry.summary && (
                                    <p className="text-[0.95rem] text-amber-100/80">{entry.summary}</p>
                                )}

                                {!entry.summary && (
                                    <p className="text-[0.95rem] text-amber-100/80">
                                        {entry.content.slice(0, 140)}...
                                    </p>
                                )}

                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            navigate(`/newsletter/${entry.id}`)
                                        }}
                                    >
                                        {t('newsletter.readMore')}
                                    </button>
                                </div>

                                <footer className="mt-3 text-xs uppercase tracking-[0.16em] text-amber-200/65">
                                    {t('newsletter.byline', {
                                        author: entry.author_name,
                                        date: dateFormatter.format(new Date(entry.published_at)),
                                    })}
                                </footer>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default NewsletterPage
