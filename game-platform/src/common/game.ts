export type Cleanup = () => void
export interface GameModule {
  mountGame: (host: HTMLElement) => Cleanup
}

export interface GameDefinition {
  id: string
  path: string
  title: string
  description: string
  number: string
  tag: string
  art: string
  load: () => Promise<GameModule>
}
