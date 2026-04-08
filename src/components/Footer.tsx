import { useTranslation } from 'react-i18next'

type FooterProps = {
    isAdmin: boolean
    onOpenAbout: () => void
    onOpenIssues: () => void
    onOpenIssueStatus: () => void
    onOpenNewsletter: () => void
    onOpenNewsletterAdmin: () => void
}

function Footer({ isAdmin, onOpenAbout, onOpenIssues, onOpenIssueStatus, onOpenNewsletter, onOpenNewsletterAdmin }: FooterProps) {
    const { t } = useTranslation()

    return (
        <footer className="mx-auto mt-8 w-full max-w-6xl">
            <div className="subtle-footer px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3 text-[0.95rem] text-amber-100/70">
                    <span>{t('footer.copy')}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="footer-link"
                            onClick={onOpenAbout}
                        >
                            {t('footer.aboutLink')}
                        </button>
                        <button
                            type="button"
                            className="footer-link"
                            onClick={onOpenNewsletter}
                        >
                            {t('footer.newsletterLink')}
                        </button>
                        <button
                            type="button"
                            className="footer-link"
                            onClick={onOpenIssues}
                        >
                            {t('footer.issuesLink')}
                        </button>
                        <button
                            type="button"
                            className="footer-link"
                            onClick={onOpenIssueStatus}
                        >
                            {t('footer.issueStatusLink')}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                className="footer-link"
                                onClick={onOpenNewsletterAdmin}
                            >
                                {t('footer.adminLink')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
