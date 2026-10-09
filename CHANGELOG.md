# Changelog

Alle nennenswerten Änderungen an **mailarc-web** werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
die Versionierung folgt dem Schema des `mailarc-server` (vierstellig).

## [Unreleased]

### Hinzugefügt
- **Favoriten / Gespeicherte Suchen – Feature F1 (Speichern & CRUD).**
  - „Suche speichern" (Lesezeichen-Symbol neben „Suchen"): die aktuell angewandten
    Filter als benannten Favorit ablegen. Gleicher Name überschreibt den vorhandenen
    Favorit (so ändert man dessen Parameter: laden → anpassen → gleicher Name).
  - Neue Seite **Favoriten** (`/searches`): auflisten, ausführen (lädt die Suche in die
    Suchmaske), umbenennen und löschen.
  - Gemeinsames Filter-Modul `src/search/filters.ts` (URL ⇄ Zustand ⇄ API-Parameter,
    inkl. Rückabbildung gespeicherter Parameter) — aus der Suchseite extrahiert.
  - Nutzt die client-API `/api/searches` des `mailarc-server` (2.7.0.0).
- **Erweiterte Suche – Stufe A (Regex):** Hinweis in den Suchfiltern, dass Werte in
  `/…/` als regulärer Ausdruck ausgewertet werden (Von, An, Domain, Ordner) — serverseitig
  seit `mailarc-server` 2.8.0.0.
- **Erweiterte Suche – B1 (MQL):** neuer Modus **„Experte (MQL)"** in der Suche mit
  **CodeMirror-6-Editor** (Syntax-Highlighting + Feld-Autovervollständigung). Führt den
  Ausdruck über `POST /api/search/mql` aus; Syntaxfehler werden inline mit Position
  angezeigt. Modus & Ausdruck liegen im URL-Zustand (`?mode=mql&mql=…`).
- **Erweiterte Suche – B2 (Teil):** Round-Trip **Formular → MQL** — der Wechsel in den
  Experten-Modus übernimmt die aktuelle Formularsuche als MQL-Ausdruck. Autovervollständigung
  jetzt auch für **Werte** (`has:`, `date`/`zeit`, `filetype`) und das Schlüsselwort
  `foreach`. `foreach FELD in [a, b]: …` (Vereinigung) wird vom Server ab 2.8.1.0 ausgeführt.
- **Erweiterte Suche – Rückweg MQL → Formular:** der Wechsel von Experte (MQL) zurück ins
  Formular übernimmt den flach abbildbaren Teil des Ausdrucks; nicht darstellbare Teile
  (ODER/NICHT/Klammern/`foreach`/Größe) werden weggelassen und per Hinweis gemeldet.

## [0.4.0] – 2026-08-21

Erster dokumentierter Stand des React-Frontends für das zentrale mailarc-Archiv.
Spricht ausschließlich die client-API (`/api`) des `mailarc-server` (Session-Cookie-Auth).

### Hinzugefügt
- **Suche** mit allen CLI-Filtern im UI: Zeitraum, Von/An, Domain, Betreff, Anhang-Name,
  Ordner, Phrase.
- **Suchzustand in der URL** – „Zurück" erhält Treffer und Filter (teilbare Links).
- **Benutzerverwaltung** im UI (nur Admin): Anlegen, Bearbeiten, Löschen, Rollen.
- **Self-Service-Passwortwechsel** für angemeldete Benutzer.
- **Statistik-Dashboard**, **Kontenverwaltung** und App-Navigation (Phase 3).
- Grundgerüst: Vite + React + TypeScript + Material UI, react-router, TanStack Query.
- Professionelle README.

[Unreleased]: https://github.com/saggi1967/mailarc-web/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/saggi1967/mailarc-web/releases/tag/v0.4.0
