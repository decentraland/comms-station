import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { Island, Realm } from "../services/archipelago"
import { AppEvent } from "../util"
import { View, cloneTemplate } from "./base"


abstract class StepView<E extends AppEvent> extends View<E> {
  show() {
    this.$root.style.display = 'block'
    setTimeout(() => this.$root.style.opacity = '1', 1)
    document.querySelector('#end')!.scrollIntoView({ block: 'end' }) // TODO this is a hack
  }

  disable() {}
}


// -------------------------------------------------------------------------------------------------

export type WelcomeEvent = 
  | { type: 'start' }


export class WelcomeView extends StepView<WelcomeEvent> {
  $root = cloneTemplate('template-welcome')
  
  constructor() {
    super()
    this.$start.addEventListener('click', this.onStartClick)
  }

  private onStartClick = () => {
    this.emit({ type: 'start' })
    this.$start.classList.add('disabled')
  }

  private get $start(): HTMLElement { return this.$ref('start') }
}


// -------------------------------------------------------------------------------------------------

export type CreateIdentityEvent = 
  | { type: 'create' }


export class CreateIdentityView extends StepView<CreateIdentityEvent> {
  $root = cloneTemplate('template-create-identity')

  constructor() {
    super()
    this.$create.addEventListener('click', this.onCreateClick)
  }

  private onCreateClick = () => {
    this.emit({ type: 'create' })
    this.$create.classList.add('disabled')
  }

  private get $create(): HTMLElement { return this.$ref('create') }
}


// -------------------------------------------------------------------------------------------------

export type DiscoverRealmsEvent = 
  | { type: 'discover' }


export class DiscoverRealmsView extends StepView<DiscoverRealmsEvent> {
  $root = cloneTemplate('template-discover-realms')

  constructor() {
    super()
    this.$discover.addEventListener('click', this.onDiscoverClick)
  }

  private onDiscoverClick = () => {
    this.emit({ type: 'discover' })
    this.$discover.classList.add('disabled')
  }

  private get $discover(): HTMLElement { return this.$ref('discover') }
}


// -------------------------------------------------------------------------------------------------

export type SelectRealmEvent = 
| { type: 'discover' }
| { type: 'select', realm: Realm }


export class SelectRealmView extends StepView<SelectRealmEvent> {
  $root = cloneTemplate('template-select-realm')

  setRealms(realms: Realm[]) {
    const sortedRealms = [...realms]
    sortedRealms.sort((a, b) => b.usersCount - a.usersCount)

    for (let realm of sortedRealms) {
      const row = new SelectRealmRowView()
      
      row.$name.innerText = realm.serverName
      row.$url.innerText = realm.url
      row.$users.innerText = `${realm.usersCount}`

      row.$connect.addEventListener('click', _ => {
        this.emit({ type: 'select', realm })
        this.queryAll('button').forEach($btn => $btn.classList.add('disabled'))
      })

      this.$ref('realms').appendChild(row.$root)
    }
  }
}

class SelectRealmRowView extends View {
  $root = cloneTemplate('template-select-realm-row')

  get $name() : HTMLElement { return this.$ref('name') }
  get $url()  : HTMLElement { return this.$ref('url') }
  get $users(): HTMLElement { return this.$ref('users') }

  get $connect(): HTMLButtonElement { return this.$ref('connect') }
}

// -------------------------------------------------------------------------------------------------

type RequestChallengeEvent = 
  | { type: 'request' }


export class RequestChallengeView extends StepView<RequestChallengeEvent> {
  $root = cloneTemplate('template-request-challenge')

  constructor() {
    super()
    this.$request.addEventListener('click', this.onRequestClick)
  }

  private onRequestClick = () => {
    this.emit({ type: 'request' })
    this.$request.classList.add('disabled')
  }

  private get $request(): HTMLElement { return this.$ref('request') }
}

// -------------------------------------------------------------------------------------------------


export type RespondChallengeEvent = 
  | { type: 'respond' }


export class RespondChallengeView extends StepView<RespondChallengeEvent> {
  $root = cloneTemplate('template-respond-challenge')

  constructor() {
    super()
    this.$respond.addEventListener('click', this.onRequestClick)
  }

  setChallenge(challenge: string) {
    this.$challenge.innerText = challenge
  }

  private onRequestClick = () => {
    this.emit({ type: 'respond' })
    this.$respond.classList.add('disabled')
  }

  private get $respond(): HTMLElement { return this.$ref('respond') }
  private get $challenge(): HTMLElement { return this.$ref('challenge') }
}

// -------------------------------------------------------------------------------------------------


export type StartHeartbeatEvent = 
  | { type: 'start' }

export class StartHeartbeatView extends StepView<StartHeartbeatEvent> {
  $root = cloneTemplate('template-start-heartbeat')
  constructor() {
    super()
    this.$start.addEventListener('click', this.onStartClick)
  }

  private onStartClick = () => {
    this.emit({ type: 'start' })
    this.$start.classList.add('disabled')
  }

  private get $start(): HTMLElement { return this.$ref('start') }
}


// -------------------------------------------------------------------------------------------------

export class AwaitIslandView extends StepView<RespondChallengeEvent> {
  $root = cloneTemplate('template-await-island')
}


// -------------------------------------------------------------------------------------------------

export type JoinIslandEvent = 
  | { type: 'join' }


export class JoinIslandView extends StepView<JoinIslandEvent> {
  $root = cloneTemplate('template-join-island')
  
  constructor() {
    super()
    this.$join.addEventListener('click', this.onJoinClick)
  }

  setIsland(island: Island) {
    this.$island.innerText = island.id
    this.$adapter.innerText = island.adapter
    this.$uri.innerText = this.formatUri(island.uri)
  }

  private formatUri(uri: string) {
    const url = new URL(uri)
    return `${url.origin}${url.pathname}`
  }

  private onJoinClick = () => {
    this.emit({ type: 'join' })
  }

  private get $uri() : HTMLElement { return this.$ref('uri') }
  private get $island() : HTMLElement { return this.$ref('island') }
  private get $adapter(): HTMLElement { return this.$ref('adapter') }
  private get $join(): HTMLElement { return this.$ref('join') }
}


// -------------------------------------------------------------------------------------------------

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
    chatMessage.events.on('click-sender', () => this.emit({ type: 'request-profile', address: sender }))

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