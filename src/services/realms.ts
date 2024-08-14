
// Realm is a Decentraland server.
export interface Realm {
  url: string
  serverName: string
  usersCount: number
}


// findRealms uses the lambdas API to fetch a list of public realms:
export async function findRealms() {
  const res = await fetch('https://realm-provider.decentraland.org/realms')
  const obj = await res.json()

  return obj as Realm[]
}
