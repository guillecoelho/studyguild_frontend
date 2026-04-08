export type NewsletterEntryType = 'news' | 'article'

export type NewsletterEntry = {
    id: number
    title: string
    entry_type: NewsletterEntryType
    summary: string | null
    content: string
    published_at: string
    author_id: number
    author_name: string
    created_at: string
    updated_at: string
}

export type NewsletterEntryPayload = {
    title: string
    entry_type: NewsletterEntryType
    summary?: string
    content: string
    published_at?: string
}
