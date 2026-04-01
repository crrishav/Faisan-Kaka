import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SmoothScroll from './Components/smoothScroll.jsx'
import { CartProvider } from './Components/cartContext.jsx'
import { CurrencyProvider } from './Components/currencyContext.jsx'
import { PrintProvider } from './Components/printContext.jsx'
import AppErrorBoundary from './Components/AppErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll>
      <CurrencyProvider>
        <CartProvider>
          <PrintProvider>
            <AppErrorBoundary fallbackTitle="The app hit an unexpected error.">
              <App />
            </AppErrorBoundary>
          </PrintProvider>
        </CartProvider>
      </CurrencyProvider>
    </SmoothScroll>
  </StrictMode>,
)
