import { Emitter } from "../util/emitter"

export type TransportMessage = { $case: string }

export type TransportEvent<Incoming extends TransportMessage> =
  | { type: 'connected', peer?: string }
  | { type: 'message', peer?: string, message: Incoming }
  | { type: 'disconnected', peer?: string, reason?: string }
  | { type: 'error', error?: Error }


type MessageEvent<M extends TransportMessage, T extends M['$case']> = { 
  type: 'message',
  peer?: string,
  message: Extract<M, {$case: T}>
}

export abstract class Transport<
  Incoming extends TransportMessage, 
  Outgoing extends TransportMessage,
> extends Emitter<TransportEvent<Incoming>> {

  abstract connect(): Promise<void>

  abstract send(message: Outgoing): void

  abstract disconnect(): void

  async nextCase<C extends Incoming['$case']>($case: C): Promise<MessageEvent<Incoming, C>> {
    const next = await this.streamCase($case).next()
    return next.value!
  }

  async* streamCase<C extends Incoming['$case']>($case: C) {
    for await (let ev of this.stream('message')) {
      if (ev.message.$case == $case) yield ev as MessageEvent<Incoming, C>
    }
  }

  // TODO:
  // Override `Emitter.next` to reject promises on disconnection, since we know there won't be
  // any more events after that. Adjust nextCase and streamCase methods accordingly.
}

