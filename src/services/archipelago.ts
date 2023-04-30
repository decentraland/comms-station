import { AuthIdentity, AuthLink } from "@dcl/crypto"
import { BffAuthenticationServiceDefinition } from "@dcl/protocol/out-ts/decentraland/bff/authentication_service.gen"
import { CommsServiceDefinition } from "@dcl/protocol/out-ts/decentraland/bff/comms_service.gen"
import { RpcClientPort, createRpcClient } from "@dcl/rpc"
import { loadService, RpcClientModule } from "@dcl/rpc/dist/codegen"
import { WebSocketTransport } from "@dcl/rpc/dist/transports/WebSocket"
import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { Heartbeat } from "@dcl/protocol/out-ts/decentraland/bff/comms_director_service.gen"
import { IslandChangedMessage } from "@dcl/protocol/out-ts/decentraland/kernel/comms/v3/archipelago.gen"
import { TsProtoServiceDefinition } from "@dcl/rpc/dist/codegen-types"
import { setOnNextListener } from "../util"

type ArchipelagoSubscription = any

// Peer is a fellow member of an island, identified by an ID. Clients commonly save each peer's
// position and profile in this object as well (to keep things simple, we won't).
export interface Peer {
  id: string
}

// Island is the information provided by Archipelago when assigning us to an island.
export interface Island {
  id: string
  adapter: string
  uri: string
  peers: string[]
}

// Realm is a Decentraland server.
export interface Realm {
  url: string
  serverName: string
  usersCount: number
}

// findRealms uses the lambdas API to fetch a list of public realms:
export async function findRealms() {
  const res = await fetch('https://peer.decentraland.org/lambdas/explore/realms')
  const obj = await res.json()

  return obj as Realm[]
}


// ArchipelagoClient implements the subset of a realm's RPC interface related to comms. It can
// send position reports, and receive island assignments.
export class ArchipelagoClient {
  readonly realm: Realm
  
  private port?: RpcClientPort
  private subs: ArchipelagoSubscription[] = []

  constructor(realm: Realm) {
    this.realm = realm
  }

  async connect(realmUrl: string): Promise<void> {
    const wsUrl = `wss://${realmUrl.split('https://')[1]}/bff/rpc`
    const wsProto = 'bff'
    
    const conn = new WebSocket(wsUrl, wsProto)
    await new Promise((resolve, reject) => {
      conn.onopen = resolve
      conn.onerror = reject
    })

    conn.onerror = (ev: Event) => {
      // TODO
    }

    const rpcClient = await createRpcClient(WebSocketTransport(conn as any))

    this.port = await rpcClient.createPort('demo')
  }

  // requestChallenge obtains a freshly-generated string from Archipelago for us to sign and prove
  // our identity:
  async requestChallenge(address: string): Promise<string> {
    const auth = await this.getService(BffAuthenticationServiceDefinition)

    const msgGetChallengeRequest = { address }
    const msgGetChallengeResponse = await auth.getChallenge(msgGetChallengeRequest)
  
    return msgGetChallengeResponse.challengeToSign
  }

  // respondChallenge sends the authentication chain that includes the signed string, proving that
  // we have the private key:
  async respondChallenge(authChain: AuthLink[]): Promise<Peer> {
    const auth = await this.getService(BffAuthenticationServiceDefinition)

    const msgSignedChallenge = { authChainJson: JSON.stringify(authChain) }
    const msgWelcomePeerInformation = await auth.authenticate(msgSignedChallenge)

    return { id: msgWelcomePeerInformation.peerId }
  }

  // sendHeartbeat sends the current position and desired island assignment. While connected to
  // Archipelago, it should be called about once per second.
  async sendHeartbeat(position: Position, desiredIsland?: string): Promise<void> {
    const comms = await this.getService(CommsServiceDefinition)

    const msgHeartbeat = { position, desiredRoom: desiredIsland }

    await comms.publishToTopic({ 
      topic: 'heartbeat', 
      payload: Heartbeat.encode(msgHeartbeat).finish()
    })
  }

  // addIslandChangedListener will invoke a callback on island assignments from Archipelago:
  async addIslandChangedListener(identity: AuthIdentity, listener: (island: Island) => void) {
    const comms = await this.getService(CommsServiceDefinition)

    const topic = `${identity.ephemeralIdentity.address}.island_changed`

    const sub = await comms.subscribeToSystemMessages({ topic })
    this.subs.push(sub)

    setOnNextListener(comms.getSystemMessages(sub), message => {
      const payload = IslandChangedMessage.decode(message.payload)

      const adapter = payload.connStr.split(":", 1)[0] // e.g. livekit:https://...
      const id = payload.islandId
      const uri = payload.connStr.slice(adapter.length + 1)
      const peers = Object.keys(payload.peers)

      if (adapter !== 'livekit') {
        throw new Error("Only livekit is supported")
      }
      
      // TODO: the `listener` is only accessible from this closure, and thus can't be removed. We
      // rely on cancelling subscriptions for that, but we should keep a list of listeners.
      listener({ id, adapter, uri, peers })
    })
  }

  // removeIslandChangedListeners stops callbacks from being invoked on island assignments:
  async removeIslandChangedListeners() {
    const comms = await this.getService(CommsServiceDefinition)

    await Promise.all(
      this.subs.map(it => comms.unsubscribeToSystemMessages(it))
    )
  }

  private async getService<T extends TsProtoServiceDefinition>(def: T): Promise<RpcClientModule<T>> {
    const api = loadService(this.port!, def)
    await Promise.resolve() // we can't await `loadService`, but a single event loop pass will do
    return api
  }
}
