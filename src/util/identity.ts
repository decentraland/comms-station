import { Authenticator } from "@dcl/crypto"
import { Wallet } from "@ethersproject/wallet"


// createDisposableIdentity generates a public/private key pair using the Ethereum scheme.
export async function createDisposableIdentity() {
  console.log("Creating dispoable identity")
  const wallet = Wallet.createRandom()
  const address = wallet.address.toLowerCase()

  const account = {
    address: address,
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
  }

  const signer = wallet.signMessage.bind(wallet)

  console.log("Initializing authenticator")
  return await Authenticator.initializeAuthChain(address, account, 600, signer)
}