import { View, cloneTemplate } from "./base"


type ModalEvents =
  | { type: 'close' }


export class ModalView<T extends View<any>> extends View<ModalEvents> {
  $root = cloneTemplate('template-modal')

  constructor(readonly content: T) {
    super()
    this.$backdrop.addEventListener('click', this.onBackdropClick)
    this.$content.appendChild(content.$root)
  }

  private onBackdropClick = () => {
    this.emit({ type: 'close' })
  }

  private get $backdrop(): HTMLElement { return this.$ref('backdrop') }
  private get $content(): HTMLElement { return this.$ref('content') }
}