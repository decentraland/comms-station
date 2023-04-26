
// AppEvent is simply an object with a type, meant to be extended.
export type AppEvent = {
  type: string
}

// AppEventOfType can narrow type information of AppEvents to allow the compiler to verify it.
export type AppEventOfType<T extends AppEvent, K> = Extract<T, {type: K}>


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


// Receiver is a function that takes an event of some type.
export type Receiver<T extends AppEvent> = (event: T) => unknown

// Emitter is a utility type for eventful objects, to easily provide on/off listeners.
export class Emitter<T extends AppEvent> {
  private receivers = new Map<T['type'], Set<Receiver<T>>>

  on<K extends T['type'], EoT extends AppEventOfType<T, K>>(type: K, receiver: (ev: EoT) => unknown) {
    const typedReceiver = receiver as unknown as Receiver<T>

    if (this.receivers.has(type)) {
      this.receivers.get(type)!.add(typedReceiver)

    } else {
      this.receivers.set(type, new Set([ typedReceiver ]))
    }
    
    return this
  }

  off<K extends T['type'], EoT extends AppEventOfType<T, K>>(type: K, receiver: (ev: EoT) => unknown) {
    if (! this.receivers.has(type)) return // nothing to do
    const typedReceiver = receiver as unknown as Receiver<T>

    this.receivers.get(type)!.delete(typedReceiver)
    
    return this
  }

  offAll() {
    this.receivers.clear()
    return this
  }

  async next<K extends T['type'], EoT extends AppEventOfType<T, K>>(type: K): Promise<EoT> {
    return new Promise(resolve => {
      const receiver = (ev: EoT) => {
        resolve(ev)
        this.off(type, receiver)
      }

      this.on(type, receiver)
    })
  }

  emit(event: T) {
    if (! this.receivers.has(event.type)) return // nobody will receive this

    for (let receiver of this.receivers.get(event.type)!) {
      receiver(event)
    }
  }
}