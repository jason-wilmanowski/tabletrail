import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notifyError, useNotificationStore } from './notificationStore'

const initialState = useNotificationStore.getState()

beforeEach(() => {
  useNotificationStore.setState(initialState, true)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('notify', () => {
  it('appends a notification with the given variant and message', () => {
    useNotificationStore.getState().notify('success', 'Saved')

    const notifications = useNotificationStore.getState().notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({ variant: 'success', message: 'Saved' })
    expect(notifications[0].id).toBeTruthy()
  })

  it('appends multiple notifications with distinct ids', () => {
    useNotificationStore.getState().notify('info', 'First')
    useNotificationStore.getState().notify('error', 'Second')

    const notifications = useNotificationStore.getState().notifications
    expect(notifications).toHaveLength(2)
    expect(notifications[0].id).not.toBe(notifications[1].id)
  })

  it('auto-dismisses the notification after 6 seconds', () => {
    vi.useFakeTimers()

    useNotificationStore.getState().notify('info', 'Temporary')
    expect(useNotificationStore.getState().notifications).toHaveLength(1)

    vi.advanceTimersByTime(6000)

    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })
})

describe('dismiss', () => {
  it('removes only the notification with the matching id', () => {
    useNotificationStore.getState().notify('info', 'First')
    useNotificationStore.getState().notify('error', 'Second')
    const [first, second] = useNotificationStore.getState().notifications

    useNotificationStore.getState().dismiss(first.id)

    const notifications = useNotificationStore.getState().notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0].id).toBe(second.id)
  })
})

describe('notifyError', () => {
  it('notifies with the error variant', () => {
    notifyError('Something broke')

    const notifications = useNotificationStore.getState().notifications
    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toMatchObject({ variant: 'error', message: 'Something broke' })
  })
})
