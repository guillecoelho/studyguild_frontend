import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { getIssueReport, type IssueReportListItem } from '../services/issueReportsApi'

type IssueStatusEntryPageProps = {
    onBackToIssuesStatus: () => void
}

function IssueStatusEntryPage({ onBackToIssuesStatus }: IssueStatusEntryPageProps) {
    const { t, i18n } = useTranslation()
    const { id } = useParams()
    const [issue, setIssue] = useState<IssueReportListItem | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [pageError, setPageError] = useState('')

    useEffect(() => {
        const parsedId = Number(id)

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            setPageError(t('errors.loadIssueReports'))
            setIssue(null)
            return
        }

        async function loadIssue() {
            setIsLoading(true)
            setPageError('')

            try {
                setIssue(await getIssueReport(parsedId))
            } catch (error) {
                setPageError(error instanceof Error ? error.message : t('errors.loadIssueReports'))
                setIssue(null)
            } finally {
                setIsLoading(false)
            }
        }

        void loadIssue()
    }, [id, t])

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(i18n.resolvedLanguage?.startsWith('es') ? 'es-ES' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        [i18n.resolvedLanguage],
    )

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('issueStatusPage.detailEyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('issueStatusPage.title')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToIssuesStatus}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('issueStatusPage.backToList')}
                    </button>
                </header>

                {pageError && (
                    <div className="pixel-error mb-4 px-3 py-2 text-sm text-red-100">{pageError}</div>
                )}

                {isLoading ? (
                    <div className="grid gap-4">
                        <div className="skeleton-line h-8" />
                        <div className="skeleton-line h-40" />
                    </div>
                ) : issue ? (
                    <article className="newsletter-card p-4 sm:p-5">
                        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="fantasy-title text-2xl leading-tight text-amber-100">{issue.title}</h3>
                            <span className={`pixel-tag px-2 py-1 text-xs uppercase ${issue.status === 'resolved' ? 'is-public' : 'is-private'}`}>
                                {issue.status === 'open'
                                    ? t('issueStatusPage.status.open')
                                    : issue.status === 'in_progress'
                                        ? t('issueStatusPage.status.inProgress')
                                        : t('issueStatusPage.status.resolved')}
                            </span>
                        </header>

                        <p className="mt-3 whitespace-pre-wrap text-[1.04rem] leading-relaxed text-amber-50/88">
                            {issue.description}
                        </p>

                        <footer className="mt-4 text-xs uppercase tracking-[0.16em] text-amber-200/65">
                            {t('issueStatusPage.meta', {
                                reporter: issue.reporter_name,
                                date: dateFormatter.format(new Date(issue.created_at)),
                                images: issue.image_count,
                            })}
                        </footer>
                    </article>
                ) : null}
            </div>
        </section>
    )
}

export default IssueStatusEntryPage
