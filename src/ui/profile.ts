import { View, cloneTemplate } from "./base"


type RequestProfileEvents =
  | { $case: 'request', address: string }


export class RequestProfileView extends View<RequestProfileEvents> {
  $root = cloneTemplate('template-request-profile')

  constructor() {
    super()
    this.$send.addEventListener('click', this.onSendClick)
  }

  setAddress(address: string) {
    this.$address.innerText = address
    this.$send.classList.remove('disabled')
    this.$send.innerText = "Request Profile"
  }

  setProfile(profile: any) {
    if (profile.userId !== this.$address.innerText) return

    this.$profile.innerText = JSON.stringify(profile, null, 2)
    this.$send.style.display = 'none'
    this.$profile.style.display = 'block'
  }

  private onSendClick = () => {
    this.emit({ $case: 'request', address: this.$address.innerText })
    this.$send.classList.add('disabled')
    this.$send.innerText = "Waiting..."
  }

  private get $send(): HTMLElement { return this.$ref('send') }
  private get $address(): HTMLElement { return this.$ref('address') }
  private get $profile(): HTMLElement { return this.$ref('profile') }
}