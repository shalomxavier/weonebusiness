import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './components/Dashboard.tsx'

const Blank = () => <div className="p-8 text-white/70">Coming soon...</div>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="used/orders" element={<Blank />} />
          <Route path="used/pickups" element={<Blank />} />
          <Route path="used/expenses" element={<Blank />} />
          <Route path="removals/orders" element={<Blank />} />
          <Route path="users/manage" element={<Blank />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
