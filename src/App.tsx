import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import Layout from './components/Layout.tsx'
import Dashboard from './components/Dashboard.tsx'
import UsedOrders from './components/UsedOrders.tsx'
import UsedPickups from './components/UsedPickups.tsx'
import UsedExpenses from './components/UsedExpenses.tsx'
import RemovalsOrders from './components/RemovalsOrders.tsx'
import RemovalsExpenses from './components/RemovalsExpenses.tsx'
import UserManage from './components/UserManage.tsx'
import LoginPage from './components/LoginPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import LightPillar from './components/LightPillar.tsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative min-h-screen bg-black overflow-hidden">
          <div className="fixed inset-0 z-0">
            <LightPillar
              topColor="#3300ff"
              bottomColor="#fc00f3"
              intensity={1.24}
              rotationSpeed={0.3}
              glowAmount={0.0018}
              pillarWidth={6}
              pillarHeight={0.3}
              noiseIntensity={0.1}
              pillarRotation={45}
              interactive={true}
              mixBlendMode="normal"
              quality="medium"
            />
          </div>
          <div className="relative z-10">
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="used/orders" element={<UsedOrders />} />
                  <Route path="used/pickups" element={<UsedPickups />} />
                  <Route path="used/expenses" element={<UsedExpenses />} />
                  <Route path="removals/orders" element={<RemovalsOrders />} />
                  <Route path="removals/expenses" element={<RemovalsExpenses />} />
                  <Route path="users/manage" element={<UserManage />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
