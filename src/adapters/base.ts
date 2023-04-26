import * as comms from '@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen'
import { Emitter } from '../util'


// AdapterMessage is the content of the `message` field in a comms `Packet`.
export type AdapterMessage = NonNullable<comms.Packet['message']>


// AdapterEvent is an event emitted by `Adapter.events`.
export type AdapterEvent =
| { type: 'disconnected', kicked: boolean, error?: Error }
| { type: 'peer-connected', address: string }
| { type: 'peer-disconnected', address: string }
| { type: 'message', address: string, message: AdapterMessage }
| { type: 'error', error: Error }


// Adapter can connect to an island and exchange messages, using an appropriate URI. This class
// is based on the MinimumCommunicationsAdapter interface described in ADR-81.
export abstract class Adapter {
  protected emitter: Emitter<AdapterEvent>
  events: Omit<Emitter<AdapterEvent>, 'emit'>

  constructor() {
    this.emitter = new Emitter<AdapterEvent>()
    this.events = this.emitter
  }

  // Child classes must provide the following methods:
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract isConnected(): boolean
  protected abstract send(message: AdapterMessage): Promise<void>

  async sendPosition(position: comms.Position) {
    await this.send({ $case: 'position', position })
  }

  async sendChat(chat: comms.Chat) {
    await this.send({ $case: 'chat', chat })
  }

  async sendProfileVersion(profileVersion: comms.AnnounceProfileVersion) {
    await this.send({ $case: 'profileVersion', profileVersion })
  }

  async sendProfileRequest(profileRequest: comms.ProfileRequest) {
    await this.send({ $case: 'profileRequest', profileRequest })
  }

  async sendProfileResponse(profileResponse: comms.ProfileResponse) {
    await this.send({ $case: 'profileResponse', profileResponse })
  }
  
}
