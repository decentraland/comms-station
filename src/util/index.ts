export * from './emitter'
export * from './identity'

// lastOf returns the last element of an array, or null if empty.
export function lastOf<T>(array: T[]): T | null {
  return array.length > 0 ? array[array.length - 1] : null
}


// setOnNextListener consumes a generator while invoking a callback for each item:
export async function setOnNextListener<T>(gen: AsyncGenerator<T>, onNext: (item: T) => void) {
  try {
    for await (const item of gen) {
      onNext(item)
    }
  } catch (error) {
    throw error // TODO
  }
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

