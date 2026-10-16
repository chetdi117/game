import './styles/main.scss'
import { startRouter } from './app/router.ts'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Application root #app is missing.')

const stop = startRouter(app)
if (import.meta.hot) import.meta.hot.dispose(stop)
