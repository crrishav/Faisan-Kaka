import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SmoothScroll from './Components/smoothScroll.jsx'
import { CartProvider } from './Components/cartContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll>
      <CartProvider>
        <App />
      </CartProvider>
    </SmoothScroll>
  </StrictMode>,
)
