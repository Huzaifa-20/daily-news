import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/unifrakturmaguntia/400.css'
import '@fontsource-variable/playfair-display/index.css'
import '@fontsource-variable/source-serif-4/index.css'
import '@fontsource-variable/source-serif-4/wght-italic.css'
import './index.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
