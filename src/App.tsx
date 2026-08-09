import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SearchPage from "./pages/SearchPage";
import MailDetailPage from "./pages/MailDetailPage";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import UsersPage from "./pages/UsersPage";

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      {children}
    </Box>
  );
}

export default function App() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/mail/:id" element={<MailDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/users" element={isAdmin ? <UsersPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
