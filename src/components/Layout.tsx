import type { ReactNode } from "react";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV = [
  { to: "/", label: "Suche" },
  { to: "/dashboard", label: "Statistik" },
  { to: "/accounts", label: "Konten" },
  { to: "/users", label: "Benutzer", adminOnly: true },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <MailOutlineIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ cursor: "pointer", mr: 3 }} onClick={() => navigate("/")}>
            mailarc
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {nav.map((n) => (
              <Button
                key={n.to}
                color="inherit"
                onClick={() => navigate(n.to)}
                sx={{ opacity: pathname === n.to ? 1 : 0.75, fontWeight: pathname === n.to ? 700 : 400 }}
              >
                {n.label}
              </Button>
            ))}
          </Stack>
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
            {user}
          </Typography>
          <Button color="inherit" onClick={() => logout()}>
            Abmelden
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
