import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Select, { type SingleValue, type StylesConfig } from 'react-select'
import type {
    NewReunionFormState,
    ReunionPayload,
    StudentGroup,
    Subject,
} from '../types/reunions'
import { defaultNewReunionForm } from '../types/reunions'
import { toRailsDateTime } from '../services/reunionsApi'

type NewReunionFormProps = {
    subjects: Subject[]
    groups: StudentGroup[]
    currentUserId: number | null
    isSubmitting: boolean
    onSubmit: (payload: ReunionPayload) => Promise<void>
}

type SelectOption = {
    value: string
    label: string
}

const reunionSelectStyles: StylesConfig<SelectOption, false> = {
    control: (provided, state) => ({
        ...provided,
        minHeight: 44,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        borderColor: state.isFocused ? 'rgba(251, 191, 36, 0.8)' : 'rgba(148, 163, 184, 0.55)',
        boxShadow: state.isFocused ? '0 0 0 1px rgba(251, 191, 36, 0.55)' : 'none',
        '&:hover': {
            borderColor: 'rgba(251, 191, 36, 0.8)',
        },
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(148, 163, 184, 0.45)',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused
            ? 'rgba(251, 191, 36, 0.2)'
            : 'rgba(15, 23, 42, 0.98)',
        color: 'rgba(254, 243, 199, 0.98)',
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'rgba(254, 243, 199, 0.98)',
    }),
    input: (provided) => ({
        ...provided,
        color: 'rgba(254, 243, 199, 0.98)',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: 'rgba(251, 191, 36, 0.7)',
    }),
    noOptionsMessage: (provided) => ({
        ...provided,
        color: 'rgba(251, 191, 36, 0.85)',
    }),
}

function NewReunionForm({
    subjects,
    groups,
    currentUserId,
    isSubmitting,
    onSubmit,
}: NewReunionFormProps) {
    const { t } = useTranslation()
    const [form, setForm] = useState<NewReunionFormState>(defaultNewReunionForm)
    const [formMessage, setFormMessage] = useState('')
    const [formError, setFormError] = useState('')

    const selectedSubject = useMemo(
        () => subjects.find((subject) => String(subject.id) === form.subjectId),
        [form.subjectId, subjects],
    )

    const selectedGroup = useMemo(
        () => groups.find((group) => String(group.id) === form.studentGroupId),
        [form.studentGroupId, groups],
    )

    const subjectOptions = useMemo<SelectOption[]>(
        () =>
            subjects.map((subject) => ({
                value: String(subject.id),
                label: `${subject.name}${subject.code ? ` (${subject.code})` : ''}`,
            })),
        [subjects],
    )

    const selectedSubjectOption = useMemo(
        () => subjectOptions.find((option) => option.value === form.subjectId) ?? null,
        [form.subjectId, subjectOptions],
    )

    const groupOptions = useMemo<SelectOption[]>(
        () =>
            groups.map((group) => ({
                value: String(group.id),
                label: group.name,
            })),
        [groups],
    )

    const selectedGroupOption = useMemo(
        () => groupOptions.find((option) => option.value === form.studentGroupId) ?? null,
        [form.studentGroupId, groupOptions],
    )

    const canSubmit =
        form.title.trim().length > 2 &&
        form.subjectId.length > 0 &&
        form.startsAt.length > 0 &&
        typeof currentUserId === 'number' &&
        (form.visibility === 'public' || form.studentGroupId.length > 0)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFormMessage('')
        setFormError('')

        if (!canSubmit) {
            if (typeof currentUserId !== 'number') {
                setFormError(t('auth.loginRequiredForCreate'))
                return
            }

            setFormError(t('form.validationRequired'))
            return
        }

        const payload: ReunionPayload = {
            title: form.title.trim(),
            creator_student_id: currentUserId,
            subject_id: Number(form.subjectId),
            student_group_id:
                form.visibility === 'private' ? Number(form.studentGroupId) : null,
            scheduled_for: toRailsDateTime(form.startsAt),
            description: form.description.trim(),
            visibility: form.visibility,
        }

        try {
            await onSubmit(payload)
            setFormMessage(t('form.successCreated'))
            setForm(defaultNewReunionForm)
        } catch (submissionError) {
            const submissionMessage =
                submissionError instanceof Error
                    ? submissionError.message
                    : t('form.errorUnexpected')
            setFormError(submissionMessage)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="field-label">
                {t('form.titleLabel')}
                <input
                    className="field-input"
                    value={form.title}
                    onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder={t('form.titlePlaceholder')}
                    required
                />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">
                    {t('form.subjectLabel')}
                    <Select<SelectOption, false>
                        inputId="new-reunion-subject"
                        instanceId="new-reunion-subject"
                        value={selectedSubjectOption}
                        onChange={(option: SingleValue<SelectOption>) =>
                            setForm((current) => ({
                                ...current,
                                subjectId: option?.value ?? '',
                            }))
                        }
                        options={subjectOptions}
                        isSearchable
                        isClearable
                        placeholder={t('form.subjectSelect')}
                        styles={reunionSelectStyles}
                    />
                </label>

                <label className="field-label">
                    {t('form.scheduledForLabel')}
                    <input
                        className="field-input"
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                startsAt: event.target.value,
                            }))
                        }
                        required
                    />
                </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="field-label">
                    {t('form.visibilityLabel')}
                    <select
                        className="field-input"
                        value={form.visibility}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                visibility: event.target.value as 'public' | 'private',
                                studentGroupId:
                                    event.target.value === 'public' ? '' : current.studentGroupId,
                            }))
                        }
                    >
                        <option value="public">{t('common.visibility.public')}</option>
                        <option value="private">{t('common.visibility.private')}</option>
                    </select>
                </label>

                <label className="field-label">
                    {t('form.privateGroupLabel')}
                    <Select<SelectOption, false>
                        inputId="new-reunion-group"
                        instanceId="new-reunion-group"
                        value={selectedGroupOption}
                        onChange={(option: SingleValue<SelectOption>) =>
                            setForm((current) => ({
                                ...current,
                                studentGroupId: option?.value ?? '',
                            }))
                        }
                        options={groupOptions}
                        isSearchable
                        isClearable
                        isDisabled={form.visibility === 'public'}
                        placeholder={t('form.groupSelect')}
                        styles={reunionSelectStyles}
                    />
                </label>
            </div>

            <label className="field-label">
                {t('form.descriptionLabel')}
                <textarea
                    className="field-input min-h-24 resize-y"
                    value={form.description}
                    onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder={t('form.descriptionPlaceholder')}
                />
            </label>

            {selectedSubject && (
                <div className="pixel-card p-3 text-sm text-amber-100/80">
                    {t('form.subjectSummary')}: <span className="font-semibold">{selectedSubject.name}</span>
                    {selectedGroup && form.visibility === 'private' && (
                        <span>
                            {' '}
                            · {t('form.groupSummary')}: <span className="font-semibold">{selectedGroup.name}</span>
                        </span>
                    )}
                </div>
            )}

            {formError && (
                <p className="pixel-error px-3 py-2 text-sm text-rose-100">
                    {formError}
                </p>
            )}

            {formMessage && (
                <p className="pixel-alert px-3 py-2 text-sm text-emerald-100">
                    {formMessage}
                </p>
            )}

            <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="pixel-button inline-flex w-full items-center justify-center px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? t('loading.creatingReunion') : t('form.submit')}
            </button>
        </form>
    )
}

export default NewReunionForm