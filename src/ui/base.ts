import { EmitterEvent, Emitter } from "../util"


export abstract class View<E extends EmitterEvent = never> extends Emitter<E> {
  abstract $root: HTMLElement

  protected query(selector: string): HTMLElement {
    return this.$root.querySelector(selector)!
  }

  protected queryAll(selector: string): HTMLElement[] {
    return Array.from(this.$root.querySelectorAll(selector))
  }

  $ref<T extends HTMLElement>(ref: string): T {
    return this.$root.querySelector(`[data-ref=${ref}]`)!
  }
}

export abstract class StepView<E extends EmitterEvent> extends View<E> {
  show() {
    this.$root.style.display = 'block'
    setTimeout(() => this.$root.style.opacity = '1', 1)
    document.querySelector('#end')!.scrollIntoView({ block: 'end' }) // TODO this is a hack
  }

  disable() {}
}

export function cloneTemplate(elementId: string): HTMLElement {
  const $template = document.getElementById(elementId) as HTMLTemplateElement
  const $root = $template.content!.firstElementChild!

  return $root.cloneNode(true) as HTMLElement
}