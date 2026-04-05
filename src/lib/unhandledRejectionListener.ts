type RejectionTarget = Pick<Window, 'addEventListener' | 'removeEventListener'> | null | undefined

function hasBrowserEventApi(
  target: RejectionTarget,
): target is Pick<Window, 'addEventListener' | 'removeEventListener'> {
  return !!target &&
    typeof target.addEventListener === 'function' &&
    typeof target.removeEventListener === 'function'
}

export function attachUnhandledStealRejectionListener(
  target: RejectionTarget = typeof window !== 'undefined' ? window : undefined,
) {
  if (!hasBrowserEventApi(target)) {
    return () => {}
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    if (event.reason?.message?.includes('steal')) {
      event.preventDefault()
    }
  }

  target.addEventListener('unhandledrejection', handleRejection)
  return () => target.removeEventListener('unhandledrejection', handleRejection)
}
