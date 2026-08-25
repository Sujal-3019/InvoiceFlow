import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProfileProvider } from './context/ProfileContext';

import { DashboardLayout } from './components/layout';
import HomeRedirect from './components/layout/HomeRedirect';
import { Toast } from './components/ui';

// =========================================================
// PAGES
// =========================================================

import LandingPage from './pages/LandingPage/LandingPage';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import GooglePasswordSetup from './pages/Auth/GooglePasswordSetup';
import Dashboard from './pages/Dashboard/Dashboard';

import Products from './pages/Products/Products';

import CreateInvoice from './pages/Invoices/CreateInvoice';
import AllInvoices from './pages/Invoices/AllInvoices';
import EditInvoice from './pages/Invoices/EditInvoice';
import InvoiceDetails from './pages/Invoices/InvoiceDetails';

import Clients from './pages/Clients/Clients';
import ClientInvoices from './pages/Clients/ClientInvoices';

import ProfilePage from './pages/Profile/ProfilePage';
import CompanyManager from './components/company/CompanyManager';

import ResetPassword from './pages/Auth/ResetPassword';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ChangePassword from './pages/Auth/ChangePassword';
import VerifyEmail from './pages/Auth/VerifyEmail';


// =========================================================
// PROTECTED ROUTE
// =========================================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};


// =========================================================
// PUBLIC ROUTE
// =========================================================

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


// =========================================================
// LEGACY INVOICE URL REDIRECT
//
// Old links may still use:
//
// /invoices/123
//
// We now want:
//
// /invoices/123/view
//
// This component keeps old links working.
// =========================================================

const InvoiceViewRedirect = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate to="/invoices" replace />;
  }

  return <Navigate to={`/invoices/${id}/view`} replace />;
};


// =========================================================
// APP ROUTES
// =========================================================

function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route
        path="/"
        element={<HomeRedirect />}
      />

      <Route
        path="/home"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />

      <Route
        path="/google-password-setup"
        element={
          <PublicRoute>
            <GooglePasswordSetup />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          COMPANIES
      ===================================================== */}

      <Route
        path="/companies"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<CompanyManager />}
        />
      </Route>


      {/* =====================================================
          PROFILE
      ===================================================== */}

      <Route
        path="/profiles"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<ProfilePage />}
        />
      </Route>

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<ProfilePage />}
        />
      </Route>


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboard />}
        />
      </Route>


      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Products />}
        />
      </Route>


      {/* =====================================================
          INVOICES
      ===================================================== */}

      {/* -----------------------------------------------------
          ALL INVOICES
          
          /invoices
      ----------------------------------------------------- */}

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<AllInvoices />}
        />
      </Route>


      {/* -----------------------------------------------------
          CREATE INVOICE
          
          /invoices/create
          
          This is ONLY for creating a new invoice.
      ----------------------------------------------------- */}

      <Route
        path="/invoices/create"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<CreateInvoice />}
        />
      </Route>


      {/* -----------------------------------------------------
          VIEW EXISTING INVOICE
          
          /invoices/:id/view
          
          IMPORTANT:
          This must be a read-only invoice details page.
          
          It should fetch the actual invoice from the backend
          using the invoice ID.
      ----------------------------------------------------- */}

      <Route
        path="/invoices/:id/view"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<InvoiceDetails />}
        />
      </Route>


      {/* -----------------------------------------------------
          EDIT EXISTING INVOICE
          
          /invoices/:id/edit
          
          This is where EditInvoice belongs.
      ----------------------------------------------------- */}

      <Route
        path="/invoices/:id/edit"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<EditInvoice />}
        />
      </Route>


      {/* -----------------------------------------------------
          OLD INVOICE URL
          
          /invoices/:id
          
          Existing links in AllInvoices / ClientInvoices may
          still navigate here.
          
          Instead of breaking those links, redirect them to:
          
          /invoices/:id/view
      ----------------------------------------------------- */}

      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<InvoiceViewRedirect />}
        />
      </Route>


      {/* =====================================================
          CLIENTS
      ===================================================== */}

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Clients />}
        />
      </Route>


      {/* -----------------------------------------------------
          CLIENT INVOICES
          
          /clients/:id/invoices
      ----------------------------------------------------- */}

      <Route
        path="/clients/:id/invoices"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<ClientInvoices />}
        />
      </Route>


      {/* =====================================================
          REPORTS
      ===================================================== */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Dashboard />}
        />
      </Route>



      {/* =====================================================
          CATCH ALL
      ===================================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


// =========================================================
// APP
// =========================================================

function App() {
  return (
    <Router>

      <ThemeProvider>

        <AuthProvider>

          <ProfileProvider>

            <ToastProvider>

              <AppRoutes />

              <Toast />

            </ToastProvider>

          </ProfileProvider>

        </AuthProvider>

      </ThemeProvider>

    </Router>
  );
}


export default App;