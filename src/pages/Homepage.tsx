import ReunionsList from '../components/ReunionsList'
import { useTranslation } from 'react-i18next'
import { useEffect, useMemo, useState } from 'react'
import type { Reunion, Subject } from '../types/reunions'

const REUNIONS_PER_PAGE = 6

type HomepageProps = {
    reunions: Reunion[]
    subjects: Subject[]
    isLoading: boolean
    pageError: string
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    flashMessage: string
    onDismissFlashMessage: () => void
    onNavigateToNewReunion: () => void
    onNavigateToStudentGroups: () => void
    onNavigateToReunionDetails: (reunionId: number) => void
}

function Homepage({
    reunions,
    subjects,
    isLoading,
    pageError,
    searchQuery,
    onSearchQueryChange,
    flashMessage,
    onDismissFlashMessage,
    onNavigateToNewReunion,
    onNavigateToStudentGroups,
    onNavigateToReunionDetails,
}: HomepageProps) {
    const { t } = useTranslation()
    const [isStatsOpenOnSmallScreen, setIsStatsOpenOnSmallScreen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.max(1, Math.ceil(reunions.length / REUNIONS_PER_PAGE))
    const paginatedReunions = useMemo(() => {
        const startIndex = (currentPage - 1) * REUNIONS_PER_PAGE
        return reunions.slice(startIndex, startIndex + REUNIONS_PER_PAGE)
    }, [currentPage, reunions])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    useEffect(() => {
        setCurrentPage((current) => Math.min(current, totalPages))
    }, [totalPages])

    const canGoToPreviousPage = currentPage > 1
    const canGoToNextPage = currentPage < totalPages
    const stats = [
        {
            value: reunions.length,
            label: t('homepage.stats.availableReunions'),
        },
        {
            value: reunions.filter((reunion) => reunion.visibility === 'public').length,
            label: t('homepage.stats.publicReunions'),
        },
        {
            value: subjects.length,
            label: t('homepage.stats.subjectsAvailable'),
        },
    ]

    return (
        <section className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr,1fr]">
            <div className="glass-panel animate-enter-up p-8 sm:p-10">
                <h1 className="fantasy-title text-4xl font-semibold tracking-tight sm:text-5xl">
                    {t('homepage.heroTitle')}
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-amber-100/85 sm:text-base">
                    {t('homepage.heroDescription')}
                </p>

                <div className="mt-10 sm:hidden">
                    <button
                        type="button"
                        aria-expanded={isStatsOpenOnSmallScreen}
                        aria-controls="homepage-stats-mobile"
                        onClick={() => setIsStatsOpenOnSmallScreen((current) => !current)}
                        className="stats-toggle inline-flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                    >
                        <span>{t('homepage.stats.title')}</span>
                        <span className="text-xs uppercase tracking-[0.18em] text-amber-200/75">
                            {isStatsOpenOnSmallScreen
                                ? t('homepage.stats.hide')
                                : t('homepage.stats.show')}
                        </span>
                    </button>

                    {isStatsOpenOnSmallScreen && (
                        <div id="homepage-stats-mobile" className="mt-4 grid grid-cols-1 gap-4">
                            {stats.map((stat) => (
                                <article
                                    key={stat.label}
                                    className="pixel-card p-4"
                                >
                                    <p className="text-2xl font-semibold text-amber-100">{stat.value}</p>
                                    <p className="mt-1 text-sm text-amber-100/75">{stat.label}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-10 hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-3">
                    {stats.map((stat) => (
                        <article
                            key={stat.label}
                            className="pixel-card p-4"
                        >
                            <p className="text-2xl font-semibold text-amber-100">{stat.value}</p>
                            <p className="mt-1 text-sm text-amber-100/75">{stat.label}</p>
                        </article>
                    ))}
                </div>
            </div>

            <div className="glass-panel animate-enter-up animation-delay-2 p-7 sm:p-8">
                <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="fantasy-title text-2xl font-semibold tracking-tight">
                            {t('homepage.list.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('homepage.list.subtitle')}
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap">
                        <button
                            type="button"
                            onClick={onNavigateToStudentGroups}
                            className="pixel-button inline-flex w-full items-center justify-center px-4 py-2 text-sm font-semibold sm:w-auto"
                        >
                            {t('common.actions.studentGroups')}
                        </button>
                        <button
                            type="button"
                            onClick={onNavigateToNewReunion}
                            className="pixel-button inline-flex w-full items-center justify-center px-4 py-2 text-sm font-semibold sm:w-auto"
                        >
                            {t('common.actions.createReunion')}
                        </button>
                    </div>
                </header>

                <label className="field-label mb-4">
                    <span>{t('homepage.list.searchLabel')}</span>
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder={t('homepage.list.searchPlaceholder')}
                        className="field-input"
                    />
                </label>

                {flashMessage && (
                    <div className="pixel-alert mb-3 flex items-center justify-between gap-2 px-3 py-2 text-sm text-emerald-100">
                        <span>{flashMessage}</span>
                        <button
                            type="button"
                            className="pixel-button px-2 py-1 font-semibold text-xs"
                            onClick={onDismissFlashMessage}
                        >
                            {t('common.actions.dismiss')}
                        </button>
                    </div>
                )}

                <ReunionsList
                    reunions={paginatedReunions}
                    isLoading={isLoading}
                    pageError={pageError}
                    onViewDetails={onNavigateToReunionDetails}
                />

                {!isLoading && reunions.length > REUNIONS_PER_PAGE && (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-amber-100/75">
                            {t('homepage.list.pagination.pageIndicator', {
                                current: currentPage,
                                total: totalPages,
                            })}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                                disabled={!canGoToPreviousPage}
                                className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('homepage.list.pagination.previous')}
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((current) => Math.min(totalPages, current + 1))
                                }
                                disabled={!canGoToNextPage}
                                className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('homepage.list.pagination.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

export default Homepage