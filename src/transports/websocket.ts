import { Events } from "../util"
import { Transport, TransportMessage } from "./base"


// LiveKitTransport implements the Transport generic interface on a WebSocket backend.
export abstract class WebSocketTransport<
  Incoming extends TransportMessage, 
  Outgoing extends TransportMessage, 
> extends Transport<Incoming, Outgoing> {

  abstract decode(data: Uint8Array): Incoming
  abstract encode(message: Outgoing): Uint8Array

  // url is a websocket endpoint, the 1st parameter for the WebSocket constructor.
  private url: string

  // protocol is an implementation-decided string, the 2nd paramter for the WebSocket constructor.
  private protocol: string

  // ws is the actual WebSocket instance, using the available impl (initialized in `connect`).
  private ws!: WebSocket
  
  constructor(url: string,protocol: string) {
    super()
    this.url = url
    this.protocol = protocol
  }

  async connect() {
    const ws = new WebSocket(this.url, this.protocol)

    ws.onopen = this.onOpen
    ws.onmessage = this.onMessage
    ws.onerror = this.onError
    ws.onclose = this.onClose
    ws.binaryType = 'arraybuffer'

    this.ws = ws

    await Events.next(this, 'connected')
  }

  disconnect() {
    this.ws?.close()
  }

  send(message: Outgoing) {
    this.ws.send(this.encode(message))
  }

  private onOpen = (_: Event) => {
    this.emit({ $case: 'connected' })
  }

  private onMessage = (ev: MessageEvent) => {
    this.emit({ $case: 'message', message: this.decode(new Uint8Array(ev.data)) })
  }

  private onError = (_: Event) => {
    this.emit({ $case: 'error' }) // fun fact: the ws error event doesn't contain any error info :)
  }

  private onClose = (ev: CloseEvent) => {
    this.emit({ $case: 'disconnected', reason: `${ev.code}: ${ev.reason}` })
  }
}