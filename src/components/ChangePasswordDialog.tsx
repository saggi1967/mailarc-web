import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { api, ApiError } from "../api/client";

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  async function submit() {
    setError(null);
    if (next !== confirm) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Änderung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Passwort ändern</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Aktuelles Passwort"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="Neues Passwort"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            fullWidth
          />
          <TextField
            label="Neues Passwort bestätigen"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            reset();
            onClose();
          }}
        >
          Abbrechen
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy || !current || !next}>
          {busy ? "…" : "Ändern"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
