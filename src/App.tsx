import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './components/Dashboard.tsx'
import UsedOrders from './components/UsedOrders.tsx'
import UsedPickups from './components/UsedPickups.tsx'
import UsedExpenses from './components/UsedExpenses.tsx'
import RemovalsOrders from './components/RemovalsOrders.tsx'
import UserManage from './components/UserManage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="used/orders" element={<UsedOrders />} />
          <Route path="used/pickups" element={<UsedPickups />} />
          <Route path="used/expenses" element={<UsedExpenses />} />
          <Route path="removals/orders" element={<RemovalsOrders />} />
          <Route path="users/manage" element={<UserManage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
