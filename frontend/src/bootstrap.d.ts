declare module 'bootstrap' {
  export class Toast {
    static getOrCreateInstance(
      element: HTMLElement,
      options?: Partial<{ autohide: boolean; delay: number }>,
    ): Toast
    show(): void
    hide(): void
  }
}
