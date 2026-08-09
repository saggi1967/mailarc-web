import { useState, type ReactNode } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

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

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [pwOpen, setPwOpen] = useState(false);

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

          <Button
            color="inherit"
            startIcon={<AccountCircleIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            {user}
          </Button>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setPwOpen(true);
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Passwort ändern
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                logout();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Abmelden
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </Box>
  );
}
