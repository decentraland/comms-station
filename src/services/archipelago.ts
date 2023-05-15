import { AuthLink } from "@dcl/crypto"
import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { ClientPacket, ServerPacket } from "@dcl/protocol/out-ts/decentraland/kernel/comms/v3/archipelago.gen"
import { Realm } from "./realms"
import { TransportEvent, WebSocketTransport } from "../transports"
import { Emitter } from "../util/emitter"

type Incoming = NonNullable<ServerPacket['message']>
type Outgoing = NonNullable<ClientPacket['message']>


// Island is the information provided by Archipelago to hvae us join a group of nearby players.
export interface Island {
  id: string
  transport: string
  uri: string
  peers: string[]
}

// Peer is a fellow member of an island, identified by an ID. Clients commonly save each peer's
// position and profile in this object as well (to keep things simple, we won't).
export interface Peer {
  id: string
}


// ArchipelagoEvent is the type of events emitted by the ArchipelagoClient.
type ArchipelagoEvent =
  | { $case: 'connected' }
  | { $case: 'island_changed', island: Island }
  | { $case: 'disconnected' }


  // ArchipelagoClient implements the Archipelago protocol, its messages and flows.
export class ArchipelagoClient extends Emitter<ArchipelagoEvent> {
  private transport: ArchipelagoTransport

  constructor(realm: Realm) {
    super()
    this.transport = new ArchipelagoTransport(realm)
    this.transport.on('*', this.onTransportMessage)
  }

  async connect(): Promise<void> {
    await this.transport.connect()
  }

  // requestChallenge obtains a freshly-generated string from Archipelago for us to sign and prove
  // our identity.
  async requestChallenge(address: string): Promise<string> {
    this.transport.send({
      $case: 'challengeRequest', 
      challengeRequest: { address }
    })
    
    const { challengeResponse } = (await this.transport.receive('challengeResponse')).message

    return challengeResponse.challengeToSign
  }

  // respondChallenge sends the authentication chain that includes the signed string, proving that
  // we have the private key.
  async respondChallenge(authChain: AuthLink[]): Promise<Peer> {
    this.transport.send({
      $case: 'signedChallenge', 
      signedChallenge: { authChainJson: JSON.stringify(authChain) }
    })

    const { welcome } = (await this.transport.receive('welcome')).message

    return { id: welcome.peerId }
  }

  // sendHeartbeat sends the current position and desired island assignment. While connected to
  // Archipelago, it should be called about once per second.
  async sendHeartbeat(position: Position, desiredIsland?: string): Promise<void> {
    this.transport.send({ 
      $case: 'heartbeat', 
      heartbeat: { position, desiredRoom: desiredIsland }
    })
  }

  // onTransportMessage is attached to our transport in order to handle and re-emit relevant events.
  private onTransportMessage = (ev: TransportEvent<Incoming>) => {
    if (ev.$case == 'connected') {
      this.emit({ $case: 'connected' })

    } else if (ev.$case == 'disconnected') {
      this.emit({ $case: 'disconnected' })

    } else if (ev.$case == 'message' && ev.message.$case == 'islandChanged') {
      const info = ev.message.islandChanged

      const transport = info.connStr.split(":", 1)[0] // e.g. livekit:https://...
      const uri = info.connStr.slice(transport.length + 1)
      const id = info.islandId
      const peers = Object.keys(info.peers)

      this.emit({ $case: 'island_changed', island: { id, transport, uri, peers } })
    }
  }
}


// ArchipelagoTransport is a WebSocketTransport implementing the Archipelago protocol.
class ArchipelagoTransport extends WebSocketTransport<Incoming, Outgoing> {
  constructor(realm: Realm) {
    const wsUrl = `${realm.url.replace(/^http/, 'ws')}/archipelago/ws`
    const wsProto = 'archipelago'
    
    super(wsUrl, wsProto)
  }

  decode(data: Uint8Array): Incoming {
    return ServerPacket.decode(data).message!
  }

  encode(message: Outgoing): Uint8Array {
    return ClientPacket.encode({ message }).finish()
  }
}
