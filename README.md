# Streamazon

Premium-Minecraft-Shop mit Admin-Bereich. Technik: React (Vite), Tailwind CSS, Supabase (Datenbank, Login, Bildspeicher), GitHub Pages (Veröffentlichung).

## Was die Seite kann
- Shop ohne Kundenkonto: Bestellen mit Pflichtfeld Ingame-Name, Warenkorb, Lieferoptionen mit Diamanten-Aufpreis, Anfragen (Bau, Terraforming, Item-Wunsch).
- Öffentlicher Tab „Bestellungen“ mit Status, Prozent-Fortschritt und Stand je Produkt, ohne Kundennamen.
- Tab „So geht’s“ (einfaches Deutsch und Unc-Version).
- Admin (nur Login für Admins, erreichbar über „Admin“ im Footer): Bestellungen (Status, Fortschritt je Produkt), Produkte (inkl. Durchstreichen, Angebot, Bild-Upload), Erze & Preise (Roherz/Barren), Verzauberungen & Preise, Lieferoptionen, Kategorien.

## Einrichtung (einmalig)
1. **Supabase**: Auf supabase.com ein Projekt anlegen. Im Menü „SQL Editor“ den kompletten Inhalt von `supabase/schema.sql` einfügen und ausführen. Das legt Tabellen, Sicherheitsregeln, Bildspeicher und die Demo-Startdaten an.
2. **Registrierung ausschalten**: „Authentication“ > „Sign In / Providers“ (je nach Version „Settings“) > „Allow new users to sign up“ deaktivieren. Es gibt keine Kundenkonten.
3. **Admin-Konto**: „Authentication“ > „Users“ > „Add user“ > E-Mail und Passwort eintragen, „Auto Confirm User“ anhaken. Danach im SQL Editor ausführen (E-Mail anpassen):
   `insert into admins select id from auth.users where email='deine@mail.de';`
   Nur Konten in der Tabelle `admins` haben Admin-Rechte. Weitere Admins genauso hinzufügen.
4. **Schlüssel holen**: „Project Settings“ > „API“: `Project URL` und den **anon public** Key notieren. Den `service_role`-Key niemals verwenden oder weitergeben.
5. **GitHub**: Neues Repository anlegen und den Inhalt dieses Ordners hochladen (Branch `main`). Unter „Settings“ > „Secrets and variables“ > „Actions“ zwei Secrets anlegen: `VITE_SUPABASE_URL` (Project URL) und `VITE_SUPABASE_ANON_KEY` (anon public Key). Unter „Settings“ > „Pages“ bei „Source“ **GitHub Actions** wählen.
6. **Veröffentlichen**: Ein Push auf `main` baut und veröffentlicht die Seite automatisch (Tab „Actions“). Die Adresse steht danach unter „Settings“ > „Pages“. Eine eigene Domain lässt sich dort ebenfalls eintragen.

## Lokal testen (optional)
`.env.example` nach `.env` kopieren und ausfüllen, dann `npm install` und `npm run dev`.

## Wichtig zu wissen
- Der anon-Key ist öffentlich und darf im Frontend stehen. Geschützt wird alles durch die Regeln (Row Level Security) in `schema.sql`.
- Kundennamen und Notizen sind nur für Admins lesbar. Der öffentliche Tab nutzt die Ansicht `public_orders` ohne diese Felder.
- Die Gesamtsumme einer Bestellung kommt vom Browser des Kunden und wird nicht serverseitig nachgerechnet. Ihr prüft sie bei der Bearbeitung im Admin.
- Es gibt keinen Spam-Schutz für Bestellungen. Bei Missbrauch kann man später ein Captcha oder Limits ergänzen.
- Produkte mit der Markierung DEMO sind Beispieldaten. Beim Speichern im Admin verlieren sie die Markierung. Demo-Produkte löschen: im Admin die Produktliste bearbeiten oder im Supabase „Table Editor“ in `products` die Zeilen mit `demo = true` entfernen.
- Produktbilder: im Admin beim Produkt hochladen (landen im Speicher `media`) oder eine Bild-URL eintragen. Es sind keine fremden Texturen enthalten, bis dahin zeigt der Shop einen Platzhalter.
- Kategorien mit den Kennungen `erze`, `waffen` und `custom` haben feste Funktionen (Erz-Preise, Verzauberungen, Item-Wunsch).
- Das Logo: Der Schriftzug „STREAMAZON“ steht in `src/App.jsx` in der Kopfzeile und lässt sich dort durch ein Bild ersetzen.
