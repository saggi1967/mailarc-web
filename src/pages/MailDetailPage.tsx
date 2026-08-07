import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import { api, urls } from "../api/client";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toLocaleString("de-DE", { dateStyle: "full", timeStyle: "short" });
}

function fmtSize(n: number): string {
  const u = ["B", "KB", "MB", "GB"];
  let f = n;
  let i = 0;
  while (f >= 1024 && i < u.length - 1) {
    f /= 1024;
    i++;
  }
  return `${i === 0 ? f : f.toFixed(1)} ${u[i]}`;
}

export default function MailDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const mail = useQuery({ queryKey: ["email", id], queryFn: () => api.email(id) });
  const atts = useQuery({ queryKey: ["attachments", id], queryFn: () => api.attachments(id) });

  if (mail.isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (mail.error) return <Alert severity="error">{(mail.error as Error).message}</Alert>;
  const m = mail.data!;

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Zurück
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          component={Link}
          href={urls.pdf(id)}
          target="_blank"
          rel="noopener"
        >
          Als PDF
        </Button>
      </Stack>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {m.subject || <em>(kein Betreff)</em>}
        </Typography>
        <Stack spacing={0.5}>
          <Field label="Von" value={`${m.from_name ?? ""} <${m.from_addr ?? "—"}>`} />
          <Field label="An" value={m.to?.join(", ") || "—"} />
          {m.cc?.length > 0 && <Field label="Cc" value={m.cc.join(", ")} />}
          <Field label="Datum" value={fmtDate(m.date)} />
          <Field label="Ordner" value={`${m.mailbox}  ·  uid=${m.uid}`} />
        </Stack>
      </Paper>

      {atts.data && atts.data.count > 0 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Anhänge ({atts.data.count})
          </Typography>
          <List dense disablePadding>
            {atts.data.attachments.map((a) => (
              <ListItem
                key={a.index}
                secondaryAction={
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    component={Link}
                    href={urls.attachment(id, a.index)}
                  >
                    Laden
                  </Button>
                }
              >
                <ListItemText
                  primary={a.filename || `Anhang ${a.index}`}
                  secondary={`${a.content_type ?? "—"} · ${fmtSize(a.size)}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Inhalt</Typography>
          {m.has_attachment && <Chip size="small" label={`${m.attachment_count} Anhang/Anhänge`} />}
        </Stack>
        <Divider sx={{ mb: 1 }} />
        <Typography
          component="pre"
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", m: 0 }}
        >
          {m.body || "(kein Text — für das Original „Als PDF“ öffnen)"}
        </Typography>
      </Paper>
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" sx={{ minWidth: 64, fontWeight: 600, color: "primary.main" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Stack>
  );
}
