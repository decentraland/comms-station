import { DataPacket_Kind, DisconnectReason, Participant, RemoteParticipant, Room, RoomEvent } from 'livekit-client'
import { Packet } from "@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen"
import { Adapter, AdapterMessage } from './base'


// LiveKitAdapter implements the Adapter interface for island connections via LiveKit.
export class LivekitAdapter extends Adapter {

  private uri: string
  private token: string
  private room?: Room
  private connected = false

  constructor(uri: string) {
    super()

    const url = new URL(uri)
    const token = url.searchParams.get('access_token')!
    url.searchParams.delete('access_token')

    this.uri = uri
    this.token = token
  }

  isConnected() {
    return this.connected
  }

  async connect(): Promise<void> {
    console.log("Connecting to", this.uri)
    this.room = new Room({})

    this.room
      .on(RoomEvent.Connected, () => {
})
      .on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
        this.emitter.emit({ type: 'peer-connected', address: p.identity })
      })
      .on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
        this.emitter.emit({ type: 'peer-disconnected', address: p.identity })
      })
      .on(RoomEvent.Disconnected, (reason: DisconnectReason | undefined) => {
        this.emitter.emit({ type: 'disconnected', kicked: !!reason })
      })
      .on(RoomEvent.DataReceived, (payload: Uint8Array, p?: Participant, _?: DataPacket_Kind) => {
        const { message } = Packet.decode(payload)
        if (! message) return
        
        this.emitter.emit({ type: 'message', address: p?.identity ?? "(unknown)", message })
      })

    await this.room.connect(this.uri, this.token)
    this.connected = true
  }

  async disconnect(): Promise<void> {
    await this.room!.disconnect()
  }

  async send(message: AdapterMessage): Promise<void> {
    const data = Packet.encode({message}).finish()
    
    await this.room!.localParticipant.publishData(data, DataPacket_Kind.RELIABLE)
  }
}
