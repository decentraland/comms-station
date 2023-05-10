export * from './emitter'
export * from './identity'
export * from '../transports/base'
export * from './mpromise'

// lastOf returns the last element of an array, or null if empty.
export function lastOf<T>(array: T[]): T | null {
  return array.length > 0 ? array[array.length - 1] : null
}

// setAsyncInterval is like setInterval, but it awaits a Promise returned by the handler before
// re-scheduling it.
export function setAsyncInterval(f: () => Promise<void>, intervalMs: number) {
  let prevPromise: Promise<void>

  const onTimeout = async () => {
    if (prevPromise) await prevPromise
    prevPromise = f()
    setTimeout(onTimeout, intervalMs)
  }

  onTimeout()
}
