import { createApp } from 'vue'
import App from './App.vue'
import { createPaletteTheme } from './theme-palette/usePaletteTheme'
import './styles/style.css'

const paletteTheme = createPaletteTheme()
paletteTheme.initPaletteTheme()

createApp(App).mount('#app')

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    let isRefreshing = false
    const notifyUpdateAvailable = () => {
      window.dispatchEvent(new CustomEvent('sw-update-available'))
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          if (registration.waiting) {
            notifyUpdateAvailable()
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) {
              return
            }

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdateAvailable()
              }
            })
          })

          window.setInterval(() => {
            void registration.update()
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (isRefreshing) {
        return
      }
      isRefreshing = true
      window.location.reload()
    })
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key))
        })
      }
    })
  }
}
