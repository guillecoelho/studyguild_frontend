import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDateLabel } from '../services/reunionsApi'
import type { Reunion, ReunionMessage } from '../types/reunions'

type ReunionDetailsPageProps = {
    reunion: Reunion | null
    messages: ReunionMessage[]
    isLoading: boolean
    isMessagesLoading: boolean
    pageError: string
    messageError: string
    isJoining: boolean
    isSendingMessage: boolean
    joinFeedback: string
    messageFeedback: string
    isAuthenticated: boolean
    currentUserId: number | null
    onBackToHomepage: () => void
    onJoin: () => Promise<void>
    onSendMessage: (content: string) => Promise<void>
    onOpenLogin: () => void
    onOpenParticipantProfile: (studentId: number) => void
}

function ReunionDetailsPage({
    reunion,
    messages,
    isLoading,
    isMessagesLoading,
    pageError,
    messageError,
    isJoining,
    isSendingMessage,
    joinFeedback,
    messageFeedback,
    isAuthenticated,
    currentUserId,
    onBackToHomepage,
    onJoin,
    onSendMessage,
    onOpenLogin,
    onOpenParticipantProfile,
}: ReunionDetailsPageProps) {
    const { i18n, t } = useTranslation()
    const [messageContent, setMessageContent] = useState('')
    const messagesContainerRef = useRef<HTMLUListElement | null>(null)

    const participants = reunion?.participant_students ?? []

    async function handleSendMessage() {
        const trimmedContent = messageContent.trim()
        if (!trimmedContent) {
            return
        }

        await onSendMessage(trimmedContent)
        setMessageContent('')
    }

    useEffect(() => {
        if (!messagesContainerRef.current) {
            return
        }

        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }, [messages])

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('reunionDetailsPage.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {reunion?.title ?? t('reunionDetailsPage.titleFallback')}
                        </h2>
                        {reunion && (
                            <>
                                <p className="mt-1 text-sm text-amber-100/75">
                                    {formatDateLabel(reunion.scheduled_for, i18n.language)}
                                </p>
                                <p className="mt-1 text-sm text-amber-100/75">
                                    {t('reunionDetailsPage.subjectLabel')}: {reunion.subject_name ?? t('reunions.subjectUnavailable')}
                                </p>
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onBackToHomepage}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('common.actions.backToHomepage')}
                    </button>
                </header>

                {isLoading && (
                    <div className="space-y-3">
                        <div className="skeleton-line h-11" />
                        <div className="skeleton-line h-11" />
                        <div className="skeleton-line h-24" />
                    </div>
                )}

                {!isLoading && pageError && (
                    <p className="pixel-error px-3 py-2 text-sm text-rose-100">{pageError}</p>
                )}

                {!isLoading && reunion && (
                    <div className="space-y-5">
                        <article className="pixel-card p-4">
                            <h3 className="text-base font-semibold text-amber-50">
                                {t('reunionDetailsPage.participantsTitle')}
                            </h3>

                            {participants.length > 0 ? (
                                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-100/85">
                                    {participants.map((participant, index) => (
                                        <li key={`${participant.id}-${index}`}>
                                            <button
                                                type="button"
                                                onClick={() => onOpenParticipantProfile(participant.id)}
                                                className="text-left underline underline-offset-2 hover:text-amber-50"
                                            >
                                                {participant.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-amber-100/75">
                                    {t('reunionDetailsPage.noParticipants')}
                                </p>
                            )}
                        </article>

                        {joinFeedback && (
                            <p className="pixel-alert px-3 py-2 text-sm text-emerald-100">
                                {joinFeedback}
                            </p>
                        )}

                        <article className="pixel-card p-4">
                            <h3 className="text-base font-semibold text-amber-50">
                                {t('reunionDetailsPage.messagesTitle')}
                            </h3>

                            {isMessagesLoading ? (
                                <div className="mt-3 space-y-2">
                                    <div className="skeleton-line h-10" />
                                    <div className="skeleton-line h-10" />
                                </div>
                            ) : messages.length > 0 ? (
                                <ul ref={messagesContainerRef} className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                                    {messages.map((message) => {
                                        const isOwnMessage =
                                            typeof currentUserId === 'number' &&
                                            message.student_id === currentUserId

                                        return (
                                            <li
                                                key={message.id}
                                                className={`rounded-lg border px-3 py-2 text-sm ${isOwnMessage
                                                    ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100'
                                                    : 'border-amber-100/15 bg-black/10 text-amber-100'
                                                    }`}
                                            >
                                                <p className="font-semibold">
                                                    {message.student_name ?? t('reunionDetailsPage.unknownStudent')}
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                                                <p className="mt-1 text-xs opacity-80">
                                                    {formatDateLabel(message.created_at, i18n.language)}
                                                </p>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-amber-100/75">
                                    {t('reunionDetailsPage.noMessages')}
                                </p>
                            )}

                            {messageError && (
                                <p className="pixel-error mt-3 px-3 py-2 text-sm text-rose-100">{messageError}</p>
                            )}

                            {messageFeedback && (
                                <p className="pixel-alert mt-3 px-3 py-2 text-sm text-emerald-100">
                                    {messageFeedback}
                                </p>
                            )}

                            {isAuthenticated ? (
                                <div className="mt-3 space-y-2">
                                    <label className="field-label">
                                        <span>{t('reunionDetailsPage.messageLabel')}</span>
                                        <textarea
                                            value={messageContent}
                                            onChange={(event) => setMessageContent(event.target.value)}
                                            rows={3}
                                            placeholder={t('reunionDetailsPage.messagePlaceholder')}
                                            className="field-input"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => void handleSendMessage()}
                                        disabled={isSendingMessage || !messageContent.trim()}
                                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSendingMessage
                                            ? t('reunionDetailsPage.sendingMessage')
                                            : t('reunionDetailsPage.sendMessage')}
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-amber-100/75">
                                    {t('reunionDetailsPage.loginRequired')}
                                </p>
                            )}
                        </article>

                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={() => void onJoin()}
                                disabled={isJoining}
                                className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isJoining
                                    ? t('reunionDetailsPage.joinLoading')
                                    : t('reunionDetailsPage.joinAction')}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-amber-100/80">
                                    {t('reunionDetailsPage.loginRequired')}
                                </p>
                                <button
                                    type="button"
                                    onClick={onOpenLogin}
                                    className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                                >
                                    {t('reunionDetailsPage.loginCta')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}

export default ReunionDetailsPage
