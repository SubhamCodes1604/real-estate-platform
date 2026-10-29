import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Bookmarks from "./pages/Bookmarks";
import Inquiries from "./pages/Inquiries";
import Dashboard from "./pages/Dashboard";
import MyProperties from "./pages/MyProperties";
import ReceivedInquiries from "./pages/ReceivedInquiries";
import CreateProperty from "./pages/CreateProperty";
import EditProperty from "./pages/EditProperty";
import AgentDashboard from "./pages/AgentDashboard";
import Questions from "./pages/Questions";
import QuestionDetails from "./pages/QuestionDetails";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Navbar />

        <main className="main-content">

          <Routes>

            {/* ==================== */}
            {/* PUBLIC PAGES */}
            {/* ==================== */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/properties"
              element={<Properties />}
            />

            <Route
              path="/properties/:id"
              element={<PropertyDetails />}
            />

            <Route
              path="/questions"
              element={<Questions />}
            />

            <Route
              path="/questions/:id"
              element={<QuestionDetails />}
            />


            {/* ==================== */}
            {/* USER PAGES */}
            {/* ==================== */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute allowedRoles={["USER"]}>
                  <Bookmarks />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inquiries"
              element={
                <ProtectedRoute allowedRoles={["USER"]}>
                  <Inquiries />
                </ProtectedRoute>
              }
            />


            {/* ==================== */}
            {/* AGENT PAGES */}
            {/* ==================== */}

            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-properties"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <MyProperties />
                </ProtectedRoute>
              }
            />

            <Route
              path="/received-inquiries"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <ReceivedInquiries />
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties/create"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <CreateProperty />
                </ProtectedRoute>
              }
            />

            <Route
              path="/properties/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <EditProperty />
                </ProtectedRoute>
              }
            />

          </Routes>

        </main>

        <Footer />

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;