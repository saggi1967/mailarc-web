import type { ReactNode } from "react";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <MailOutlineIcon sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            mailarc
          </Typography>
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
