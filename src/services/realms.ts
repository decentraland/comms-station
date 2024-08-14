
// Realm is a Decentraland server.
export interface Realm {
  url: string
  serverName: string
  usersCount: number
}


// findRealms uses the lambdas API to fetch a list of public realms:
export async function findRealms() {
  const res = await fetch('https://realm-provider.decentraland.zone/realms')
  const obj = await res.json()

  const newRealm: Realm = {
    url: 'https://worlds-content-server.decentraland.org/world/paralax.dcl.eth/',
    serverName: 'parallax world',
    usersCount: 0
  }
  
  const realms: Realm[] = [...(obj as Realm[]), newRealm];

  return realms
}
