import { ManagedPromise } from "./mpromise"

// AppEvent is simply an object with a type, meant to be extended.
export type AppEvent = {
  type: string
}

// SubType can narrow type information of AppEvents to allow the compiler to verify it.
export type SubType<E extends AppEvent, T> = Extract<E, {type: T}>


// Receiver is a function that takes an event of some type.
export type Receiver<E extends AppEvent> = (event: E) => unknown


// Emitter is a utility type for eventful objects, to easily provide on/off listeners.
export class Emitter<E extends AppEvent> {
  private receivers = new Map<E['type'] | '*', Set<Receiver<E>>>()

  // Start calling a receiver with events of a given type.
  on<T extends E['type']>(type: T, receiver: Receiver<SubType<E, T>>) {
    this.getOrCreateSet(type).add(receiver as any)
    return this
  }

  // Stop calling a receiver with events of a given type.
  off<T extends E['type']>(type: T, receiver: Receiver<SubType<E, T>>) {
    this.getOrCreateSet(type).delete(receiver as any)
    return this
  }

  // Stop calling all receivers.
  offAll() {
    this.receivers.clear()
    return this
  }

  // Return a Promise for the next event of a given type.
  async next<T extends E['type']>(type: T): Promise<SubType<E, T>> {
    return (await this.stream(type).next()).value // will never be `done`
  }

  // Return an AsyncGenerator to stream events of a given type.
  async* stream<T extends E['type']>(type: T): AsyncGenerator<SubType<E, T>> {
    for await (let ev of this.streamAny()) {
      if (ev.type == type) yield ev as SubType<E, T>
    }
  }

  // Start calling a receiver on events of any type.
  onAny(receiver: Receiver<E>) {
    this.getOrCreateSet('*').add(receiver)
    return this
  }

  // Stop calling a receiver on events of any type (still call if receiver was bound to specific types).
  offAny(receiver: Receiver<E>) {
    this.getOrCreateSet('*').delete(receiver)
    return this
  }

  // Return a Promise for the next event of any type.
  async nextAny() {
    return (await this.streamAny().next()).value // will never be `done`
  }

  // Return an AsyncGenerator to stream events of any type.
  async* streamAny(): AsyncGenerator<E> {
    let promise = new ManagedPromise<E>()

    this.onAny(ev => {
      promise.resolve(ev)
      promise = new ManagedPromise<E>()
    })

    while (true) {
      yield promise
    }
  }

  // Call all relevant receivers of an event (synchronously, in unspecified order).
  emit(event: E) {
    this.getOrCreateSet(event.type).forEach(receiver => receiver(event))
    this.getOrCreateSet('*').forEach(receiver => receiver(event))
  }

  private getOrCreateSet(type: E['type']) {
    let receiverSet = this.receivers.get(type)
    
    if (! receiverSet) {
      this.receivers.set(type, receiverSet = new Set())
    }

    return receiverSet
  }
}
