import './style.css'

import { Authenticator } from '@dcl/crypto'
import { Position } from '@dcl/protocol/out-ts/decentraland/common/vectors.gen'
import { ArchipelagoClient } from './services/archipelago'
import { CommsTransport, LiveKitCommsTransport } from './services/comms'
import { findRealms } from './services/realms'
import { AppView } from './ui/app'
import { createDisposableIdentity, setAsyncInterval as setAwaitedInterval } from './util'

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
  const app = new AppView()
  document.getElementById('container')!.appendChild(app.$root)

  // Show the welcome box and wait for the user to click START.
  await app.askStart()

  // Show an explanation of how identities work and wait for the user to click CREATE.
  await app.askCreateIdentity()

  // Create a fresh `identity` (i.e. a private/public key pair) for use during this session. We 
  // immediately extract the address, which is safe to pass around, and keep the only reference to
  // the `identity` inside this function. This is good practice when dealing with private keys.
  const identity = await createDisposableIdentity()
  const address = identity.ephemeralIdentity.address

  app.setCreatedAddress(address)

  // Show an explanation of how realms work and wait for the user to click DISCOVER:
  await app.askDiscoverRealms()

  // Query the lambda API for a list of active realms:
  const allRealms = await findRealms()

  // Show the list, and ask the user to SELECT one:
  const { realm } = await app.askSelectRealm(allRealms)
  
  // Initialize the Archipelago client and connect to the realm's RPC interface:
  const archipelagoClient = new ArchipelagoClient(realm)
  await archipelagoClient.connect()

  // Show an explanation of how auth starts, and wait for the user to click REQUEST CHALLENGE:
  /*await*/ app.askRequestChallenge()

  // Begin the authentication flow by requesting a challenge from Archipelago:
  const challengeToSign = await archipelagoClient.requestChallenge(address)

  // Show an explanation of how auth finishes, and wait for the user to click RESPOND CHALLENGE:
  /*await*/ app.askRespondChallenge(challengeToSign)

  // Sign the challenge string using the private key in our `identity`:
  const authChain = await Authenticator.signPayload(identity, challengeToSign)
  await archipelagoClient.respondChallenge(authChain)

  // Show an explanation of the heartbeat timer, and wait for the user to click START HEARTBEAT:
  await app.askStartHeartbat()

  // Show a box while we add our listeners and wait for an island assignment, explaining the delay:
  app.showWaitingForIsland()

  let transport!: CommsTransport
  let wantedPosition: Position = {x: 1, y: 0, z: 0} // an initial position, user can TELEPORT later
  let wantedIsland: string | undefined // the island assignment we'll specifically request, if any

  // Start listening for island assignments from Archipelago, switch adapters as we receive them:
  await archipelagoClient.on('island_changed', async (ev) => {
    const { island } = ev // TODO: only LiveKit is supported right now

    app.events.offAll() // TODO be specific, this is a footgun
    
    // Disconnect the previous adapter, if we had one:
    if (transport) {
      transport.offAll()
      transport.disconnect()
    }

    // Show information about the island and wait for the user to click JOIN:
    await app.askJoinIsland(island)

    // Create the new adapter (it won't connect automatically):
    transport = new LiveKitCommsTransport(island.uri)

    // Attach listeners for all relevant events:
    transport
      .on('message', ev => { app.handleMessage(ev.peer ?? "", ev.message) })
      .on('disconnected', console.log)
      .on('connected', console.log)

    // Connect the adapter:
    await transport.connect()

    // Listen for chat messages coming from the UI, and send then through the adapter:
    app.events.on('send-chat', ev => {
      transport.send({ $case: 'chat', chat: {message: ev.text, timestamp: Date.now()} })
      // transport.sendChat({ message: ev.text, timestamp: Date.now() })
    })

    // Listen for teleport requests coming from the UI, and update our heartbeat report:
    app.events.on('teleport', ev => {
      wantedPosition = ev.position
      wantedIsland = ev.island
    })

    // Listen for address inspection requests coming from the UI, and request profiles:
    app.events.on('request-profile', async ({ address }) => {
      transport.send({ $case: 'profileRequest', profileRequest: {address, profileVersion: 0} }) // TODO explain 0

      for await (let ev of transport.streamCase('profileResponse')) {
        if (ev.peer === address) {
          app.setRequestedProfile(JSON.parse(ev.message.profileResponse.serializedProfile))
          break
        }
      }
    })

    // Show the chat box, and update the current position in the UI:
    app.showChat(island)
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