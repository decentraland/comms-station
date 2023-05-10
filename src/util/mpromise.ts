
// ResolveF is a valid resolve callback for the Promise constructor
type ResolveF<T, U = T> = (value: T) => U | PromiseLike<U>

// RejectF is a valid reject callback for the Promise constructor
type RejectF<T, U = T> = (reason: any) => U | PromiseLike<U>

// ManagedPromise is a PromiseLike object that can be settled manually after construction using
// public `resolve` and `reject` methods.
export class ManagedPromise<T> implements PromiseLike<T> {
  private promise: Promise<T>

  resolve!: (value: T) => void
  reject!: (reason: any) => void

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
  
  then<V, E = never>(onResolve?: ResolveF<T, V>, onReject?: RejectF<T, E>): PromiseLike<V | E> {
    return this.promise.then(onResolve, onReject)
  }
}