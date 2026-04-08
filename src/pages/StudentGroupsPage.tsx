import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    createStudentGroup,
    deleteStudentGroup,
    getPendingStudentGroupInvitations,
    getInvitableStudents,
    inviteStudentToGroup,
    leaveStudentGroup,
    refreshStudentGroups,
    respondToStudentGroupInvitation,
    updateStudentGroup,
} from '../services/reunionsApi'
import type { InvitableStudent, StudentGroup, StudentGroupInvitation } from '../types/reunions'

type StudentGroupsPageProps = {
    isAuthenticated: boolean
    currentUserId: number | null
    onBackToHomepage: () => void
    onOpenLogin: () => void
    onOpenStudentProfile: (studentId: number, studentGroupId: number) => void
}

function StudentGroupsPage({
    isAuthenticated,
    currentUserId,
    onBackToHomepage,
    onOpenLogin,
    onOpenStudentProfile,
}: StudentGroupsPageProps) {
    const { t } = useTranslation()
    const [groups, setGroups] = useState<StudentGroup[]>([])
    const [pendingInvitations, setPendingInvitations] = useState<StudentGroupInvitation[]>([])
    const [newGroupName, setNewGroupName] = useState('')
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
    const [editingName, setEditingName] = useState('')
    const [inviteeQueryByGroup, setInviteeQueryByGroup] = useState<Record<number, string>>({})
    const [inviteeCandidatesByGroup, setInviteeCandidatesByGroup] = useState<Record<number, InvitableStudent[]>>({})
    const [selectedInviteeByGroup, setSelectedInviteeByGroup] = useState<Record<number, InvitableStudent | null>>({})
    const [newCreatorIdByGroup, setNewCreatorIdByGroup] = useState<Record<number, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [pageError, setPageError] = useState('')
    const [pageMessage, setPageMessage] = useState('')

    const loadPageData = useCallback(async () => {
        if (!isAuthenticated) {
            setGroups([])
            setPendingInvitations([])
            return
        }

        setIsLoading(true)
        setPageError('')

        try {
            const [groupsResult, invitationsResult] = await Promise.all([
                refreshStudentGroups(),
                getPendingStudentGroupInvitations(),
            ])

            setGroups(groupsResult)
            setPendingInvitations(invitationsResult)
        } catch {
            setPageError(t('errors.loadStudentGroups'))
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, t])

    useEffect(() => {
        void loadPageData()
    }, [loadPageData])

    async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!newGroupName.trim()) {
            return
        }

        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            await createStudentGroup({ name: newGroupName.trim() })
            setNewGroupName('')
            setPageMessage(t('studentGroups.created'))
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupCreate'))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDeleteGroup(groupId: number) {
        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            await deleteStudentGroup(groupId)
            setPageMessage(t('studentGroups.deleted'))
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupDelete'))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleSaveGroupName(groupId: number) {
        if (!editingName.trim()) {
            return
        }

        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            await updateStudentGroup(groupId, { name: editingName.trim() })
            setEditingGroupId(null)
            setEditingName('')
            setPageMessage(t('studentGroups.updated'))
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupUpdate'))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleInvite(groupId: number) {
        const selectedInvitee = selectedInviteeByGroup[groupId]

        if (!selectedInvitee) {
            setPageError(t('studentGroups.inviteSelectionRequired'))
            return
        }

        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            await inviteStudentToGroup(groupId, selectedInvitee.id)
            setInviteeQueryByGroup((current) => ({ ...current, [groupId]: '' }))
            setInviteeCandidatesByGroup((current) => ({ ...current, [groupId]: [] }))
            setSelectedInviteeByGroup((current) => ({ ...current, [groupId]: null }))
            setPageMessage(t('studentGroups.invited'))
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupInvite'))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleInviteQueryChange(groupId: number, query: string) {
        setInviteeQueryByGroup((current) => ({
            ...current,
            [groupId]: query,
        }))
        setSelectedInviteeByGroup((current) => ({
            ...current,
            [groupId]: null,
        }))

        if (query.trim().length < 2) {
            setInviteeCandidatesByGroup((current) => ({
                ...current,
                [groupId]: [],
            }))
            return
        }

        try {
            const results = await getInvitableStudents(groupId, query)
            setInviteeCandidatesByGroup((current) => ({
                ...current,
                [groupId]: results,
            }))
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupInviteSearch'))
        }
    }

    async function handleLeaveGroup(group: StudentGroup) {
        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            const rawNewCreatorId = newCreatorIdByGroup[group.id] ?? ''
            const parsedNewCreatorId = Number(rawNewCreatorId)

            const leavingAsCreator = group.creator_student_id === currentUserId
            const resolvedNewCreatorId = leavingAsCreator && Number.isInteger(parsedNewCreatorId) && parsedNewCreatorId > 0
                ? parsedNewCreatorId
                : undefined

            await leaveStudentGroup(group.id, resolvedNewCreatorId)

            setNewCreatorIdByGroup((current) => ({ ...current, [group.id]: '' }))
            setPageMessage(t('studentGroups.left'))
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupLeave'))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleRespondInvitation(
        invitationId: number,
        status: 'accepted' | 'declined',
    ) {
        setIsSubmitting(true)
        setPageError('')
        setPageMessage('')

        try {
            await respondToStudentGroupInvitation(invitationId, status)
            setPageMessage(
                status === 'accepted' ? t('studentGroups.invitationAccepted') : t('studentGroups.invitationDeclined'),
            )
            await loadPageData()
        } catch (error) {
            setPageError(error instanceof Error ? error.message : t('errors.studentGroupInvitationUpdate'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('studentGroups.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('studentGroups.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('studentGroups.description')}
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

                {!isAuthenticated ? (
                    <div className="pixel-card p-4 text-sm text-amber-100/90">
                        <p>{t('auth.loginRequiredForStudentGroups')}</p>
                        <button
                            type="button"
                            onClick={onOpenLogin}
                            className="pixel-button mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                        >
                            {t('auth.loginCta')}
                        </button>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleCreateGroup} className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr,auto]">
                            <input
                                type="text"
                                className="field-input"
                                value={newGroupName}
                                onChange={(event) => setNewGroupName(event.target.value)}
                                placeholder={t('studentGroups.newGroupPlaceholder')}
                                maxLength={80}
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !newGroupName.trim()}
                                className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {t('studentGroups.createAction')}
                            </button>
                        </form>

                        {pageError && (
                            <p className="pixel-error mb-4 px-3 py-2 text-sm text-rose-100">{pageError}</p>
                        )}

                        {pageMessage && (
                            <p className="pixel-alert mb-4 px-3 py-2 text-sm text-emerald-100">{pageMessage}</p>
                        )}

                        <section className="mb-8">
                            <h3 className="fantasy-title text-xl font-semibold tracking-tight">
                                {t('studentGroups.yourGroupsTitle')}
                            </h3>

                            {isLoading ? (
                                <p className="mt-3 text-sm text-amber-100/75">{t('studentGroups.loading')}</p>
                            ) : groups.length === 0 ? (
                                <p className="mt-3 text-sm text-amber-100/75">{t('studentGroups.empty')}</p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {groups.map((group) => (
                                        <article key={group.id} className="pixel-card p-4">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    {editingGroupId === group.id ? (
                                                        <div className="flex flex-col gap-2 sm:flex-row">
                                                            <input
                                                                type="text"
                                                                value={editingName}
                                                                onChange={(event) => setEditingName(event.target.value)}
                                                                className="field-input"
                                                                maxLength={80}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="pixel-button px-3 py-2 text-sm font-semibold"
                                                                onClick={() => void handleSaveGroupName(group.id)}
                                                            >
                                                                {t('studentGroups.saveAction')}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-base font-semibold text-amber-100">{group.name}</p>
                                                            <p className="mt-1 text-xs text-amber-100/70">
                                                                {t('studentGroups.creatorLabel')}: {group.creator_student_name || '-'}
                                                            </p>
                                                            {(group.students ?? []).length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {(group.students ?? []).map((student) => (
                                                                        <button
                                                                            key={student.id}
                                                                            type="button"
                                                                            className="rounded-full border border-amber-100/20 bg-black/10 px-2 py-1 text-xs text-amber-100/85 hover:border-amber-100/40"
                                                                            onClick={() => onOpenStudentProfile(student.id, group.id)}
                                                                        >
                                                                            {student.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>

                                                {group.can_manage && editingGroupId !== group.id && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className="pixel-button px-3 py-2 text-xs font-semibold"
                                                            onClick={() => {
                                                                setEditingGroupId(group.id)
                                                                setEditingName(group.name)
                                                            }}
                                                        >
                                                            {t('studentGroups.editAction')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pixel-button px-3 py-2 text-xs font-semibold"
                                                            onClick={() => void handleDeleteGroup(group.id)}
                                                        >
                                                            {t('studentGroups.deleteAction')}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {group.can_manage && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,auto]">
                                                        <input
                                                            type="text"
                                                            className="field-input"
                                                            value={inviteeQueryByGroup[group.id] ?? ''}
                                                            onChange={(event) => {
                                                                void handleInviteQueryChange(group.id, event.target.value)
                                                            }}
                                                            placeholder={t('studentGroups.inviteSearchPlaceholder')}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="pixel-button px-4 py-2 text-sm font-semibold"
                                                            onClick={() => void handleInvite(group.id)}
                                                            disabled={isSubmitting || !selectedInviteeByGroup[group.id]}
                                                        >
                                                            {t('studentGroups.inviteAction')}
                                                        </button>
                                                    </div>

                                                    {(inviteeCandidatesByGroup[group.id] ?? []).length > 0 && (
                                                        <div className="grid gap-2">
                                                            {(inviteeCandidatesByGroup[group.id] ?? []).map((candidate) => (
                                                                <button
                                                                    key={candidate.id}
                                                                    type="button"
                                                                    className="pixel-button px-3 py-2 text-left text-xs font-semibold"
                                                                    onClick={() => {
                                                                        setSelectedInviteeByGroup((current) => ({
                                                                            ...current,
                                                                            [group.id]: candidate,
                                                                        }))
                                                                        setInviteeQueryByGroup((current) => ({
                                                                            ...current,
                                                                            [group.id]: `${candidate.full_name} (${candidate.email})`,
                                                                        }))
                                                                        setInviteeCandidatesByGroup((current) => ({
                                                                            ...current,
                                                                            [group.id]: [],
                                                                        }))
                                                                    }}
                                                                >
                                                                    {candidate.full_name} - {candidate.email}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(group.student_ids ?? []).includes(currentUserId ?? -1) && (
                                                <div className="mt-3 space-y-2 border-t border-amber-50/10 pt-3">
                                                    {group.creator_student_id === currentUserId && (
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            className="field-input"
                                                            value={newCreatorIdByGroup[group.id] ?? ''}
                                                            onChange={(event) =>
                                                                setNewCreatorIdByGroup((current) => ({
                                                                    ...current,
                                                                    [group.id]: event.target.value,
                                                                }))
                                                            }
                                                            placeholder={t('studentGroups.newCreatorIdPlaceholder')}
                                                        />
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="pixel-button px-3 py-2 text-xs font-semibold"
                                                        onClick={() => void handleLeaveGroup(group)}
                                                    >
                                                        {t('studentGroups.leaveAction')}
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h3 className="fantasy-title text-xl font-semibold tracking-tight">
                                {t('studentGroups.pendingInvitationsTitle')}
                            </h3>

                            {pendingInvitations.length === 0 ? (
                                <p className="mt-3 text-sm text-amber-100/75">{t('studentGroups.noInvitations')}</p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {pendingInvitations.map((invitation) => (
                                        <article key={invitation.id} className="pixel-card p-4">
                                            <p className="text-sm text-amber-100/90">
                                                {invitation.student_group_name} - {t('studentGroups.invitedByLabel')}: {invitation.inviter_name}
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <button
                                                    type="button"
                                                    className="pixel-button px-3 py-2 text-xs font-semibold"
                                                    onClick={() => void handleRespondInvitation(invitation.id, 'accepted')}
                                                >
                                                    {t('studentGroups.acceptAction')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="pixel-button px-3 py-2 text-xs font-semibold"
                                                    onClick={() => void handleRespondInvitation(invitation.id, 'declined')}
                                                >
                                                    {t('studentGroups.declineAction')}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </section>
    )
}

export default StudentGroupsPage
