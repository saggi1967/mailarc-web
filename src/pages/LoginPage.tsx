import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "grey.100" }}>
      <Card sx={{ width: 360 }} elevation={3}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <MailOutlineIcon color="primary" />
              <Typography variant="h5">mailarc</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" align="center">
              Bitte anmelden, um das Archiv zu durchsuchen.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Benutzer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              fullWidth
            />
            <TextField
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={busy || !password}>
              {busy ? "…" : "Anmelden"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
