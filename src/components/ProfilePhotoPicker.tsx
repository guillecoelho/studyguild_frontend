import { useEffect, useRef, useState } from 'react'
import Croppie from 'croppie'
import 'croppie/croppie.css'
import { useTranslation } from 'react-i18next'

type CropCandidate = {
    dataUrl: string
    mimeType: string
    name: string
}

type ProfilePhotoPickerProps = {
    inputId: string
    label: string
    previewAlt: string
    uploadHint: string
    selectedFile: File | null
    removePhoto?: boolean
    removeLabel?: string
    initialPreviewUrl?: string | null
    disabled?: boolean
    wrapperClassName?: string
    buttonClassName?: string
    onSelectedFileChange: (file: File | null) => void
    onRemovePhotoChange?: (remove: boolean) => void
    onError?: (message: string) => void
}

async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = () => reject(new Error('Could not read image file.'))
        reader.readAsDataURL(file)
    })
}

async function loadImage(dataUrl: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Could not load selected image.'))
        image.src = dataUrl
    })
}

async function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = () => reject(new Error('Could not read cropped image.'))
        reader.readAsDataURL(blob)
    })
}

function ProfilePhotoPicker({
    inputId,
    label,
    previewAlt,
    uploadHint,
    selectedFile,
    removePhoto = false,
    removeLabel,
    initialPreviewUrl,
    disabled = false,
    wrapperClassName = 'field-label self-start text-xs sm:self-center',
    buttonClassName = 'mx-auto mt-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-sm border border-amber-100/25 bg-black/20 sm:h-32 sm:w-32 lg:h-36 lg:w-36',
    onSelectedFileChange,
    onRemovePhotoChange,
    onError,
}: ProfilePhotoPickerProps) {
    const { t } = useTranslation()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const cropContainerRef = useRef<HTMLDivElement | null>(null)
    const croppieRef = useRef<Croppie | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl ?? null)
    const [cropCandidate, setCropCandidate] = useState<CropCandidate | null>(null)
    const [isCropModalOpen, setIsCropModalOpen] = useState(false)
    const [isCropping, setIsCropping] = useState(false)

    useEffect(() => {
        if (selectedFile) {
            return
        }

        if (removePhoto) {
            setPreviewUrl(null)
            return
        }

        setPreviewUrl(initialPreviewUrl ?? null)
    }, [initialPreviewUrl, removePhoto, selectedFile])

    useEffect(() => {
        if (!isCropModalOpen || !cropCandidate || !cropContainerRef.current) {
            return
        }

        const croppie = new Croppie(cropContainerRef.current, {
            viewport: { width: 220, height: 220, type: 'square' },
            boundary: { width: 300, height: 300 },
            showZoomer: true,
            enableExif: true,
            mouseWheelZoom: true,
        })
        croppieRef.current = croppie

        void croppie.bind({
            url: cropCandidate.dataUrl,
        })

        return () => {
            croppie.destroy()
            croppieRef.current = null
        }
    }, [cropCandidate, isCropModalOpen])

    async function handlePhotoSelection(file: File | null) {
        if (!file) {
            return
        }

        try {
            const dataUrl = await fileToDataUrl(file)
            const image = await loadImage(dataUrl)

            if (image.naturalWidth === image.naturalHeight) {
                onSelectedFileChange(file)
                onRemovePhotoChange?.(false)
                setPreviewUrl(dataUrl)
                return
            }

            setCropCandidate({
                dataUrl,
                mimeType: file.type,
                name: file.name,
            })
            setIsCropModalOpen(true)
        } catch {
            onError?.(t('profile.cropLoadError'))
        }
    }

    async function handleConfirmCrop() {
        if (!cropCandidate || !croppieRef.current) {
            return
        }

        setIsCropping(true)
        try {
            const format: Croppie.Format =
                cropCandidate.mimeType === 'image/png'
                    ? 'png'
                    : cropCandidate.mimeType === 'image/webp'
                        ? 'webp'
                        : 'jpeg'

            const croppedBlob = await croppieRef.current.result({
                type: 'blob',
                size: 'viewport',
                format,
                quality: 1,
            })

            const extension = format === 'jpeg' ? 'jpg' : format
            const fileName = cropCandidate.name.includes('.')
                ? cropCandidate.name.replace(/\.[^/.]+$/, `.${extension}`)
                : `${cropCandidate.name}.${extension}`
            const croppedFile = new File([croppedBlob], fileName, { type: croppedBlob.type })
            const previewDataUrl = await blobToDataUrl(croppedBlob)

            onSelectedFileChange(croppedFile)
            onRemovePhotoChange?.(false)
            setPreviewUrl(previewDataUrl)
            setIsCropModalOpen(false)
            setCropCandidate(null)
        } catch {
            onError?.(t('profile.cropProcessError'))
        } finally {
            setIsCropping(false)
        }
    }

    function handleCancelCrop() {
        setIsCropModalOpen(false)
        setCropCandidate(null)
    }

    return (
        <>
            <label className={wrapperClassName}>
                {label}
                <button
                    type="button"
                    className={buttonClassName}
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                >
                    {previewUrl && !removePhoto ? (
                        <img src={previewUrl} alt={previewAlt} className="h-full w-full object-cover" />
                    ) : (
                        <span className="px-2 text-center text-[10px] text-amber-100/70">{uploadHint}</span>
                    )}
                </button>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        void handlePhotoSelection(file)
                        event.target.value = ''
                    }}
                    className="hidden"
                    disabled={disabled}
                />

                {onRemovePhotoChange && removeLabel && (
                    <label className="mt-2 flex items-center gap-2 text-xs text-amber-100/80">
                        <input
                            type="checkbox"
                            checked={removePhoto}
                            onChange={(event) => {
                                const checked = event.target.checked
                                onRemovePhotoChange(checked)
                                if (checked) {
                                    onSelectedFileChange(null)
                                    setPreviewUrl(null)
                                }
                            }}
                            disabled={disabled}
                        />
                        {removeLabel}
                    </label>
                )}
            </label>

            {isCropModalOpen && cropCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-lg border border-amber-100/20 bg-[#1a130f] p-4">
                        <h3 className="fantasy-title text-lg font-semibold text-amber-100">
                            {t('profile.cropModalTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('profile.cropModalDescription')}
                        </p>

                        <div className="mt-4 flex justify-center">
                            <div
                                ref={cropContainerRef}
                                className="overflow-hidden rounded-sm border border-amber-100/20"
                            />
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleCancelCrop}
                                className="pixel-button px-3 py-2 text-sm font-semibold"
                                disabled={isCropping}
                            >
                                {t('profile.cropCancelAction')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleConfirmCrop()}
                                className="pixel-button px-3 py-2 text-sm font-semibold"
                                disabled={isCropping}
                            >
                                {isCropping ? t('profile.cropProcessing') : t('profile.cropConfirmAction')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default ProfilePhotoPicker
