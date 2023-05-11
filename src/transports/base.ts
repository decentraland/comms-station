import { Emitter, Events } from "../util"

export type TransportMessage = { $case: string }

// TODO:
// I don't like using the same $case for our connection/disconnection events and those of our peers.
// This was one simplification too many. Ideally, the Event type should be extensible for subclasses
// of Transport, but I couldn't get the type system to do that (I ended up with a disjointed union
// where `T['$case']` is `never`).

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

// Transport is a generic interface for a real-time communications protocol client.
export abstract class Transport<
  Incoming extends TransportMessage, 
  Outgoing extends TransportMessage,
> extends Emitter<TransportEvent<Incoming>> {

  // connect establishes a connection and performs any initial handshake.
  abstract connect(): Promise<void>

  // send writes a message through the transport.
  abstract send(message: Outgoing): void

  // disconnect breaks the connection (not immediately).
  abstract disconnect(): void

  // receive returns a Promise for the next message of a given $case.
  async receive<C extends Incoming['$case']>($case: C): Promise<MessageEvent<Incoming, C>> {
    return (await this.receiveMany($case).next()).value!
  }

   // TODO: rename this
   // receiveMany returns an AsyncGenerator for future messages of a given $case.
  async* receiveMany<C extends Incoming['$case']>($case: C) {
    for await (let ev of Events.stream(this, 'message')) {
      if (ev.message.$case == $case) yield ev as MessageEvent<Incoming, C>
    }
  }

  // TODO:
  // Override `Emitter.next` to reject promises on disconnection, since we know there won't be
  // any more events after that. Adjust nextCase and streamCase methods accordingly.
}

