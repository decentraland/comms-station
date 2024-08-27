import React, { useEffect, useState } from 'react'

import { Vector3 } from '@dcl/protocol/out-ts/decentraland/common/vectors.gen'
import { stringToHex } from './util/string-to-color'

import styles from './App.module.css'
import { CommsTransport, LiveKitCommsTransport } from './services/comms'
type Props = {
  id: string
  position?: Vector3
}

const parsePosition = (position?: Vector3) => {
  if (!position) {
    return { x: 0, y: 0, z: 0 }
  }
  const width = 600
  const posX = (position.x / 16) * width;
  const posZ = width - ((position.z / 16) * width);
  return {
    x: posX,
    y: position.y,
    z: posZ
  }
}

const Triangle: React.FC<Props> = ({ id, position }) => (
  <div
    data-for={id}
    data-tip
    className={styles.triangle}
    style={{
      top: `${position?.z}px`,
      left: `${position?.x}px`,
    }}
  >
    <div style={{ background: stringToHex(id) }}/>
  </div>
)

interface AppProps {
  transport: LiveKitCommsTransport
}

const App: React.FC<AppProps> = ({ transport }) => {
  const [users, setUsers] = useState<Set<string>>(new Set())
  const [positions, setPositions] = useState<Record<string, Vector3>>({})

  function getParticipants() {
    const initialParticipants = transport.getParticipants()
    if (!initialParticipants) return
    for (const participant of initialParticipants?.values()) {
      users.add(participant.identity)
    }
    setUsers(users)
  }

  transport.on('connected', (connected) => {
    if (!connected.peer) {
      return getParticipants()
    }
    users.add(connected.peer)
    setUsers(users)
  })

  transport.on('disconnected', (value) => {
    users.delete(value.peer ?? '')
    setUsers(new Set(users))
  })

  transport.on('message', (value) => {
    if (value.message.$case === 'position') {
      const { positionX, positionY, positionZ } = value.message.position
      positions[value.peer ?? ''] = { x: positionX, y: positionY, z: positionZ }
      setPositions({ ...positions })
    }
  })

  return <div className={styles.container}>
    {[...users].map(user => (
      <Triangle
        key={user}
        position={parsePosition(positions[user])}
        id={user}
      />
    ))}
  </div>
}

export default App