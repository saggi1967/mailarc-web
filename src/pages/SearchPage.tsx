import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { api } from "../api/client";
import type { SearchItem, SearchParams } from "../api/types";

interface Filters {
  q: string;
  from: string;
  to: string;
  domain: string;
  subject: string;
  file: string;
  mailbox: string;
  range: string; // "" | "24h" | "7d" | "30d" | "365d" | "custom"
  since: string;
  until: string;
  attachments: string; // "" | "yes" | "no"
  phrase: boolean;
}

const EMPTY: Filters = {
  q: "", from: "", to: "", domain: "", subject: "", file: "", mailbox: "",
  range: "", since: "", until: "", attachments: "", phrase: false,
};

const RANGES: [string, string][] = [
  ["", "Alle"],
  ["24h", "Letzte 24 h"],
  ["7d", "Letzte 7 Tage"],
  ["30d", "Letzte 30 Tage"],
  ["365d", "Letztes Jahr"],
  ["custom", "Benutzerdefiniert"],
];

function toParams(f: Filters): SearchParams {
  const p: SearchParams = {};
  if (f.q) p.q = f.q;
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  if (f.domain) p.domain = f.domain;
  if (f.subject) p.subject = f.subject;
  if (f.file) p.file = f.file;
  if (f.mailbox) p.mailbox = f.mailbox;
  if (f.phrase) p.phrase = true;
  if (f.attachments === "yes") p.attachments = true;
  else if (f.attachments === "no") p.attachments = false;
  if (f.range === "custom") {
    if (f.since) p.since = f.since;
    if (f.until) p.until = f.until;
  } else if (f.range) {
    p.last = f.range;
  }
  return p;
}

/** Aktive Filter (ohne q) als entfernbare Chips. */
function activeChips(f: Filters): { key: keyof Filters | "range"; label: string }[] {
  const chips: { key: keyof Filters | "range"; label: string }[] = [];
  if (f.from) chips.push({ key: "from", label: `Von: ${f.from}` });
  if (f.to) chips.push({ key: "to", label: `An: ${f.to}` });
  if (f.domain) chips.push({ key: "domain", label: `Domain: ${f.domain}` });
  if (f.subject) chips.push({ key: "subject", label: `Betreff: ${f.subject}` });
  if (f.file) chips.push({ key: "file", label: `Anhang: ${f.file}` });
  if (f.mailbox) chips.push({ key: "mailbox", label: `Ordner: ${f.mailbox}` });
  if (f.phrase) chips.push({ key: "phrase", label: "Phrase" });
  if (f.attachments === "yes") chips.push({ key: "attachments", label: "mit Anhang" });
  else if (f.attachments === "no") chips.push({ key: "attachments", label: "ohne Anhang" });
  if (f.range === "custom" && (f.since || f.until))
    chips.push({ key: "range", label: `Zeitraum: ${f.since || "…"} – ${f.until || "…"}` });
  else if (f.range) chips.push({ key: "range", label: RANGES.find(([v]) => v === f.range)?.[1] ?? f.range });
  return chips;
}

function countActive(f: Filters): number {
  return activeChips(f).length;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value.slice(0, 16)
    : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  const { data, isFetching, error } = useQuery({
    queryKey: ["search", applied, pagination.page, pagination.pageSize],
    queryFn: () =>
      api.search({ ...toParams(applied), limit: pagination.pageSize, offset: pagination.page * pagination.pageSize }),
    placeholderData: keepPreviousData,
  });

  const set = (k: keyof Filters) => (v: Filters[keyof Filters]) => setDraft((f) => ({ ...f, [k]: v }));

  function apply(next: Filters) {
    setPagination((m) => ({ ...m, page: 0 }));
    setApplied(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(draft);
  }

  function reset() {
    setDraft(EMPTY);
    apply(EMPTY);
  }

  function removeChip(key: keyof Filters | "range") {
    const cleared: Partial<Filters> =
      key === "range" ? { range: "", since: "", until: "" } : key === "phrase" ? { phrase: false } : { [key]: "" };
    const nextDraft = { ...draft, ...cleared };
    setDraft(nextDraft);
    apply({ ...applied, ...cleared });
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
              <Badge badgeContent={countActive(draft)} color="primary">
                <TuneIcon />
              </Badge>
            </IconButton>
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
            <TextField
              size="small"
              select
              label="Zeitraum"
              value={draft.range}
              onChange={(e) => set("range")(e.target.value)}
            >
              {RANGES.map(([v, l]) => (
                <MenuItem key={v || "all"} value={v}>
                  {l}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="Anhang"
              value={draft.attachments}
              onChange={(e) => set("attachments")(e.target.value)}
            >
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
                <TextField
                  size="small"
                  type="date"
                  label="Von"
                  InputLabelProps={{ shrink: true }}
                  value={draft.since}
                  onChange={(e) => set("since")(e.target.value)}
                />
                <TextField
                  size="small"
                  type="date"
                  label="Bis"
                  InputLabelProps={{ shrink: true }}
                  value={draft.until}
                  onChange={(e) => set("until")(e.target.value)}
                />
              </>
            )}
          </Box>
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

      {chips.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {chips.map((c) => (
            <Chip key={String(c.key) + c.label} label={c.label} onDelete={() => removeChip(c.key)} size="small" />
          ))}
        </Stack>
      )}

      {error && <Alert severity="error">{(error as Error).message}</Alert>}

      <Paper elevation={1} sx={{ height: 600 }}>
        <DataGrid<SearchItem>
          rows={data?.items ?? []}
          columns={columns}
          getRowId={(r) => r.id}
          rowCount={data?.total ?? 0}
          loading={isFetching}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[25, 50, 100]}
          disableColumnMenu
          onRowClick={(p) => navigate(`/mail/${encodeURIComponent(String(p.id))}`)}
          sx={{ border: 0, "& .MuiDataGrid-row": { cursor: "pointer" } }}
        />
      </Paper>
      <Typography variant="caption" color="text.secondary">
        {data ? `${data.total} Treffer` : ""}
      </Typography>
    </Stack>
  );
}
