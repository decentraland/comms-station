import './style.css'

import { Position } from '@dcl/protocol/out-ts/decentraland/common/vectors.gen'
import { CommsTransport, LiveKitCommsTransport } from './services/comms'
import { findRealms } from './services/realms'
import { AppView } from './ui/app'
import { createDisposableIdentity, setAsyncInterval as setAwaitedInterval } from './util'
import { signedFetch } from './util/signed-fetch'
import ReactDOM from 'react-dom/client'
import React from 'react'
import App from './App'

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

  // Create a fresh `identity` (i.e. a private/public key pair) for use during this session. We
  // immediately extract the address, which is safe to pass around, and keep the only reference to
  // the `identity` inside this function. This is good practice when dealing with private keys.
  const identity = await createDisposableIdentity()
  const address = identity.ephemeralIdentity.address

  app.setCreatedAddress(address)

  // Query the lambda API for a list of active realms:
  const allRealms = await findRealms()

  // Show the list, and ask the user to SELECT one:
  const { realm } = await app.askSelectRealm(allRealms)

  // Initialize the Archipelago client, attach some listeners and connect to the realm's interface:

  let wantedPosition: Position = {x: 1, y: 0, z: 0} // an initial position, user can TELEPORT later

  const aboutResponse: { comms: { adapter: string } } = await (await fetch(realm.url + 'about')).json()
  const signedFetchUrl = aboutResponse.comms.adapter.replace(/fixed-adapter:/, '').replace(/signed-login:/, '')

  const response: { fixedAdapter: string } = await (await signedFetch(
    signedFetchUrl,
    identity,
    { method: 'POST' },
    {
      intent: 'dcl:explorer:comms-handshake',
      signer: 'dcl:explorer',
      isGuest: true
    })).json()

  // Create the new transport (it won't connect automatically):
  const transport: LiveKitCommsTransport = new LiveKitCommsTransport(response.fixedAdapter.replace('livekit:', ''))
  ;(globalThis as any).__transport = transport
  // Attach listeners for all relevant events:
  transport
    .on('message', ev => {
      app.handleMessage(ev.peer ?? "", ev.message)
    })
    .on('disconnected', console.log)
    .on('connected', console.log)


    // sorry santi, i move faster with react :sadcat:
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App transport={transport} />
    </React.StrictMode>,
  )

  // Connect the transport:
  await transport.connect()

  // Listen for chat messages coming from the UI, and send then through the transport:
  app.on('send-chat', ev => {
    transport.send({ $case: 'chat', chat: {message: ev.text, timestamp: Date.now()} })
  })

  // Listen for teleport requests coming from the UI, and update our heartbeat report:
  app.on('teleport', ev => {
    wantedPosition = ev.position
  })

  app.showChat({ id: (aboutResponse as any).configurations.realmName, transport: 'LiveKit', uri: realm.url, peers: [] })

  // Show the chat box, and update the current position in the UI:
  app.setPosition(wantedPosition)

  // Start the heartbeat, reporting and updating the position in the UI periodically:
  setAwaitedInterval(
    async () => {
      app.setPosition(wantedPosition)
    },
    1000
  )


}

start()