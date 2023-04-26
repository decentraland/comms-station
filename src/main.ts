import './style.css'

import { createDisposableIdentity } from './util/identity'
import { findRealms, ArchipelagoClient } from './services/archipelago'
import { Authenticator } from '@dcl/crypto'
import { LivekitAdapter } from './adapters/livekit'
import { Adapter } from './adapters/base'
import { setAsyncInterval as setAwaitedInterval } from './util'
import { AppView } from './ui/app'
import { Position } from '@dcl/protocol/out-ts/decentraland/common/vectors.gen'

// Welcome!
//
// This app demonstrates how to use the Decentraland comms system by operating it manually, using
// a web UI that guides you through the sequence of steps required to discover, authenticate and use
// the APIs of a comms server.
//
// The `start` method below closely matches the behavior you'll see on the UI. Run `npx vite` and 
// open the printed URL in your browser to have them side by side, and see how each step is
// implemented in actual code.


// start inserts `AppView` into the DOM and takes the user through a series of steps, each running
// some background code and then awaiting a promise from the UI to continue.
async function start() {
  console.log("Initializing interface")
  const app = new AppView()
  document.getElementById('app')!.appendChild(app.$root)

  // Show the welcome box and wait for the user to click START.
  await app.askStart()

  // Show an explanation of how identities work and wait for the user to click CREATE.
  await app.askCreateIdentity()

  // Create a fresh `identity` (i.e. a private/public key pair) for use during this session. We 
  // immediately extract the address, which is safe to pass around, and keep the only reference to
  // the `identity` inside this function. This is good practice when dealing with private keys.
  const identity = await createDisposableIdentity()
  const address = identity.ephemeralIdentity.address

  // Show an explanation of how realms work and wait for the user to click DISCOVER:
  await app.askDiscoverRealms()

  // Query the lambda API for a list of active realms:
  const allRealms = await findRealms()

  // Show the list, and ask the user to SELECT one:
  const { realm } = await app.askSelectRealm(allRealms)
  
  // Initialize the Archipelago client and connect to the realm's RPC interface:
  const archipelagoClient = new ArchipelagoClient(realm)
  await archipelagoClient.connect(realm.url)

  // Show an explanation of how auth starts, and wait for the user to click REQUEST CHALLENGE:
  await app.askRequestChallenge()

  // Begin the authentication flow by requesting a challenge from Archipelago:
  const challengeToSign = await archipelagoClient.requestChallenge(address)

  // Show an explanation of how auth finishes, and wait for the user to click RESPOND CHALLENGE:
  await app.askRespondChallenge(challengeToSign)

  // Sign the challenge string using the private key in our `identity`:
  const authChain = await Authenticator.signPayload(identity, challengeToSign)

  const selfInfo = await archipelagoClient.respondChallenge(authChain)
  console.log("Welcome as peer", selfInfo)

  // Show an explanation of the heartbeat timer, and wait for the user to click START HEARTBEAT:
  await app.askStartHeartbat()

  // Show a box while we add our listeners and wait for an island assignment, explaining the delay:
  app.showWaitingForIsland()

  let adapter!: Adapter
  let wantedPosition: Position = {x: 1, y: 0, z: 0} // an initial position, user can TELEPORT later
  let wantedIsland: string | undefined // the island assignment we'll specifically request, if any

  // Start listening for island assignments from Archipelago, switch adapters as we receive them:
  await archipelagoClient.addIslandChangedListener(identity, async (island) => {
    // TODO: only LiveKit is supported right now

    // Disconnect the previous adapter, if we had one:
    if (adapter) {
      adapter.events.offAll()
      adapter.disconnect()
    }
    // Show information about the island and wait for the user to click JOIN:
    await app.askJoinIsland(island)

    // Create the new adapter (it won't connect automatically):
    adapter = new LivekitAdapter(island.uri)

    // Attach listeners for all relevant events:
    adapter.events
      .on('message', ev => { app.handleMessage(ev.address, ev.message) })
      .on('peer-disconnected', console.log)
      .on('peer-connected', console.log)
      .on('disconnected', console.log)

    // Connect the adapter:
    await adapter.connect()

    // Listen for chat messages coming from the UI, and send then through the adapter:
    app.events.on('send-chat', ev => {
      adapter.sendChat({ message: ev.text, timestamp: Date.now() })
    })

    // Listen for teleport requests coming from the UI, and update our heartbeat report:
    app.events.on('teleport', ev => {
      wantedPosition = ev.position
      wantedIsland = ev.island
    })

    // Show the chat box, and update the current position in the UI:
    app.showChat()
    app.setPosition(wantedPosition)
  })

  // Start the heartbeat, reporting and updating the position in the UI periodically:
  setAwaitedInterval(
    async () => {
      app.setPosition(wantedPosition)
      await archipelagoClient.sendHeartbeat(wantedPosition, wantedIsland)
    }, 
    1000
  )
}

start()