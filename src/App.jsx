// src/App.jsx
import React from 'react'
import OTPVerification from './components/OTPVerification'
import { Analytics } from "@vercel/analytics/next"
function App() {
  return (
    <div className="App">
      <Analytics />
      <OTPVerification />
    </div>
  )
}

export default App