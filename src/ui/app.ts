import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { Island } from "../services/archipelago"
import { Incoming } from "../services/comms"
import { Realm } from "../services/realms"
import { Events, lastOf } from "../util"
import { View, StepView, cloneTemplate } from "./base"
import { ChatRoomView } from "./chat"
import { ModalView } from "./modal"
import { RequestProfileView } from "./profile"
import {
  AwaitIslandView,
  ConnectionLostView,
  CreateIdentityView,
  DiscoverRealmsView,
  IdentityCreatedView,
  JoinIslandView,
  RequestChallengeView,
  RespondChallengeView,
  SelectRealmView,
  StartHeartbeatView,
  WelcomeView
} from "./steps"


export type AppEvent =
  | { $case: 'send-chat', text: string }
  | { $case: 'request-profile', address: string }
  | { $case: 'teleport', position: Position, island?: string }


export class AppView extends View<AppEvent> {
  $root = cloneTemplate('template-app')

  private requestProfile?: RequestProfileView // non-null when modal is open

  constructor(
    private welcome = new WelcomeView(),
    private discoverRealms = new DiscoverRealmsView(),
    private selectRealm = new SelectRealmView(),
    private createIdentity = new CreateIdentityView(),
    private requestChallenge = new RequestChallengeView(),
    private respondChallenge = new RespondChallengeView(),
    private startHeartbeat = new StartHeartbeatView(),
    private awaitIsland = new AwaitIslandView(),
    private joinIslands = new Array<JoinIslandView>(),
    private chatRooms = new Array<ChatRoomView>()) {
    super()
  }

  async askStart() {
    this.$root.appendChild(this.welcome.$root)
    this.welcome.show()

    await Events.next(this.welcome, 'start')
  }

  async askCreateIdentity() {
    this.$root.appendChild(this.createIdentity.$root)
    this.createIdentity.show()

    await Events.next(this.createIdentity, 'create')
  }

  async askDiscoverRealms() {
    this.$root.appendChild(this.discoverRealms.$root)
    this.discoverRealms.show()

    await Events.next(this.discoverRealms, 'discover')
  }

  async askSelectRealm(realms: Realm[]) {
    this.selectRealm.setRealms(realms)

    this.$root.appendChild(this.selectRealm.$root)
    this.selectRealm.show()

    const { realm } = await Events.next(this.selectRealm, 'select')
    return { realm }
  }

  showConnectionLost() {
    this.getAllViews().forEach(view => view.disable())
    
    const connectionLost = new ConnectionLostView()
    this.$root.appendChild(connectionLost.$root)
    connectionLost.show()
  }

  async askRequestChallenge() {
    this.$root.appendChild(this.requestChallenge.$root)
    this.requestChallenge.show()

    await Events.next(this.requestChallenge, 'request')
  }

  async askRespondChallenge(challenge: string) {
    this.respondChallenge.setChallenge(challenge)

    this.$root.appendChild(this.respondChallenge.$root)
    this.respondChallenge.show()

    await Events.next(this.respondChallenge, 'respond')
  }

  async askStartHeartbat() {
    this.$root.appendChild(this.startHeartbeat.$root)
    this.startHeartbeat.show()

    await Events.next(this.startHeartbeat, 'start')
  }

  showWaitingForIsland() {
    this.$root.appendChild(this.awaitIsland.$root)
    this.awaitIsland.show()
  }

  async askJoinIsland(island: Island) {
    const lastView = lastOf(this.joinIslands)
    const nextView = new JoinIslandView()

    lastView?.disable()
    nextView.setIsland(island)
    this.joinIslands.push(nextView)

    this.$root.appendChild(nextView.$root)
    nextView.show()

    await Events.next(nextView, 'join')
  }

  showChat(island: Island) {
    const lastView = lastOf(this.chatRooms)
    lastView?.disable()

    const nextView = new ChatRoomView()
    this.chatRooms.push(nextView)

    nextView.setIsland(island)
    for (let peer of island.peers) {
      nextView.addMessage(peer, "was already here")
    }
    
    nextView.on('send', ({ text }) => 
      this.emit({ $case: 'send-chat', text })
    )

    nextView.on('teleport', ({ x, y, island }) => 
      this.emit({ $case: 'teleport', position: {x, y, z: 0}, island })
    )

    nextView.on('request-profile', ({ address }) => {
      this.showRequestProfile(address)
    })

    this.$root.appendChild(nextView.$root)
    nextView.show()
  }

  setCreatedAddress(address: string) {
    const identityCreated = new IdentityCreatedView()
    identityCreated.setAddress(address)

    this.$root.appendChild(identityCreated.$root)
    identityCreated.show()
  }

  setPosition(position: Position) {
    lastOf(this.chatRooms)?.setPosition(position)
  }
  
  setRequestedProfile(profile: any) {
    this.requestProfile?.setProfile(profile)
  }

  private showRequestProfile(address: string) {
    this.requestProfile = new RequestProfileView()
    const modal = new ModalView(this.requestProfile)
    
    this.requestProfile.setAddress(address)
    
    this.requestProfile.on('request', _ => {
      this.emit({ $case: 'request-profile', address })
    })

    modal.on('close', _ => {
      modal.$root.remove()
    })

    this.$root.prepend(modal.$root)
  }

  handleMessage(sender: string, msg: Incoming) {
    const chatRoom = lastOf(this.chatRooms)
    if (! chatRoom) return

    switch (msg.$case) {
      case 'chat':
        const content = msg.chat.message

        if (content.startsWith('␑')) {
          chatRoom.addPing()

        } else if (content.startsWith('␆')) {
          chatRoom.addPong()

        } else if (content.startsWith('␐')) {
          chatRoom.addEmote(sender, content.split(' ')[0].slice(1))

        } else {
          chatRoom.addMessage(sender, " : " + content)
        }
        break

      case 'position':
        chatRoom.addMovement()
        break

      default:
        break
    }
  }

  private getAllViews(): StepView<any>[] {
    return [
      this.welcome,
      this.discoverRealms,
      this.selectRealm,
      this.createIdentity,
      this.requestChallenge,
      this.respondChallenge,
      this.startHeartbeat,
      this.awaitIsland,
      ...this.joinIslands,
      ...this.chatRooms
    ]
  }
}