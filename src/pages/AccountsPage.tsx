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
  Paper,
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
import type { Account, AccountInput } from "../api/types";

type FormState = AccountInput & { imap_port?: number };

const EMPTY: FormState = {
  name: "",
  imap_host: "",
  imap_port: 993,
  imap_ssl: true,
  imap_ssl_verify: true,
  imap_user: "",
  imap_password: "",
  folders: "INBOX",
  es_host: "",
  es_user: "",
  es_password: "",
  es_index: "",
};

export default function AccountsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<Account[]>({ queryKey: ["accounts"], queryFn: api.accounts.list });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // Label beim Bearbeiten
  const [form, setForm] = useState<FormState>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      // Nur befüllte Felder senden; Passwörter nur, wenn eingegeben.
      const p: AccountInput = { ...form };
      if (!p.imap_password) delete p.imap_password;
      if (!p.es_password) delete p.es_password;
      if (editing) {
        delete p.name;
        return api.accounts.update(editing, p);
      }
      return api.accounts.create(p);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
    },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : "Speichern fehlgeschlagen."),
  });

  const del = useMutation({
    mutationFn: (name: string) => api.accounts.remove(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setToDelete(null);
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(a: Account) {
    setEditing(a.name);
    setForm({
      name: a.name,
      imap_host: a.imap_host,
      imap_port: a.imap_port,
      imap_ssl: a.imap_ssl,
      imap_ssl_verify: a.imap_ssl_verify,
      imap_user: a.imap_user,
      imap_password: "",
      folders: a.folders,
      es_host: a.es_host ?? "",
      es_user: a.es_user ?? "",
      es_password: "",
      es_index: a.es_index ?? "",
    });
    setFormError(null);
    setOpen(true);
  }

  const set = (k: keyof FormState) => (v: unknown) => setForm((f) => ({ ...f, [k]: v }));

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
          Zentrale Konten
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Neues Konto
        </Button>
      </Stack>

      <Paper elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Label</TableCell>
              <TableCell>IMAP-Host</TableCell>
              <TableCell>Benutzer</TableCell>
              <TableCell>Ordner</TableCell>
              <TableCell>ES-Ziel</TableCell>
              <TableCell align="center">ES-PW</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data ?? []).map((a) => (
              <TableRow key={a.name} hover>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.imap_host}</TableCell>
                <TableCell>{a.imap_user}</TableCell>
                <TableCell>{a.folders}</TableCell>
                <TableCell>{a.es_host || <em>—</em>}</TableCell>
                <TableCell align="center">
                  {a.es_host && !a.es_password_set ? (
                    <Tooltip title="ES-Host gesetzt, aber kein ES-Passwort → 401-Gefahr">
                      <Chip size="small" color="warning" label="fehlt" />
                    </Tooltip>
                  ) : a.es_password_set ? (
                    <Chip size="small" label="✓" />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(a)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(a.name)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    Noch keine Konten. Mit „Neues Konto" anlegen.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Anlegen / Bearbeiten */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Konto „${editing}“ bearbeiten` : "Neues Konto"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            {!editing && (
              <TextField label="Label" value={form.name ?? ""} onChange={(e) => set("name")(e.target.value)} fullWidth />
            )}
            <Typography variant="overline" color="text.secondary">IMAP</Typography>
            <TextField label="Host" value={form.imap_host ?? ""} onChange={(e) => set("imap_host")(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Port"
                type="number"
                value={form.imap_port ?? 993}
                onChange={(e) => set("imap_port")(Number(e.target.value))}
                sx={{ width: 120 }}
              />
              <FormControlLabel
                control={<Checkbox checked={!!form.imap_ssl} onChange={(e) => set("imap_ssl")(e.target.checked)} />}
                label="SSL"
              />
              <FormControlLabel
                control={<Checkbox checked={!!form.imap_ssl_verify} onChange={(e) => set("imap_ssl_verify")(e.target.checked)} />}
                label="Zert. prüfen"
              />
            </Stack>
            <TextField label="Benutzer" value={form.imap_user ?? ""} onChange={(e) => set("imap_user")(e.target.value)} fullWidth />
            <TextField
              label="Passwort"
              type="password"
              placeholder={editing ? "unverändert lassen" : ""}
              value={form.imap_password ?? ""}
              onChange={(e) => set("imap_password")(e.target.value)}
              fullWidth
            />
            <TextField label="Ordner (Komma-getrennt)" value={form.folders ?? ""} onChange={(e) => set("folders")(e.target.value)} fullWidth />

            <Typography variant="overline" color="text.secondary">Elasticsearch (optional, zentral)</Typography>
            <TextField label="ES-Host" value={form.es_host ?? ""} onChange={(e) => set("es_host")(e.target.value)} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="ES-Benutzer" value={form.es_user ?? ""} onChange={(e) => set("es_user")(e.target.value)} fullWidth />
              <TextField label="ES-Index" value={form.es_index ?? ""} onChange={(e) => set("es_index")(e.target.value)} fullWidth />
            </Stack>
            <TextField
              label="ES-Passwort"
              type="password"
              placeholder={editing ? "unverändert lassen" : ""}
              value={form.es_password ?? ""}
              onChange={(e) => set("es_password")(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "…" : "Speichern"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Löschen bestätigen */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Konto entfernen?</DialogTitle>
        <DialogContent>
          <Typography>
            Konto <strong>{toDelete}</strong> wirklich entfernen? Die bereits archivierten Mails bleiben erhalten.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Abbrechen</Button>
          <Button color="error" variant="contained" onClick={() => toDelete && del.mutate(toDelete)} disabled={del.isPending}>
            Entfernen
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
