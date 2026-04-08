import { useTranslation } from 'react-i18next'
import AuthPanel from '../components/AuthPanel'
import type { InstitutionItem } from '../components/InstitutionSelect'
import type { AuthUser, RegisterPayload } from '../types/auth'

type LoginPageProps = {
    currentUser: AuthUser | null
    institutions: InstitutionItem[]
    isAuthLoading: boolean
    isAuthSubmitting: boolean
    authError: string
    onLogin: (email: string, password: string) => Promise<void>
    onRegister: (payload: RegisterPayload) => Promise<void>
    onLogout: () => Promise<void>
    onBackToHomepage: () => void
}

function LoginPage({
    currentUser,
    institutions,
    isAuthLoading,
    isAuthSubmitting,
    authError,
    onLogin,
    onRegister,
    onLogout,
    onBackToHomepage,
}: LoginPageProps) {
    const { t } = useTranslation()

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('auth.pageEyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('auth.pageTitle')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('auth.pageDescription')}
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

                <AuthPanel
                    currentUser={currentUser}
                    institutions={institutions}
                    isAuthLoading={isAuthLoading}
                    isAuthSubmitting={isAuthSubmitting}
                    authError={authError}
                    onLogin={onLogin}
                    onRegister={onRegister}
                    onLogout={onLogout}
                />
            </div>
        </section>
    )
}

export default LoginPage
