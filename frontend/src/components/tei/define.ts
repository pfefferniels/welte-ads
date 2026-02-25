export function define(elements: string[]) {
  if (typeof window === 'undefined') return

  for (const el of elements) {
    const tagName = el.toLowerCase()
    try {
      if (!window.customElements.get(tagName)) {
        window.customElements.define(
          tagName,
          class extends HTMLElement {
            connectedCallback() {
              this.setAttribute('data-processed', '')
            }
          }
        )
      }
    } catch (e) {
      console.log(`Could not define custom element ${tagName}:`, e)
    }
  }
}
