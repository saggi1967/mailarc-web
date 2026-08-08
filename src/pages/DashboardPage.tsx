import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Card, CardContent, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { api } from "../api/client";
import type { StatsSummary } from "../api/types";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function fmtSize(n: number): string {
  const u = ["B", "KB", "MB", "GB", "TB"];
  let f = n;
  let i = 0;
  while (f >= 1024 && i < u.length - 1) {
    f /= 1024;
    i++;
  }
  return `${i === 0 ? f : f.toFixed(1)} ${u[i]}`;
}

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v.slice(0, 10) : d.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5">{value}</Typography>
      </CardContent>
    </Card>
  );
}

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <Paper elevation={1} sx={{ p: 2, height: "100%" }}>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {data.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            keine Daten
          </Typography>
        )}
        {data.map(([label, n]) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" sx={{ width: 90, flexShrink: 0 }} noWrap title={label}>
              {label}
            </Typography>
            <Box sx={{ flexGrow: 1, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
              <Box sx={{ width: `${(n / max) * 100}%`, bgcolor: "primary.main", height: 16, minWidth: 2 }} />
            </Box>
            <Typography variant="caption" sx={{ width: 48, textAlign: "right" }}>
              {n}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<StatsSummary>({ queryKey: ["stats"], queryFn: api.stats });

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;
  const s = data!;

  const perYear: [string, number][] = Object.entries(s.per_year).sort(([a], [b]) => a.localeCompare(b));
  const perWeekday: [string, number][] = Array.from({ length: 7 }, (_, i) => [
    WEEKDAYS[i],
    s.per_weekday[String(i)] ?? 0,
  ]);

  return (
    <Stack spacing={2}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        <Tile label="Mails" value={s.total.toLocaleString("de-DE")} />
        <Tile label="Gesamtgröße" value={fmtSize(s.total_size)} />
        <Tile label="Absender" value={s.distinct_senders.toLocaleString("de-DE")} />
        <Tile label="Zeitraum" value={`${fmtDate(s.span_start)} – ${fmtDate(s.span_end)}`} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Bars title="Mails pro Jahr" data={perYear} />
        <Bars title="Mails pro Wochentag" data={perWeekday} />
      </Box>
      <Bars title="Top-Absender" data={s.top_senders} />
    </Stack>
  );
}
