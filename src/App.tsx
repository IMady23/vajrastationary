import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

// Code-split / Lazy-loaded pages to dramatically optimize initial bundle download
const Home = lazy(() => import('./pages/Home'))
const AddProduct = lazy(() => import('./pages/AddProduct'))
const EditProduct = lazy(() => import('./pages/EditProduct'))
const ManageProducts = lazy(() => import('./pages/ManageProducts'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const AICamera = lazy(() => import('./pages/AICamera'))
const AIRecognitionLab = lazy(() => import('./pages/AIRecognitionLab'))
const Settings = lazy(() => import('./pages/Settings'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Customers = lazy(() => import('./pages/Customers'))
const FirebaseHealthCheck = lazy(() => import('./pages/FirebaseHealthCheck'))

function PageFallback() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl glass border border-brand/30 flex items-center justify-center shadow-xl shadow-brand/10">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-muted/80">
        Loading Vajra Interface...
      </span>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add" element={<AddProduct />} />
          <Route path="edit/:id" element={<EditProduct />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="manage" element={<ManageProducts />} />
          <Route path="ai-camera" element={<AICamera />} />
          <Route path="ai-lab" element={<AIRecognitionLab />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="dev/firebase-health" element={<FirebaseHealthCheck />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
