import { formatDateLabel } from '../services/reunionsApi'
import { useTranslation } from 'react-i18next'
import type { Reunion } from '../types/reunions'

type ReunionsListProps = {
    reunions: Reunion[]
    isLoading: boolean
    pageError: string
    onViewDetails: (reunionId: number) => void
}

function ReunionsList({ reunions, isLoading, pageError, onViewDetails }: ReunionsListProps) {
    const { i18n, t } = useTranslation()

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="skeleton-line h-11" />
                <div className="skeleton-line h-11" />
                <div className="skeleton-line h-24" />
                <div className="skeleton-line h-11" />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {pageError && (
                <p className="pixel-error px-3 py-2 text-sm text-rose-100">
                    {pageError}
                </p>
            )}

            {reunions.length === 0 ? (
                <div className="pixel-card p-4 text-sm text-amber-100/75">
                    {t('homepage.list.empty')}
                </div>
            ) : (
                reunions.map((reunion) => (
                    <article
                        key={reunion.id}
                        className="pixel-card p-4"
                    >
                        <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold text-amber-50">{reunion.title}</h3>
                            <span
                                className={`pixel-tag px-2.5 py-1 text-xs font-semibold ${reunion.visibility === 'private' ? 'is-private' : 'is-public'}`}
                            >
                                {t(`common.visibility.${reunion.visibility}`)}
                            </span>
                        </div>
                        <p className="text-sm text-amber-100/80">
                            {reunion.subject_name ?? t('reunions.subjectUnavailable')}
                        </p>
                        <p className="mt-1 text-sm text-amber-100/80">
                            {formatDateLabel(reunion.scheduled_for, i18n.language)}
                        </p>
                        {reunion.student_group_name && (
                            <p className="mt-1 text-xs text-amber-200/80">
                                {t('reunions.groupLabel')}: {reunion.student_group_name}
                            </p>
                        )}

                        <div className="mt-3">
                            <button
                                type="button"
                                className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                onClick={() => onViewDetails(reunion.id)}
                            >
                                {t('reunions.detailsAction')}
                            </button>
                        </div>
                    </article>
                ))
            )}
        </div>
    )
}

export default ReunionsList