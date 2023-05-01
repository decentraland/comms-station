import { View, cloneTemplate } from "./base"


type RequestProfileEvents =
  | { type: 'request', address: string }


export class RequestProfileView extends View<RequestProfileEvents> {
  $root = cloneTemplate('template-request-profile')

  constructor() {
    super()
    this.$send.addEventListener('click', this.onSendClick)
  }

  setAddress(address: string) {
    if (address != this.$address.innerText) {
      this.$address.innerText = address
      this.$send.classList.remove('disabled')
    }
  }

  setProfile(profile?: any) {
    if (profile && profile.userId === this.$address.innerText) {
      this.$profile.innerText = JSON.stringify(profile, null, 2)
      this.$send.style.display = 'none'
      this.$profile.style.display = 'block'

    } else {
      this.$send.style.display = 'block'
      this.$profile.style.display = 'none'
    }
  }

  private onSendClick = () => {
    this.emit({ type: 'request', address: this.$address.innerText })
    this.$send.classList.add('disabled')
  }

  private get $send(): HTMLElement { return this.$ref('send') }
  private get $address(): HTMLElement { return this.$ref('address') }
  private get $profile(): HTMLElement { return this.$ref('profile') }
}