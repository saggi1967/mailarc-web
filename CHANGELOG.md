# Changelog

Alle nennenswerten Änderungen an **mailarc-web** werden in dieser Datei dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
die Versionierung folgt dem Schema des `mailarc-server` (vierstellig).

## [Unreleased]

### In Arbeit
- **Favoriten / Gespeicherte Suchen (F1)** – „Suche speichern" in der Suche und eine
  Favoriten-Verwaltung (Liste, umbenennen, ändern, löschen, ausführen) auf Basis der
  neuen client-API `/api/searches` des `mailarc-server`. (Backend zuerst, UI folgt.)

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
