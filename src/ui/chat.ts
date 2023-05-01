import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { Island } from "../services/archipelago"
import { cloneTemplate, StepView, View } from "./base"


export type ChatRoomEvent = 
  | { type: 'send', text: string }
  | { type: 'teleport', x: number, y: number, island?: string }
  | { type: 'request-profile', address: string }

export class ChatRoomView extends StepView<ChatRoomEvent> {
  $root = cloneTemplate('template-chat-room')

  private stats = {
    nPeers: 0,
    nPings: 0,
    nPongs: 0,
    nMovements: 0,
  }

  constructor() {
    super()
    this.$send.addEventListener('click', this.onSendClick)
    this.$teleport.addEventListener('click', this.onTeleportClick)
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
      chatMessage.events.on('click-sender', () => {
        this.emit({ type: 'request-profile', address: sender })
      })
    }

    this.$log.appendChild(chatMessage.$root)
    this.$log.scrollTo(0, chatMessage.$root.scrollHeight)
  }

  addEmote(sender: string, emoteId: string) {
    this.addMessage(sender, "emote/" + emoteId)
  }

  setIsland(island: Island) {
    this.$island.innerText = island.id
    this.$adapter.innerText = island.adapter
    this.$nPeers.innerText = `${island.peers.length}`
  }

  setPosition(position: Position, island?: string) {
    this.$xInput.value = `${position.x}`
    this.$yInput.value = `${position.y}`
    if (island) this.$islandInput.value = island
  }

  private onSendClick = () => {
    const text = this.$chatInput.value
    
    this.addMessage("You", text)
    this.emit({ type: 'send', text })

    this.$chatInput.value = ""
  }

  private onTeleportClick = () => {
    const x = parseInt(this.$xInput.value)
    const y = parseInt(this.$yInput.value)
    const island = this.$islandInput.value

    this.addMessage("You", `Teleporting to (${x}, ${y})`)
    this.emit({ type: 'teleport', x, y, island })
  }

  private get $island() : HTMLElement { return this.$ref('island') }
  private get $adapter(): HTMLElement { return this.$ref('adapter') }
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
  | { type: 'click-sender', address: string }

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
    this.emit({ type: 'click-sender', address: this.$sender.innerText })
  }

  private get $sender(): HTMLAnchorElement { return this.$ref('sender') }
  private get $text(): HTMLElement { return this.$ref('text') }
}