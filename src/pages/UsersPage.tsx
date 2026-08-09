import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { UserInput, WebUser } from "../api/types";

interface FormState {
  username: string;
  password: string;
  role: string;
  is_active: boolean;
}

const EMPTY: FormState = { username: "", password: "", role: "user", is_active: true };

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data, isLoading, error } = useQuery<WebUser[]>({ queryKey: ["users"], queryFn: api.users.list });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const p: UserInput = { role: form.role, is_active: form.is_active };
        if (form.password) p.password = form.password;
        return api.users.update(editing, p);
      }
      return api.users.create({ username: form.username, password: form.password, role: form.role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : "Speichern fehlgeschlagen."),
  });

  const del = useMutation({
    mutationFn: (username: string) => api.users.remove(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setToDelete(null);
    },
    onError: (e) => {
      setToDelete(null);
      setSnack(e instanceof ApiError ? e.message : "Löschen fehlgeschlagen.");
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  }
  function openEdit(u: WebUser) {
    setEditing(u.username);
    setForm({ username: u.username, password: "", role: u.role, is_active: u.is_active });
    setFormError(null);
    setOpen(true);
  }
  const set = (k: keyof FormState) => (v: FormState[keyof FormState]) => setForm((f) => ({ ...f, [k]: v }));

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Benutzer
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Neuer Benutzer
        </Button>
      </Stack>

      <Paper elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Benutzer</TableCell>
              <TableCell>Rolle</TableCell>
              <TableCell align="center">Aktiv</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data ?? []).map((u) => (
              <TableRow key={u.username} hover>
                <TableCell>
                  {u.username}
                  {u.username === me && <Chip size="small" label="Sie" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>
                  <Chip size="small" color={u.role === "admin" ? "primary" : "default"} label={u.role} />
                </TableCell>
                <TableCell align="center">{u.is_active ? "✓" : "—"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(u)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <Tooltip title={u.username === me ? "Sich selbst kann man nicht löschen" : "Löschen"}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={u.username === me}
                        onClick={() => setToDelete(u.username)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Anlegen / Bearbeiten */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `Benutzer „${editing}“ bearbeiten` : "Neuer Benutzer"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {!editing && (
              <TextField label="Benutzername" value={form.username} onChange={(e) => set("username")(e.target.value)} fullWidth />
            )}
            <TextField
              label="Passwort"
              type="password"
              placeholder={editing ? "unverändert lassen" : ""}
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              fullWidth
            />
            <TextField select label="Rolle" value={form.role} onChange={(e) => set("role")(e.target.value)} fullWidth>
              <MenuItem value="user">user</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
            </TextField>
            {editing && (
              <FormControlLabel
                control={<Checkbox checked={form.is_active} onChange={(e) => set("is_active")(e.target.checked)} />}
                label="aktiv"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => save.mutate()}
            disabled={save.isPending || (!editing && (!form.username || !form.password))}
          >
            {save.isPending ? "…" : "Speichern"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Löschen bestätigen */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Benutzer entfernen?</DialogTitle>
        <DialogContent>
          <Typography>
            Benutzer <strong>{toDelete}</strong> wirklich löschen?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Abbrechen</Button>
          <Button color="error" variant="contained" onClick={() => toDelete && del.mutate(toDelete)} disabled={del.isPending}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack(null)}>
        <Alert severity="warning" onClose={() => setSnack(null)}>
          {snack}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
