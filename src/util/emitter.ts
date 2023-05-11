import { ManagedPromise } from "./mpromise"

// EmitterEvent is simply an object with a $case, meant to be extended.
export type EmitterEvent = {
  $case: string
}

// Case is the subtype of an EmitterEvent union for a particular $case.
export type Case<Cs extends EmitterEvent, C> = Extract<Cs, {$case: C}>


// Receiver is a function that takes an event of some type.
export type Receiver<E extends EmitterEvent> = (event: E) => unknown


// Emitter is a utility type for eventful objects, to easily provide on/off listeners.
export class Emitter<T extends EmitterEvent> {
  private receivers = new Map<T['$case'] | '*', Set<Receiver<T>>>()

  // on adds a receiver for events of any ('*') case.
  on($case: '*', receiver: Receiver<T>): Emitter<T>

  // on adds a receiver for events of a given case.
  on<C extends T['$case']>($case: C, receiver: Receiver<Case<T, C>>): Emitter<T>

  // on (base overload)
  on($case: string, receiver: any) {
    this.getOrCreateSet($case).add(receiver)
    return this
  }

  // off removes a receiver for events of any ('*') case (it can still receive specific cases).
  off($case: '*', receiver: Receiver<T>): Emitter<T>

  // off removes a receiver for events of a given case.
  off<C extends T['$case']>($case: C, receiver: Receiver<Case<T, C>>): Emitter<T>

  // off (base overload)
  off($case: string, receiver: any) {
    this.getOrCreateSet($case).delete(receiver as any)
    return this
  }

  // offAll removes all receivers from all event cases (including '*').
  offAll() {
    this.receivers.clear()
    return this
  }

  // emit calls all relevant receivers of an event (synchronously, in unspecified order).
  protected emit(event: T) {
    this.getOrCreateSet(event.$case).forEach(receiver => receiver(event))
    this.getOrCreateSet('*').forEach(receiver => receiver(event))
  }

  private getOrCreateSet(type: string) {
    let receiverSet = this.receivers.get(type)
    
    if (! receiverSet) {
      this.receivers.set(type, receiverSet = new Set())
    }

    return receiverSet
  }
}


// Events is a utility method collection (kept separate from Emitter to reduce inherited interface).
export const Events = {
  stream,
  next
}


// stream returns an AsyncGenerator to iterate events of any ('*') case.
function stream<E extends EmitterEvent>(emitter: Emitter<E>, $case: '*'): AsyncGenerator<E>

// stream an AsyncGenerator to iterate events of a given case.
function stream<E extends EmitterEvent, C extends E['$case']>(emitter: Emitter<E>, $case: C): AsyncGenerator<Case<E, C>>

// stream (base overload)
async function* stream(emitter: Emitter<any>, $case: string): AsyncGenerator<any> {
  let promise = new ManagedPromise<any>()

  emitter.on($case, ev => {
    promise.resolve(ev)
    promise = new ManagedPromise<any>()
  })

  while (true) {
    yield promise
  }
}


// next returns a Promise for the next event of any ('*') case.
function next<E extends EmitterEvent>(emitter: Emitter<E>, $case: '*'): Promise<E>

// next returns a Promise for the next event a given case.
function next<E extends EmitterEvent, C extends E['$case']>(emitter: Emitter<E>, $case: C): Promise<Case<E, C>>

// next (base overload)
async function next(emitter: Emitter<any>, $case: string) {
  return (await stream(emitter, $case).next()).value // will never be `done`
}


