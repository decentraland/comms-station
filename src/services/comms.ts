import * as comms from '@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen'
import { LiveKitTransport } from '../transports/livekit'
import { Transport, TransportEvent } from '../util'


// IncomingMessage and OutgoingMessage are the comms messages defined in the protocol layer.
export type Outgoing = NonNullable<comms.Packet['message']>
export type Incoming = NonNullable<comms.Packet['message']>


// CommsTransport is a Transport that implements the comms protocol.
export type CommsTransport = Transport<Incoming, Outgoing>

// CommsTransportEvent is a TransportEvent for the comms protocol.
export type CommsTransportEvent = TransportEvent<Incoming>

// LiveKitTransport is a CommsTransport that implements the comms protocol over LiveKit.
export class LiveKitCommsTransport extends LiveKitTransport<Incoming, Outgoing> implements CommsTransport {

  encode(message: Outgoing): Uint8Array {
    return comms.Packet.encode({ message }).finish()
  }

  decode(data: Uint8Array): Incoming {
    return comms.Packet.decode(data).message!
  }
}
