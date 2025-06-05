import React from 'react'
import { createRoot } from 'react-dom/client'
import Popup from './popup'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Find the root element
  const rootElement = document.getElementById('root')

  if (rootElement) {
    // Create root and render once
    const root = createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <Popup />
      </React.StrictMode>
    )
  } else {
    console.error('Root element not found')
  }
})
