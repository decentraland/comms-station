import { Position } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"
import { AdapterMessage } from "../adapters/base"
import { Island, Realm } from "../services/archipelago"
import { lastOf } from "../util"
import { View, cloneTemplate } from "./base"
import {
  AwaitIslandView,
  CreateIdentityView,
  DiscoverRealmsView,
  JoinIslandView,
  RequestChallengeView,
  RespondChallengeView,
  SelectRealmView,
  StartHeartbeatView,
  WelcomeView
} from "./steps"
import { RequestProfileView } from "./profile"
import { ModalView } from "./modal"
import { ChatRoomView } from "./chat"


export type AppEvent =
  | { type: 'send-chat', text: string }
  | { type: 'request-profile', address: string }
  | { type: 'teleport', position: Position, island?: string }


export class AppView extends View<AppEvent> {
  $root = cloneTemplate('template-app')

  private lastPosition?: Position
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

    await this.welcome.events.next('start')
  }

  async askCreateIdentity() {
    this.$root.appendChild(this.createIdentity.$root)
    this.createIdentity.show()

    await this.createIdentity.events.next('create')
  }

  async askDiscoverRealms() {
    this.$root.appendChild(this.discoverRealms.$root)
    this.discoverRealms.show()

    await this.discoverRealms.events.next('discover')
  }

  async askSelectRealm(realms: Realm[]) {
    this.selectRealm.setRealms(realms)

    this.$root.appendChild(this.selectRealm.$root)
    this.selectRealm.show()

    const { realm } = await this.selectRealm.events.next('select')
    return { realm }
  }

  async askRequestChallenge() {
    this.$root.appendChild(this.requestChallenge.$root)
    this.requestChallenge.show()

    await this.requestChallenge.events.next('request')
  }

  async askRespondChallenge(challenge: string) {
    this.respondChallenge.setChallenge(challenge)

    this.$root.appendChild(this.respondChallenge.$root)
    this.respondChallenge.show()

    await this.respondChallenge.events.next('respond')
  }

  async askStartHeartbat() {
    this.$root.appendChild(this.startHeartbeat.$root)
    this.startHeartbeat.show()

    await this.startHeartbeat.events.next('start')
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

    await nextView.events.next('join')
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
    
    nextView.events.on('send', ({ text }) => 
      this.emit({ type: 'send-chat', text })
    )

    nextView.events.on('teleport', ({ x, y, island }) => 
      this.emit({ type: 'teleport', position: {x, y, z: 0}, island })
    )

    nextView.events.on('request-profile', ({ address }) => {
      this.showRequestProfile(address)
    })

    this.$root.appendChild(nextView.$root)
    nextView.show()
  }

  setPosition(position: Position) {
    const lastPosition = this.lastPosition
    
    if (!lastPosition || lastPosition.x != position.x || lastPosition.y != position.y) {
      this.lastPosition = position
      lastOf(this.chatRooms)?.setPosition(position)
    }
  }
  
  setRequestedProfile(profile: any) {
    this.requestProfile?.setProfile(profile)
  }

  private showRequestProfile(address: string) {
    this.requestProfile = new RequestProfileView()
    const modal = new ModalView(this.requestProfile)
    
    this.requestProfile.setAddress(address)
    
    this.requestProfile.events.on('request', ev => {
      this.emit({ type: 'request-profile', address })
    })

    modal.events.on('close', ev => {
      modal.$root.remove()
    })

    this.$root.prepend(modal.$root)
  }

  handleMessage(sender: string, msg: AdapterMessage) {
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
}