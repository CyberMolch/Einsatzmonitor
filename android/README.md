# Einsatzmonitor (Android)

Zeigt die aktuellen Alarmierungen vom Pager-Server `http://pipager.dyndns.org:211/pager/DME.txt` als Einsatzliste mit Karte.

## Funktionen
- Liest das Pager-Log alle 30 Sekunden neu (einstellbar unter ⚙)
- Bündelt die Alarmierungen der einzelnen Schleifen (RIC) zu einem Einsatz
- Filter Brand / Hilfeleistung, Suche nach Ort, Straße, Einheit
- Karte (OpenStreetMap) mit Einsatzorten; Ortssuche über OpenStreetMap Nominatim, eingegrenzt auf den Landkreis Wittenberg
- Android-Benachrichtigung mit Alarmton bei neuem Einsatz, solange die App läuft (im Vordergrund sicher, im Hintergrund nur bis Android sie anhält)
- „Navigation starten“ öffnet Google Maps, OsmAnd oder eine andere Navi-App
- „Display an“ hält den Bildschirm eingeschaltet (für ein Monitor-Tablet im Gerätehaus)

## APK bauen

**Variante A, ohne eigene Installation (GitHub):**
1. Bei jeder Änderung im Ordner `android/` läuft unter „Actions“ automatisch „APK bauen“ (ca. 3–4 Minuten). Manuell starten geht über „Run workflow“.
2. Im fertigen Lauf unten bei „Artifacts“ die Datei `Einsatzmonitor-APK` herunterladen, entpacken, `app-debug.apk` aufs Handy kopieren und installieren (Installation aus unbekannten Quellen erlauben).

**Variante B, Android Studio:**
Ordner `android/` mit „Open“ öffnen, Gradle-Sync abwarten, dann *Build → Build App Bundle(s) / APK(s) → Build APK(s)*.

## Anpassen
Die gesamte Oberfläche steckt in `app/src/main/assets/index.html`. Server-Adresse, Intervall und Kartengebiet lassen sich auch direkt in der App unter ⚙ ändern.

## Grenzen
- Geschlossene App = keine Abfrage. Für Alarme bei geschlossener App bräuchte es einen Hintergrunddienst (Foreground Service).
- Die Pager-Texte sind vom Server bereits gekürzt (`<EO`); die App zeigt sie so vollständig wie geliefert.
- Ortsangaben ohne Straße (z. B. „B 107 Coswig-Abzweig Köselitz“) werden auf den nächstpassenden Ort gesetzt und als ungefähr markiert.
