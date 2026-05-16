import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AddProduct from './pages/AddProduct'
import EditProduct from './pages/EditProduct'
import ManageProducts from './pages/ManageProducts'
import Settings from './pages/Settings'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Customers from './pages/Customers'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add" element={<AddProduct />} />
        <Route path="edit/:id" element={<EditProduct />} />
        <Route path="manage" element={<ManageProducts />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
