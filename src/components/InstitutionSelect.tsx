import { useMemo } from 'react'
import Select, { type SingleValue, type StylesConfig } from 'react-select'

export type InstitutionItem = {
    id: number
    name: string
}

type SelectOption = {
    value: string
    label: string
}

type InstitutionSelectProps = {
    institutions: InstitutionItem[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    noOptionsText: string
    isDisabled?: boolean
}

const selectStyles: StylesConfig<SelectOption, false> = {
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

function InstitutionSelect({
    institutions,
    value,
    onChange,
    placeholder,
    noOptionsText,
    isDisabled = false,
}: InstitutionSelectProps) {
    const options = useMemo<SelectOption[]>(
        () =>
            institutions.map((institution) => ({
                value: String(institution.id),
                label: institution.name,
            })),
        [institutions],
    )

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value) ?? null,
        [options, value],
    )

    function handleChange(option: SingleValue<SelectOption>) {
        onChange(option?.value ?? '')
    }

    return (
        <Select<SelectOption, false>
            value={selectedOption}
            onChange={handleChange}
            options={options}
            isSearchable
            isClearable
            isDisabled={isDisabled}
            placeholder={placeholder}
            noOptionsMessage={() => noOptionsText}
            styles={selectStyles}
        />
    )
}

export default InstitutionSelect