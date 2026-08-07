import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { api } from "../api/client";
import type { SearchItem } from "../api/types";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value.slice(0, 16) : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [q, setQ] = useState(""); // abgeschickter Suchbegriff
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  const { data, isFetching, error } = useQuery({
    queryKey: ["search", q, pagination.page, pagination.pageSize],
    queryFn: () =>
      api.search({ q: q || undefined, limit: pagination.pageSize, offset: pagination.page * pagination.pageSize }),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo<GridColDef<SearchItem>[]>(
    () => [
      { field: "date", headerName: "Datum", width: 170, valueFormatter: (v) => fmtDate(v as string | null) },
      {
        field: "from",
        headerName: "Von",
        width: 240,
        valueGetter: (_v, row) => row.from_name || row.from_addr || "—",
      },
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
        renderCell: (p) =>
          p.row.has_attachment ? <Chip size="small" label={p.row.attachment_count ?? 1} /> : null,
      },
    ],
    [],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPagination((m) => ({ ...m, page: 0 }));
    setQ(term.trim());
  }

  return (
    <Stack spacing={2}>
      <Paper component="form" onSubmit={onSubmit} sx={{ p: 1 }} elevation={1}>
        <TextField
          fullWidth
          placeholder="Volltext über Betreff, Body, Absender und Anhänge …"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: term ? (
              <InputAdornment position="end">
                <Tooltip title="Suchen">
                  <IconButton type="submit" edge="end">
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : null,
          }}
        />
      </Paper>

      {error && <Alert severity="error">{(error as Error).message}</Alert>}

      <Paper elevation={1} sx={{ height: 620 }}>
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
