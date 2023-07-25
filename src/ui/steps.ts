import { Island } from "../services/archipelago"
import { Realm } from "../services/realms"
import { View, StepView, cloneTemplate } from "./base"


export type WelcomeEvent = 
  | { $case: 'start' }


export class WelcomeView extends StepView<WelcomeEvent> {
  $root = cloneTemplate('template-welcome')
  
  constructor() {
    super()
    this.$start.addEventListener('click', this.onStartClick)
  }

  private onStartClick = () => {
    this.emit({ $case: 'start' })
    this.disable()
  }

  disable() {
    this.$start.classList.add('disabled')
  }

  private get $start(): HTMLElement { return this.$ref('start') }
}


// -------------------------------------------------------------------------------------------------

export type CreateIdentityEvent = 
  | { $case: 'create' }


export class CreateIdentityView extends StepView<CreateIdentityEvent> {
  $root = cloneTemplate('template-create-identity')

  constructor() {
    super()
    this.$create.addEventListener('click', this.onCreateClick)
  }

  private onCreateClick = () => {
    this.emit({ $case: 'create' })
    this.disable()
  }

  disable() {
    this.$create.classList.add('disabled')
  }

  private get $create(): HTMLElement { return this.$ref('create') }
}


// -------------------------------------------------------------------------------------------------

export class IdentityCreatedView extends StepView<never> {
  $root = cloneTemplate('template-identity-created')

  setAddress(address: string) {
    this.$address.innerText = address
  }

  private get $address(): HTMLElement { return this.$ref('address') }
}


// -------------------------------------------------------------------------------------------------

export class ConnectionLostView extends StepView<never> {
  $root = cloneTemplate('template-connection-lost')
}


// -------------------------------------------------------------------------------------------------

export type DiscoverRealmsEvent = 
  | { $case: 'discover' }


export class DiscoverRealmsView extends StepView<DiscoverRealmsEvent> {
  $root = cloneTemplate('template-discover-realms')

  constructor() {
    super()
    this.$discover.addEventListener('click', this.onDiscoverClick)
  }

  private onDiscoverClick = () => {
    this.emit({ $case: 'discover' })
    this.disable()
  }

  disable() {
    this.$discover.classList.add('disabled')
  }

  private get $discover(): HTMLElement { return this.$ref('discover') }
}


// -------------------------------------------------------------------------------------------------

export type SelectRealmEvent = 
| { $case: 'discover' }
| { $case: 'select', realm: Realm }


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
        this.emit({ $case: 'select', realm })
        this.disable()
      })

      this.$ref('realms').appendChild(row.$root)
    }
  }

  disable() {
    this.queryAll('button').forEach($btn => $btn.classList.add('disabled'))
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
  | { $case: 'request' }


export class RequestChallengeView extends StepView<RequestChallengeEvent> {
  $root = cloneTemplate('template-request-challenge')

  constructor() {
    super()
    this.$request.addEventListener('click', this.onRequestClick)
  }

  private onRequestClick = () => {
    this.emit({ $case: 'request' })
    this.disable()
  }

  disable() {
    this.$request.classList.add('disabled')
  }

  private get $request(): HTMLElement { return this.$ref('request') }
}

// -------------------------------------------------------------------------------------------------


export type RespondChallengeEvent = 
  | { $case: 'respond' }


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
    this.emit({ $case: 'respond' })
    this.disable()
  }

  disable() {
    this.$respond.classList.add('disabled')
  }

  private get $respond(): HTMLElement { return this.$ref('respond') }
  private get $challenge(): HTMLElement { return this.$ref('challenge') }
}

// -------------------------------------------------------------------------------------------------


export type StartHeartbeatEvent = 
  | { $case: 'start' }

export class StartHeartbeatView extends StepView<StartHeartbeatEvent> {
  $root = cloneTemplate('template-start-heartbeat')
  constructor() {
    super()
    this.$start.addEventListener('click', this.onStartClick)
  }

  private onStartClick = () => {
    this.emit({ $case: 'start' })
    this.disable()
  }

  disable() {
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
  | { $case: 'join' }


export class JoinIslandView extends StepView<JoinIslandEvent> {
  $root = cloneTemplate('template-join-island')
  
  constructor() {
    super()
    this.$join.addEventListener('click', this.onJoinClick)
  }

  setIsland(island: Island) {
    this.$island.innerText = island.id
    this.$transport.innerText = island.transport
    this.$uri.innerText = this.formatUri(island.uri)
  }

  private formatUri(uri: string) {
    const url = new URL(uri)
    return `${url.origin}${url.pathname}`
  }

  private onJoinClick = () => {
    this.emit({ $case: 'join' })
    this.disable()
  }

  private get $uri() : HTMLElement { return this.$ref('uri') }
  private get $island() : HTMLElement { return this.$ref('island') }
  private get $transport(): HTMLElement { return this.$ref('transport') }
  private get $join(): HTMLElement { return this.$ref('join') }
}

