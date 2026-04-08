declare module '@rails/actioncable' {
    type SubscriptionParams = Record<string, unknown>

    type SubscriptionCallbacks = {
        connected?: () => void
        disconnected?: () => void
        rejected?: () => void
        received?: (data: unknown) => void
    }

    export type ActionCableSubscription = {
        unsubscribe: () => void
    }

    export type ActionCableConsumer = {
        subscriptions: {
            create: (
                params: SubscriptionParams,
                callbacks: SubscriptionCallbacks,
            ) => ActionCableSubscription
        }
    }

    export function createConsumer(url?: string): ActionCableConsumer
}
