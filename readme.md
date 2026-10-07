# HNO-Attendorn Praxis

Moderne statische Website für die HNO-Attendorn Praxis in Attendorn. Die Inhalte können ohne Programmierkenntnisse über Pages CMS bearbeitet und anschließend automatisch über GitHub Pages veröffentlicht werden.

## Einmalige Einrichtung für den Eigentümer

1. Auf [app.pagescms.org](https://app.pagescms.org/) mit GitHub anmelden.
2. Die Pages-CMS-GitHub-App ausschließlich für das Repository `hmooda11/hno-attendorn` installieren.
3. In GitHub unter **Settings → Pages → Build and deployment** als Quelle **GitHub Actions** auswählen.
4. Die Person, die Inhalte bearbeiten soll, als GitHub-Collaborator mit Schreibzugriff auf genau dieses Repository einladen.

Damit darf nur eine autorisierte Person Inhalte speichern. Die öffentliche Website erhält keinen Adminbereich und speichert keine Patientendaten.

## Website bearbeiten

1. [app.pagescms.org](https://app.pagescms.org/) öffnen und mit dem eingeladenen GitHub-Konto anmelden.
2. Das Repository `hno-attendorn` und anschließend **Website bearbeiten** auswählen.
3. Texte, Kontaktdaten, Sprechzeiten, Leistungen oder Praxisbilder ändern.
4. Bei jedem Bild eine kurze, sachliche Bildbeschreibung eintragen. Möglichst JPG, WebP oder AVIF verwenden; große Bilder werden beim Veröffentlichen automatisch verkleinert und optimiert.
5. **Speichern** wählen. Die Änderung wird sofort zur Veröffentlichung eingereicht und erscheint üblicherweise nach wenigen Minuten auf der Website.

Die Öffnungszeiten dürfen leer sein, wenn die Praxis an einem Tag geschlossen ist. Uhrzeiten werden im 24-Stunden-Format eingegeben, zum Beispiel `08:00` und `12:00`. Es sind bis zu drei getrennte Zeiträume pro Tag möglich.

Bitte keine Patientennamen, medizinischen Angaben oder andere vertrauliche Daten in Pages CMS eintragen.

## Veröffentlichung prüfen

Der aktuelle Stand ist im GitHub-Repository unter **Actions → Website veröffentlichen** sichtbar:

- Grün: Die Website wurde erfolgreich veröffentlicht.
- Gelb: Die Veröffentlichung läuft noch.
- Rot: Der neue Inhalt war ungültig oder der Build ist fehlgeschlagen. Die bisherige Website bleibt online.

## Frühere Version wiederherstellen

Jede Speicherung wird in GitHub protokolliert. Ein Administrator kann eine fehlerhafte Änderung mit folgendem Befehl rückgängig machen:

```bash
git revert <commit-id>
git push origin main
```

Das Zurücksetzen löst automatisch eine neue Veröffentlichung aus. Die Historie sollte nicht mit `git reset` oder durch Löschen des Branches verändert werden.

## Technische Struktur

- `content/site.json` ist die einzige Quelle für editierbare Website-Inhalte.
- `.pages.yml` definiert die deutschsprachigen Eingabeformulare und Medienregeln.
- `public/content/images/` enthält die über das CMS verwalteten Bilder.
- `.github/workflows/deploy-pages.yml` prüft, baut und veröffentlicht jede Änderung an `main`.
- `docs/` ist generierte Ausgabe für GitHub Pages und darf nicht manuell bearbeitet werden.

Kontaktangaben, sichtbare Sprechzeiten, der Hinweis für den aktuellen Tag und strukturierte Suchmaschinendaten werden aus derselben Inhaltsquelle erzeugt.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Inhalte prüfen und Tests ausführen:

```bash
npm run validate:content
npm test
```

GitHub-Pages-Ausgabe erzeugen:

```bash
npm run build:pages
```

Sites-kompatible Ausgabe erzeugen:

```bash
npm run build
```
