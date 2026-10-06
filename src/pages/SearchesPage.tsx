import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { api, ApiError } from "../api/client";
import type { SavedSearch } from "../api/types";
import { activeChips, paramsToSearchString, searchParamsToFilters } from "../search/filters";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value.slice(0, 16)
    : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

/** Chips, die die gespeicherten Filter eines Favoriten zusammenfassen (inkl. Volltext). */
function summaryChips(s: SavedSearch) {
  const chips = activeChips(searchParamsToFilters(s.params));
  const labels = s.params.q ? [`Volltext: ${s.params.q}`, ...chips.map((c) => c.label)] : chips.map((c) => c.label);
  return labels.length ? labels : ["alle Mails"];
}

export default function SearchesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery<SavedSearch[]>({
    queryKey: ["searches"],
    queryFn: api.searches.list,
  });

  const [renaming, setRenaming] = useState<SavedSearch | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SavedSearch | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const rename = useMutation({
    mutationFn: () => api.searches.update(renaming!.id, { name: name.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["searches"] });
      setRenaming(null);
    },
    onError: (e) => setFormError(e instanceof ApiError ? e.message : "Umbenennen fehlgeschlagen."),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.searches.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["searches"] });
      setToDelete(null);
    },
    onError: (e) => {
      setToDelete(null);
      setSnack(e instanceof ApiError ? e.message : "Löschen fehlgeschlagen.");
    },
  });

  function load(s: SavedSearch) {
    navigate(`/?${paramsToSearchString(s.params)}`);
  }
  function openRename(s: SavedSearch) {
    setRenaming(s);
    setName(s.name);
    setFormError(null);
  }

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  const rows = data ?? [];

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Favoriten
        </Typography>
      </Stack>

      {rows.length === 0 ? (
        <Alert severity="info">
          Noch keine Favoriten. Führe eine Suche aus und speichere sie über das Lesezeichen-Symbol{" "}
          <strong>neben „Suchen"</strong>.
        </Alert>
      ) : (
        <Paper elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Filter</TableCell>
                <TableCell>Geändert</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                      onClick={() => load(s)}
                    >
                      {s.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {summaryChips(s).map((label, i) => (
                        <Chip key={i} size="small" variant="outlined" label={label} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{fmtDate(s.updated_at)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Ausführen (in die Suche laden)">
                      <IconButton size="small" color="primary" onClick={() => load(s)}>
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Umbenennen">
                      <IconButton size="small" onClick={() => openRename(s)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Löschen">
                      <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Typography variant="caption" color="text.secondary">
        Tipp: Filter eines Favoriten ändern — laden, in der Suche anpassen und unter demselben Namen erneut speichern.
      </Typography>

      {/* Umbenennen */}
      <Dialog open={!!renaming} onClose={() => setRenaming(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Favorit umbenennen</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              autoFocus
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim() && !rename.isPending) rename.mutate();
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenaming(null)}>Abbrechen</Button>
          <Button variant="contained" onClick={() => rename.mutate()} disabled={rename.isPending || !name.trim()}>
            {rename.isPending ? "…" : "Speichern"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Löschen bestätigen */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Favorit entfernen?</DialogTitle>
        <DialogContent>
          <Typography>
            Favorit <strong>{toDelete?.name}</strong> wirklich löschen?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Abbrechen</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => toDelete && del.mutate(toDelete.id)}
            disabled={del.isPending}
          >
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
