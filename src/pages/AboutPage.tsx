import { useTranslation } from 'react-i18next'

type AboutPageProps = {
    onBackToHomepage: () => void
}

function AboutPage({ onBackToHomepage }: AboutPageProps) {
    const { t } = useTranslation()

    const pillars = [
        {
            title: t('aboutPage.pillars.communityTitle'),
            description: t('aboutPage.pillars.communityDescription'),
        },
        {
            title: t('aboutPage.pillars.flexibleTitle'),
            description: t('aboutPage.pillars.flexibleDescription'),
        },
        {
            title: t('aboutPage.pillars.trustTitle'),
            description: t('aboutPage.pillars.trustDescription'),
        },
    ]

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('aboutPage.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            {t('aboutPage.title')}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-amber-100/80 sm:text-base">
                            {t('aboutPage.description')}
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

                <div className="grid gap-4 sm:grid-cols-3">
                    {pillars.map((pillar) => (
                        <article key={pillar.title} className="pixel-card p-4 sm:p-5">
                            <h3 className="fantasy-title text-lg leading-tight text-amber-100">
                                {pillar.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-amber-100/75">
                                {pillar.description}
                            </p>
                        </article>
                    ))}
                </div>

                <section className="mt-6 rounded-2xl border border-amber-200/20 bg-slate-900/35 p-5 sm:p-6">
                    <h3 className="fantasy-title text-xl text-amber-100">
                        {t('aboutPage.missionTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-amber-100/80 sm:text-base">
                        {t('aboutPage.missionBody')}
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-amber-200/20 bg-slate-900/35 p-5 sm:p-6">
                    <h3 className="fantasy-title text-xl text-amber-100">
                        {t('aboutPage.storyTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-amber-100/80 sm:text-base">
                        {t('aboutPage.story')}
                    </p>
                </section>
            </div>
        </section>
    )
}

export default AboutPage