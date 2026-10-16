import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import './App.css'

import { queryClient } from './config/queryClient.config'
import Login from './Components/Auth/Login'
import ForgotPassword from './Components/Auth/ForgotPassword'
import ResetPassword from './Components/Auth/ResetPassword'
import Dashboard from './Components/Dashboard/Dashboard'
import Overview from './Components/Dashboard/Overview'
import ProtectedRoute from './Components/Common/ProtectedRoute'

import FundInflowList from './Components/FundInflows/FundInflowList'
import AIEList from './Components/AIE/AIEList'
import DistributionList from './Components/Distributions/DistributionList'
import BudgetProposalList from './Components/BudgetProposals/BudgetProposalList'
import BudgetCodeList from './Components/BudgetCodes/BudgetCodeList'
import Reports from './Components/Reports/Reports'
import Comparisons from './Components/Comparisons/Comparisons'
import Expenditures from './Components/Expenditures/Expenditures'
import DepartmentList from './Components/Departments/DepartmentList'
import UserList from './Components/Admin/UserList'
import RoleList from './Components/Admin/RoleList'
import AuditList from './Components/Audit/AuditList'
import Profile from './Components/Profile/Profile'
import CapitalBudgetList from './Components/CapitalBudget/CapitalBudgetList'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="fund-inflows" element={<FundInflowList />} />
            <Route path="aie" element={<AIEList />} />
            <Route path="distributions" element={<DistributionList />} />
            <Route path="budget-proposals" element={<BudgetProposalList />} />
            <Route path="budget-codes" element={<BudgetCodeList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="comparisons" element={<Comparisons />} />
            <Route path="expenditures" element={<Expenditures />} />
            <Route path="departments" element={<DepartmentList />} />
            <Route path="admin/users" element={<UserList />} />
            <Route path="admin/roles" element={<RoleList />} />
            <Route path="capital-budget" element={<CapitalBudgetList />} />
            <Route path="audit" element={<AuditList />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000 },
        }}
      />

      {import.meta.env.MODE === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
