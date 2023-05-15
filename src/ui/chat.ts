import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { Island } from "../services/archipelago"
import { cloneTemplate, StepView, View } from "./base"


export type ChatRoomEvent = 
  | { $case: 'send', text: string }
  | { $case: 'teleport', x: number, y: number, island?: string }
  | { $case: 'request-profile', address: string }

export class ChatRoomView extends StepView<ChatRoomEvent> {
  $root = cloneTemplate('template-chat-room')

  private stats = {
    nPeers: 0,
    nPings: 0,
    nPongs: 0,
    nMovements: 0,
  }

  private lastPosition?: Position

  constructor() {
    super()
    this.$send.addEventListener('click', this.onSendClick)
    this.$teleport.addEventListener('click', this.onTeleportClick)

    this.$chatInput.addEventListener('keypress', ev => {
      if (ev.key === 'Enter') {
        this.$send.click()
      }
    })
  }

  addPing() {
    this.$nPings.innerText = `${++this.stats.nPings}`
  }

  addPong() {
    this.$nPongs.innerText = `${++this.stats.nPongs}`
  }

  addMovement() {
    this.$nMovements.innerText = `${++this.stats.nMovements}`
  }

  addMessage(sender: string, text: string) {
    const chatMessage = new ChatMessageView()

    chatMessage.setSender(sender)
    chatMessage.setText(text)
    
    if (sender.startsWith('0x')) {
      chatMessage.on('click-sender', () => {
        this.emit({ $case: 'request-profile', address: sender })
      })
    }

    this.$log.appendChild(chatMessage.$root)
    this.$log.scrollTo(0, chatMessage.$root.scrollHeight)
  }

  addEmote(sender: string, emoteId: string) {
    this.addMessage(sender, `* emote/${emoteId} *`)
  }

  setIsland(island: Island) {
    this.$island.innerText = island.id
    this.$transport.innerText = island.transport
    this.$nPeers.innerText = `${island.peers.length}`
  }

  setPosition(position: Position, island?: string) {
    const lastPosition = this.lastPosition

    // Set the position in the UI (and avoid overwriting edits):
    if (!lastPosition || lastPosition.x != position.x || lastPosition.y != position.y) {
      this.$xInput.value = `${position.x}`
      this.$yInput.value = `${position.y}`
      if (island) this.$islandInput.value = island

      this.lastPosition = position
    }
  }

  private onSendClick = () => {
    const text = this.$chatInput.value
    
    this.addMessage("You", text)
    this.emit({ $case: 'send', text })

    this.$chatInput.value = ""
    this.scrollLogToBottom()
  }

  private onTeleportClick = () => {
    const x = parseInt(this.$xInput.value)
    const y = parseInt(this.$yInput.value)
    const island = this.$islandInput.value

    this.addMessage("You", `* Teleporting to (${x}, ${y}) *`)
    this.emit({ $case: 'teleport', x, y, island })

    this.scrollLogToBottom()
  }

  private scrollLogToBottom() {
    if (this.$log.lastChild instanceof HTMLElement) {
      this.$log.lastChild.scrollIntoView()
    }
  }

  private get $island() : HTMLElement { return this.$ref('island') }
  private get $transport(): HTMLElement { return this.$ref('transport') }
  private get $nPeers() : HTMLElement { return this.$ref('npeers') }

  private get $chatInput()  : HTMLInputElement { return this.$ref('chat-input') }
  private get $xInput()     : HTMLInputElement { return this.$ref('x-input') }
  private get $yInput()     : HTMLInputElement { return this.$ref('y-input') }
  private get $islandInput(): HTMLInputElement { return this.$ref('island-input') }

  private get $send()    : HTMLButtonElement { return this.$ref('send') }
  private get $teleport(): HTMLButtonElement { return this.$ref('teleport') }
  
  private get $log()       : HTMLElement { return this.$ref('log') }
  private get $nPings()    : HTMLElement { return this.$ref('npings') }
  private get $nPongs()    : HTMLElement { return this.$ref('npongs') }
  private get $nMovements(): HTMLElement { return this.$ref('nmovements') }
}


type ChatMessageEvent = 
  | { $case: 'click-sender', address: string }

export class ChatMessageView extends View<ChatMessageEvent> {
  $root = cloneTemplate('template-chat-room-message')

  constructor() {
    super()
    this.$sender.addEventListener('click', this.onSenderClick)
  }

  setSender(sender: string) {
    this.$sender.innerText = sender
  }

  setText(text: string) {
    this.$text.innerText = text
  }
  
  private onSenderClick = () => {
    this.emit({ $case: 'click-sender', address: this.$sender.innerText })
  }

  private get $sender(): HTMLAnchorElement { return this.$ref('sender') }
  private get $text(): HTMLElement { return this.$ref('text') }
}