import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { api, ApiError } from "../api/client";
import type { SearchItem } from "../api/types";
import {
  DEFAULT_PAGE_SIZE,
  EMPTY,
  RANGES,
  activeChips,
  parseFilters,
  serialize,
  toParams,
  type Filters,
} from "../search/filters";
import { MqlEditor } from "../search/MqlEditor";

const MQL_PLACEHOLDER = 'z. B. from:@kunde.de AND (betreff:Rechnung OR filename:*.pdf)';

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value.slice(0, 16)
    : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Angewandte Suche kommt aus der URL; das Formular (draft) startet damit.
  const applied = useMemo(() => parseFilters(searchParams), [searchParams]);
  const page = Number(searchParams.get("page") ?? 0);
  const pageSize = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const mode = searchParams.get("mode") === "mql" ? "mql" : "form";
  const mqlApplied = searchParams.get("mql") ?? "";

  const [draft, setDraft] = useState<Filters>(applied);
  const [mqlDraft, setMqlDraft] = useState(mqlApplied);
  const [showFilters, setShowFilters] = useState(() => activeChips(applied).length > 0);

  const { data, isFetching, error } = useQuery({
    queryKey: ["search", mode, searchParams.toString()],
    queryFn: () =>
      mode === "mql"
        ? api.searchMql(mqlApplied, { limit: pageSize, offset: page * pageSize })
        : api.search({ ...toParams(applied), limit: pageSize, offset: page * pageSize }),
    enabled: mode !== "mql" || mqlApplied.trim().length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
  // Parse-Fehler des Servers (422) → Klartext + Position im MQL-Ausdruck.
  const mqlError =
    mode === "mql" && error instanceof ApiError && error.status === 422
      ? (error.detail as { message?: string; position?: number } | null)
      : null;

  const set = (k: keyof Filters) => (v: Filters[keyof Filters]) => setDraft((f) => ({ ...f, [k]: v }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSearchParams(serialize(draft, 0, pageSize), { replace: true });
  }

  function reset() {
    setDraft(EMPTY);
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function mqlUrl(text: string, pg = 0, size = pageSize): URLSearchParams {
    const sp = new URLSearchParams();
    sp.set("mode", "mql");
    if (text.trim()) sp.set("mql", text.trim());
    if (pg) sp.set("page", String(pg));
    if (size !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(size));
    return sp;
  }

  function submitMql() {
    setSearchParams(mqlUrl(mqlDraft), { replace: true });
  }

  function switchMode(_e: unknown, next: "form" | "mql" | null) {
    if (!next || next === mode) return;
    setSearchParams(next === "mql" ? mqlUrl(mqlDraft) : serialize(draft, 0, pageSize), { replace: true });
  }

  function onPagination(model: GridPaginationModel) {
    if (mode === "mql") {
      setSearchParams(mqlUrl(mqlApplied, model.page, model.pageSize), { replace: true });
      return;
    }
    setSearchParams(serialize(applied, model.page, model.pageSize), { replace: true });
  }

  function removeChip(key: keyof Filters | "range") {
    const cleared: Partial<Filters> =
      key === "range" ? { range: "", since: "", until: "" } : key === "phrase" ? { phrase: false } : { [key]: "" };
    setDraft((d) => ({ ...d, ...cleared }));
    setSearchParams(serialize({ ...applied, ...cleared }, 0, pageSize), { replace: true });
  }

  // -- Favorit speichern (F1): die aktuell angewandte Suche benennen und ablegen --
  const qc = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const appliedParams = toParams(applied);
  const hasCriteria = Object.keys(appliedParams).length > 0;

  // Favoritenliste nur laden, wenn der Dialog offen ist — damit „gleicher Name"
  // erkannt und dann überschrieben (PATCH) statt doppelt angelegt wird.
  const favorites = useQuery({ queryKey: ["searches"], queryFn: api.searches.list, enabled: saveOpen });
  const existing = favorites.data?.find((s) => s.name.trim() === saveName.trim());

  const saveFavorite = useMutation({
    mutationFn: () =>
      existing
        ? api.searches.update(existing.id, { name: saveName.trim(), params: appliedParams })
        : api.searches.create({ name: saveName.trim(), params: appliedParams }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["searches"] });
      setSaveOpen(false);
      setSnack(
        existing ? `Favorit „${saveName.trim()}“ aktualisiert.` : `Favorit „${saveName.trim()}“ gespeichert.`,
      );
    },
    onError: (e) => setSaveError(e instanceof ApiError ? e.message : "Speichern fehlgeschlagen."),
  });

  function openSave() {
    setSaveName(applied.q || applied.subject || applied.from || "");
    setSaveError(null);
    setSaveOpen(true);
  }

  const columns = useMemo<GridColDef<SearchItem>[]>(
    () => [
      { field: "date", headerName: "Datum", width: 170, valueFormatter: (v) => fmtDate(v as string | null) },
      { field: "from", headerName: "Von", width: 240, valueGetter: (_v, row) => row.from_name || row.from_addr || "—" },
      {
        field: "subject",
        headerName: "Betreff",
        flex: 1,
        minWidth: 260,
        renderCell: (p) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" noWrap>
              {p.row.subject || <em>(kein Betreff)</em>}
            </Typography>
            {p.row.snippet && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {p.row.snippet.replace(/<\/?em>/g, "")}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: "attachments",
        headerName: "📎",
        width: 70,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: (p) => (p.row.has_attachment ? <Chip size="small" label={p.row.attachment_count ?? 1} /> : null),
      },
    ],
    [],
  );

  const chips = activeChips(applied);

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup size="small" exclusive value={mode} onChange={switchMode} aria-label="Suchmodus">
        <ToggleButton value="form">Formular</ToggleButton>
        <ToggleButton value="mql">Experte (MQL)</ToggleButton>
      </ToggleButtonGroup>

      {mode === "form" && (
      <Paper component="form" onSubmit={onSubmit} sx={{ p: 1.5 }} elevation={1}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Volltext über Betreff, Body, Absender und Anhänge …"
            value={draft.q}
            onChange={(e) => set("q")(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Filter">
            <IconButton onClick={() => setShowFilters((s) => !s)} color={showFilters ? "primary" : "default"}>
              <Badge badgeContent={activeChips(draft).length} color="primary">
                <TuneIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={hasCriteria ? "Suche als Favorit speichern" : "Erst Suchkriterien wählen"}>
            <span>
              <IconButton onClick={openSave} disabled={!hasCriteria}>
                <BookmarkAddIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
            Suchen
          </Button>
        </Stack>

        <Collapse in={showFilters}>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            }}
          >
            <TextField size="small" label="Von (Adresse)" value={draft.from} onChange={(e) => set("from")(e.target.value)} />
            <TextField size="small" label="An (Adresse)" value={draft.to} onChange={(e) => set("to")(e.target.value)} />
            <TextField size="small" label="Absender-Domain" value={draft.domain} onChange={(e) => set("domain")(e.target.value)} />
            <TextField size="small" label="Betreff enthält" value={draft.subject} onChange={(e) => set("subject")(e.target.value)} />
            <TextField size="small" label="Anhang-Dateiname" value={draft.file} onChange={(e) => set("file")(e.target.value)} />
            <TextField size="small" label="Ordner" value={draft.mailbox} onChange={(e) => set("mailbox")(e.target.value)} />
            <TextField size="small" select label="Zeitraum" value={draft.range} onChange={(e) => set("range")(e.target.value)}>
              {RANGES.map(([v, l]) => (
                <MenuItem key={v || "all"} value={v}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" select label="Anhang" value={draft.attachments} onChange={(e) => set("attachments")(e.target.value)}>
              <MenuItem value="">Alle</MenuItem>
              <MenuItem value="yes">nur mit Anhang</MenuItem>
              <MenuItem value="no">nur ohne Anhang</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Checkbox checked={draft.phrase} onChange={(e) => set("phrase")(e.target.checked)} />}
              label="Exakte Phrase"
            />
            {draft.range === "custom" && (
              <>
                <TextField size="small" type="date" label="Von" InputLabelProps={{ shrink: true }} value={draft.since} onChange={(e) => set("since")(e.target.value)} />
                <TextField size="small" type="date" label="Bis" InputLabelProps={{ shrink: true }} value={draft.until} onChange={(e) => set("until")(e.target.value)} />
              </>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Tipp: Werte in <code>/…/</code> werden als regulärer Ausdruck ausgewertet (Von, An, Domain, Ordner) — auf den ganzen Feldwert bezogen, Groß-/Kleinschreibung egal.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" size="small">
              Anwenden
            </Button>
            <Button size="small" onClick={reset}>
              Zurücksetzen
            </Button>
          </Stack>
        </Collapse>
      </Paper>
      )}

      {mode === "mql" && (
        <Paper sx={{ p: 1.5 }} elevation={1}>
          <Stack spacing={1}>
            <Box sx={{ border: 1, borderColor: mqlError ? "error.main" : "divider", borderRadius: 1, p: 0.5 }}>
              <MqlEditor value={mqlDraft} onChange={setMqlDraft} onSubmit={submitMql} placeholder={MQL_PLACEHOLDER} />
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={submitMql}>
                Suchen
              </Button>
              <Typography variant="caption" color="text.secondary">
                Felder (from/absender, betreff, zeit, filename …) · <code>AND OR NOT</code> · Klammern ·{" "}
                <code>"Phrase"</code> · <code>*</code> · <code>/Regex/</code> — Enter sucht.
              </Typography>
            </Stack>
            {mqlError && (
              <Alert severity="error">
                {mqlError.message}
                {typeof mqlError.position === "number" ? ` (Position ${mqlError.position})` : ""}
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {mode === "form" && chips.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {chips.map((c) => (
            <Chip key={String(c.key) + c.label} label={c.label} onDelete={() => removeChip(c.key)} size="small" />
          ))}
        </Stack>
      )}

      {error && !mqlError && <Alert severity="error">{(error as Error).message}</Alert>}

      <Paper elevation={1} sx={{ height: 600 }}>
        <DataGrid<SearchItem>
          rows={data?.items ?? []}
          columns={columns}
          getRowId={(r) => r.id}
          rowCount={data?.total ?? 0}
          loading={isFetching}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={onPagination}
          pageSizeOptions={[25, 50, 100]}
          disableColumnMenu
          onRowClick={(p) => navigate(`/mail/${encodeURIComponent(String(p.id))}`)}
          sx={{ border: 0, "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </Paper>
      <Typography variant="caption" color="text.secondary">
        {data ? `${data.total} Treffer` : ""}
      </Typography>

      {/* Favorit speichern */}
      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Suche als Favorit speichern</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {saveError && <Alert severity="error">{saveError}</Alert>}
            <TextField
              autoFocus
              label="Name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter" && saveName.trim() && !saveFavorite.isPending) saveFavorite.mutate();
              }}
            />
            {existing && (
              <Alert severity="info">
                Ein Favorit „{existing.name}“ existiert bereits — seine Filter werden überschrieben.
              </Alert>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Gespeicherte Filter
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {applied.q && <Chip size="small" label={`Volltext: ${applied.q}`} />}
                {chips.map((c) => (
                  <Chip key={String(c.key) + c.label} size="small" label={c.label} />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => saveFavorite.mutate()}
            disabled={saveFavorite.isPending || !saveName.trim()}
          >
            {saveFavorite.isPending ? "…" : existing ? "Überschreiben" : "Speichern"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnack(null)}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/searches")}>
              Favoriten
            </Button>
          }
        >
          {snack}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
