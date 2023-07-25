import { Room, RoomEvent, DataPacket_Kind, DisconnectReason, RemoteParticipant, Participant } from "livekit-client"
import { TransportMessage, Transport } from "./base"


// LiveKitTransport implements the Transport generic interface on a LiveKit backend.
export abstract class LiveKitTransport<
  Incoming extends TransportMessage, 
  Outgoing extends TransportMessage, 
> extends Transport<Incoming, Outgoing> {
  
  // url is the room-specific address of a LiveKit room.
  protected readonly url: string

  // token is the pre-authorized string we need to be allowed in.
  protected readonly token: string

  // room is the LiveKit SDK object to send/receive events (initialized in `connect`).
  protected room?: Room

  abstract decode(data: Uint8Array): Incoming
  abstract encode(message: Outgoing): Uint8Array

  constructor(uri: string) {
    super()
    
    const url = new URL(uri)
    const token = url.searchParams.get('access_token')!
    url.searchParams.delete('access_token')

    this.url = url.toString()
    this.token = token
  }

  async connect(): Promise<void> {
    console.log("Connecting to", this.url)
    this.room = new Room({})

    this.room
      .on(RoomEvent.Connected, this.onConnected)
      .on(RoomEvent.Disconnected, this.onDisconnected)
      .on(RoomEvent.ParticipantConnected, this.onParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, this.onParticipantDisconnected)
      .on(RoomEvent.DataReceived, this.onDataReceived)
      
    await this.room.connect(this.url, this.token)
  }

  async send(message: Outgoing): Promise<void> {
    await this.room!.localParticipant.publishData(this.encode(message), DataPacket_Kind.RELIABLE)
  }
  
  disconnect() {
    this.room?.disconnect()
  }

  private onConnected = () => {
    this.emit({ $case: 'connected' })
  }

  private onDisconnected = (reason?: DisconnectReason) => {
    this.emit({ $case: 'disconnected', reason: `${reason}` })
  }

  private onParticipantConnected = (p: RemoteParticipant) => {
    this.emit({ $case: 'connected', peer: p.identity })
  }

  private onParticipantDisconnected = (p: RemoteParticipant) => {
    this.emit({ $case: 'disconnected', peer: p.identity })
  }

  private onDataReceived = (payload: Uint8Array, p?: Participant, _?: DataPacket_Kind) => {
    this.emit({ $case: 'message', peer: p?.identity, message: this.decode(payload) })
  }
}

  