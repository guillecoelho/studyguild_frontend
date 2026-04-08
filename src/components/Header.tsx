import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type HeaderProps = {
    isAuthenticated: boolean
    isAuthSubmitting: boolean
    onNavigateHome: () => void
    onNavigateProfile: () => void
    onNavigateAuth: () => void
    onLogout: () => void
}

function Header({
    isAuthenticated,
    isAuthSubmitting,
    onNavigateHome,
    onNavigateProfile,
    onNavigateAuth,
    onLogout,
}: HeaderProps) {
    const { i18n, t } = useTranslation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    function closeMobileMenu() {
        setIsMobileMenuOpen(false)
    }

    return (
        <header className="relative mx-auto mb-5 w-full max-w-6xl">
            <div className="glass-panel flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <button
                    type="button"
                    onClick={onNavigateHome}
                    className="inline-flex w-fit items-center gap-3 text-left"
                    aria-label={t('homepage.brand')}
                >
                    <img
                        src="/logo.svg"
                        alt={`${t('homepage.brand')} logo`}
                        className="h-14 w-14"
                        loading="eager"
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90 sm:text-sm">
                        {t('homepage.brand')}
                    </span>
                </button>

                <button
                    type="button"
                    className="pixel-button inline-flex items-center justify-center px-3 py-2 text-sm font-semibold sm:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label={t('common.actions.menu')}
                >
                    {t('common.actions.menu')}
                </button>

                <div className="hidden items-center gap-3 sm:flex sm:justify-end">
                    <div className="inline-flex flex-wrap items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onNavigateProfile}
                                    className="pixel-button inline-flex items-center justify-center px-3 py-2 text-sm font-semibold"
                                >
                                    {t('auth.accountAction')}
                                </button>
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="pixel-button inline-flex items-center justify-center px-3 py-2 text-sm font-semibold"
                                    disabled={isAuthSubmitting}
                                >
                                    {isAuthSubmitting ? t('auth.logoutLoading') : t('auth.logoutAction')}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onNavigateAuth}
                                className="pixel-button inline-flex items-center justify-center px-3 py-2 text-sm font-semibold"
                            >
                                {t('auth.registerLoginAction')}
                            </button>
                        )}
                    </div>

                    <div className="language-switch inline-flex items-center gap-2 self-start px-2 py-1 text-xs sm:self-auto">
                        <span className="px-1">{t('common.language')}:</span>
                        <button
                            type="button"
                            onClick={() => void i18n.changeLanguage('en')}
                            className={`lang-button px-2.5 py-1 transition ${i18n.resolvedLanguage?.startsWith('en') ? 'is-active' : ''}`}
                        >
                            {t('common.languages.en')}
                        </button>
                        <button
                            type="button"
                            onClick={() => void i18n.changeLanguage('es')}
                            className={`lang-button px-2.5 py-1 transition ${i18n.resolvedLanguage?.startsWith('es') ? 'is-active' : ''}`}
                        >
                            {t('common.languages.es')}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/70"
                        onClick={closeMobileMenu}
                        aria-label={t('common.actions.dismiss')}
                    />

                    <div className="absolute inset-x-0 bottom-0 px-3 pb-3">
                        <div className="glass-panel p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-200/85">
                                    {t('homepage.brand')}
                                </p>
                                <button
                                    type="button"
                                    className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                    onClick={closeMobileMenu}
                                >
                                    {t('common.actions.dismiss')}
                                </button>
                            </div>

                            <section className="mb-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75">
                                    {t('auth.accountAction')}
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {isAuthenticated ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    closeMobileMenu()
                                                    onNavigateProfile()
                                                }}
                                                className="pixel-button inline-flex w-full items-center justify-center px-3 py-2 text-sm font-semibold"
                                            >
                                                {t('auth.accountAction')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    closeMobileMenu()
                                                    onLogout()
                                                }}
                                                className="pixel-button inline-flex w-full items-center justify-center px-3 py-2 text-sm font-semibold"
                                                disabled={isAuthSubmitting}
                                            >
                                                {isAuthSubmitting ? t('auth.logoutLoading') : t('auth.logoutAction')}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                closeMobileMenu()
                                                onNavigateAuth()
                                            }}
                                            className="pixel-button inline-flex w-full items-center justify-center px-3 py-2 text-sm font-semibold"
                                        >
                                            {t('auth.registerLoginAction')}
                                        </button>
                                    )}
                                </div>
                            </section>

                            <section>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75">
                                    {t('common.language')}
                                </p>
                                <div className="language-switch inline-flex w-full items-center justify-between gap-2 px-2 py-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void i18n.changeLanguage('en')
                                            closeMobileMenu()
                                        }}
                                        className={`lang-button flex-1 px-2.5 py-2 transition ${i18n.resolvedLanguage?.startsWith('en') ? 'is-active' : ''}`}
                                    >
                                        {t('common.languages.en')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void i18n.changeLanguage('es')
                                            closeMobileMenu()
                                        }}
                                        className={`lang-button flex-1 px-2.5 py-2 transition ${i18n.resolvedLanguage?.startsWith('es') ? 'is-active' : ''}`}
                                    >
                                        {t('common.languages.es')}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Header