import { useState } from 'react'
import Page from './components/page'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Page/>
    </>
  )
}

export default App
