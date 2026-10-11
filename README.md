# Prepd

Rezeptbuch, Einkaufsliste und Nährwerte für Meal Prep.

- `index.html` – die App (läuft auch per Doppelklick)
- `data.js` – Rezepte und Lebensmittel. **Wird von Claude gepflegt**, nicht in der App bearbeitet.

Die Einkaufsliste speichert aktuell im Browser. Für den Abgleich zwischen PC und Handy kommt Supabase dazu
(eine Tabelle mit dem Listen-Zustand, Zugriff mit dem Publishable Key, geschützt über RLS).

Änderung hochladen:
```
git add .
git commit -m "Kurze Beschreibung"
git push
```
