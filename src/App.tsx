import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

const Layout = lazy(() => import('./components/Layout.tsx'))
const Dashboard = lazy(() => import('./components/Dashboard.tsx'))
const UsedOrders = lazy(() => import('./components/UsedOrders.tsx'))
const UsedPickups = lazy(() => import('./components/UsedPickups.tsx'))
const UsedExpenses = lazy(() => import('./components/UsedExpenses.tsx'))
const RemovalsOrders = lazy(() => import('./components/RemovalsOrders.tsx'))
const RemovalsExpenses = lazy(() => import('./components/RemovalsExpenses.tsx'))
const UserManage = lazy(() => import('./components/UserManage.tsx'))
const Leads = lazy(() => import('./components/Leads.tsx'))
const LoginPage = lazy(() => import('./components/LoginPage.tsx'))
const LightPillar = lazy(() => import('./components/LightPillar.tsx'))

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative min-h-screen bg-black">
          <div className="fixed inset-0 z-0 pointer-events-none">
            <Suspense fallback={null}>
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
            </Suspense>
          </div>
          <div className="relative z-10">
            <Suspense fallback={<div className="min-h-screen" />}>
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
                    <Route path="productivity/leads" element={<Leads />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
