
// Realm is a Decentraland server.
export interface Realm {
  url: string
  serverName: string
  usersCount: number
}

const boedoWorld: Realm = {
  url: 'https://worlds-content-server.decentraland.org/world/boedo.dcl.eth/',
  serverName: 'Custom World',
  usersCount: 0
}

// findRealms uses the lambdas API to fetch a list of public realms:
export async function findRealms() {
  return [boedoWorld]
  // const res = await fetch('https://realm-provider.decentraland.org/realms')
  // const obj = await res.json()
  // return (obj as Realm[]).concat(boedoWorld)
}
