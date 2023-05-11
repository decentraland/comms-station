import { Emitter, Events } from "../util"

export type TransportMessage = { $case: string }

export type TransportEvent<Incoming extends TransportMessage> =
  | { $case: 'connected', peer?: string }                     // we or a peer just connected
  | { $case: 'message', peer?: string, message: Incoming }    // the server or a peer sent a message
  | { $case: 'disconnected', peer?: string, reason?: string } // we or a peer just disconnected
  | { $case: 'error', error?: Error }                         // an error occured (sorry)


// MessageEvent is a utility type to simplify definitions below.
type MessageEvent<M extends TransportMessage, T extends M['$case']> = { 
  $case: 'message',
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

  async receiveOne<C extends Incoming['$case']>($case: C): Promise<MessageEvent<Incoming, C>> {
    return (await this.receive($case).next()).value!
  }

  async* receive<C extends Incoming['$case']>($case: C) {
    for await (let ev of Events.stream(this, 'message')) {
      if (ev.message.$case == $case) yield ev as MessageEvent<Incoming, C>
    }
  }

  // TODO:
  // Override `Emitter.next` to reject promises on disconnection, since we know there won't be
  // any more events after that. Adjust nextCase and streamCase methods accordingly.
}

