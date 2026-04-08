import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getIssueReports, type IssueReportListItem } from '../services/issueReportsApi'

type IssueStatusPageProps = {
    onBackToHomepage: () => void
}

type StatusFilter = 'open' | 'in_progress' | 'resolved' | 'all'

function IssueStatusPage({ onBackToHomepage }: IssueStatusPageProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
    const [issues, setIssues] = useState<IssueReportListItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [pageError, setPageError] = useState('')

    useEffect(() => {
        async function loadIssues() {
            setIsLoading(true)
            setPageError('')

            try {
                const response = await getIssueReports({
                    status: statusFilter,
                    q: appliedSearch,
                    page: currentPage,
                    perPage: 8,
                })

                setIssues(response.items)
                setTotalPages(response.pagination.total_pages > 0 ? response.pagination.total_pages : 1)
                setTotalCount(response.pagination.total_count)
            } catch (error) {
                setPageError(error instanceof Error ? error.message : t('errors.loadIssueReports'))
            } finally {
                setIsLoading(false)
            }
        }

        void loadIssues()
    }, [statusFilter, appliedSearch, currentPage, t])

    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, appliedSearch])

    function truncateDescription(description: string) {
        const maxLength = 180
        if (description.length <= maxLength) {
            return description
        }

        return `${description.slice(0, maxLength).trimEnd()}...`
    }

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
                <header className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('issueStatusPage.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            {t('issueStatusPage.title')}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-amber-100/80 sm:text-base">
                            {t('issueStatusPage.description')}
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

                <label className="field-label mb-4 max-w-xs text-xs">
                    {t('issueStatusPage.filterLabel')}
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                        className="field-input"
                    >
                        <option value="open">{t('issueStatusPage.filters.open')}</option>
                        <option value="in_progress">{t('issueStatusPage.filters.inProgress')}</option>
                        <option value="resolved">{t('issueStatusPage.filters.resolved')}</option>
                        <option value="all">{t('issueStatusPage.filters.all')}</option>
                    </select>
                </label>

                <form
                    className="mb-4 flex flex-wrap items-end gap-2"
                    onSubmit={(event) => {
                        event.preventDefault()
                        setAppliedSearch(searchQuery)
                    }}
                >
                    <label className="field-label m-0 flex-1 text-xs">
                        {t('issueStatusPage.searchLabel')}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={t('issueStatusPage.searchPlaceholder')}
                            className="field-input"
                        />
                    </label>
                    <button
                        type="submit"
                        className="pixel-button inline-flex h-11 items-center justify-center px-4 text-sm font-semibold"
                    >
                        {t('issueStatusPage.searchAction')}
                    </button>
                </form>

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
                ) : issues.length === 0 ? (
                    <div className="pixel-card p-4 text-sm text-amber-100/80">
                        {t('issueStatusPage.empty')}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {issues.map((issue) => (
                            <article key={issue.id} className="newsletter-card p-4 sm:p-5">
                                <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="fantasy-title text-xl leading-tight text-amber-100">
                                        {issue.title}
                                    </h3>
                                    <span className={`pixel-tag px-2 py-1 text-xs uppercase ${issue.status === 'resolved' ? 'is-public' : 'is-private'}`}>
                                        {issue.status === 'open'
                                            ? t('issueStatusPage.status.open')
                                            : issue.status === 'in_progress'
                                                ? t('issueStatusPage.status.inProgress')
                                                : t('issueStatusPage.status.resolved')}
                                    </span>
                                </header>

                                <p className="text-sm text-amber-100/80">{truncateDescription(issue.description)}</p>

                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                        onClick={() => navigate(`/issues/status/${issue.id}`)}
                                    >
                                        {t('issueStatusPage.detailsAction')}
                                    </button>
                                </div>

                                <footer className="mt-3 text-xs uppercase tracking-[0.12em] text-amber-200/65">
                                    {t('issueStatusPage.meta', {
                                        reporter: issue.reporter_name,
                                        date: dateFormatter.format(new Date(issue.created_at)),
                                        images: issue.image_count,
                                    })}
                                </footer>
                            </article>
                        ))}
                    </div>
                )}

                {!isLoading && totalCount > 0 && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-amber-200/70">
                            {t('issueStatusPage.paginationSummary', {
                                page: currentPage,
                                totalPages,
                                totalCount,
                            })}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage <= 1}
                            >
                                {t('issueStatusPage.prevAction')}
                            </button>
                            <button
                                type="button"
                                className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage >= totalPages}
                            >
                                {t('issueStatusPage.nextAction')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default IssueStatusPage
