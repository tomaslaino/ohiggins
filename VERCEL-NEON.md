# Lägg ut appen med Vercel + Neon + GitHub

Steg-för-steg så att O'Higgins kör på nätet med GitHub, Neon (databas) och Vercel (webb).

**Dina steg (kort):** 1) Neon – konto + projekt, kopiera Pooled & Direct-URL:er. 2) GitHub – nytt repo, pusha koden. 3) Vercel – import från GitHub, lägg in env (DATABASE_URL, DIRECT_URL, AUTH_SECRET, ADMIN_CODE), Deploy. 4) Öppna din Vercel-URL → Registro → skapa första användaren.

---

## 1. Koden på GitHub

1. Skapa ett nytt repo på [github.com](https://github.com/new) (t.ex. `ohiggins`).
2. På din dator, i projektmappen:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DITT-ANVANDARNAMN/ohiggins.git
   git push -u origin main
   ```

   (Byt ut `DITT-ANVANDARNAMN/ohiggins` mot ditt repo.)

---

## 2. Databas på Neon

1. Gå till [neon.tech](https://neon.tech) och logga in (gratis konto).
2. **Create a project** → välj namn och region (t.ex. Stockholm).
3. Öppna projektet → **Connection details** (eller **Dashboard** → ditt projekt).
4. Kopiera:
   - **Pooled connection** → det här är `DATABASE_URL`
   - **Direct connection** → det här är `DIRECT_URL`

   Du ska ha två strängar som ser ut ungefär så här:

   ```
   postgresql://användare:lösenord@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   postgresql://användare:lösenord@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   Spara dem till nästa steg.

---

## 3. Vercel-projekt från GitHub

1. Gå till [vercel.com](https://vercel.com) och logga in (gärna med GitHub).
2. **Add New…** → **Project**.
3. **Import** ditt GitHub-repo (`ohiggins`).
4. **Configure Project**:
   - **Framework Preset**: Next.js (ska vara ifyllt).
   - **Root Directory**: låt stå tomt.
   - **Build Command**: `npm run build` (används redan i projektet).
   - **Output Directory**: standard.
5. Klicka **Environment Variables** och lägg till (samma namn som i `.env.example`):

   | Name           | Value                                                                 |
   |----------------|-----------------------------------------------------------------------|
   | `DATABASE_URL` | Den **pooled** connection-strängen från Neon (hela strängen).        |
   | `DIRECT_URL`   | Den **direct** connection-strängen från Neon (hela strängen).        |
   | `AUTH_SECRET`  | Minst 32 tecken. T.ex. generera: `openssl rand -base64 33`           |
   | `ADMIN_CODE`   | Din hemliga admin-kod (samma som du vill använda när du loggar in).  |

   **NEXTAUTH_URL** behöver du oftast inte fylla i – Vercel sätter automatiskt din webbadress (t.ex. `https://ohiggins-xxx.vercel.app`) under deploy.

6. Klicka **Deploy**.

Vercel kör då `npm run build`, som i detta projekt gör:

- `prisma generate`
- `prisma migrate deploy` (sätter upp tabellerna i Neon)
- `next build`

Om något av stegen i **Build** faller, kolla loggen på Vercel. Vanliga fel:

- Fel `DATABASE_URL`/`DIRECT_URL` → dubbelkolla att båda är klistrade från Neon utan extra mellanslag.
- Fel vid `prisma migrate deploy` → kontrollera att båda URL:erna har `?sslmode=require` (Neon kräver SSL).

---

## 4. Efter första deploy

- Öppna din Vercel-URL (t.ex. `https://ohiggins-xxx.vercel.app`).
- Du ska komma till inloggning. Det finns inga användare än – databasen är tom.

**Skapa första användaren:**

1. Gå till **Registro** (registrera) och skapa ett konto.
2. För att göra det till admin: antingen köra seed (nedan) eller manuellt sätta rollen i Neon (SQL: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'din@epost.com';`).

**Vill du ha demo-data (kategorier, användare, exempelentradas):**

Kör seed **en gång** mot samma databas, med samma `DATABASE_URL`/`DIRECT_URL` som Vercel använder:

```bash
# I projektmappen, med .env.local satt till Neon-URL:erna (samma som på Vercel):
npm run db:seed
```

Då skapas bland annat `admin@ohiggins.com` / `usuario@ohiggins.com` med lösenord enligt seed-filen. Byt lösenord i appen efteråt om du vill.

---

## 5. Uppdatera appen senare

När du pushar till GitHub (t.ex. `main`) bygger och deployar Vercel automatiskt:

```bash
git add .
git commit -m "Beskrivning av ändringen"
git push
```

---

## 6. Bilder (foton på entradas)

Bilder sparas idag i `public/uploads/entries/`. På Vercel är filsystemet tillfälligt – uppladdade bilder försvinner vid nästa deploy. För att ha kvar bilder i produktion behöver du senare koppla extern lagring (t.ex. S3 eller Vercel Blob) och spara sökvägar i databasen. Tills dess fungerar allt utom bildlagring.

---

## Lokal utveckling

Använd samma Neon-URL:er i `.env.local` (`DATABASE_URL` och `DIRECT_URL`) så att du kör mot samma databas. Kör sedan `npm run dev`. Vill du ha demo-data: `npm run db:seed`.

---

## Sammanfattning

| Tjänst  | Roll                         |
|---------|------------------------------|
| **GitHub** | Källkod, push = ny deploy   |
| **Neon**   | PostgreSQL (databas)         |
| **Vercel** | Bygg och drift av Next.js-appen |

Env-variabler som ska finnas på Vercel: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, och (om du vill) `ADMIN_CODE`. Därefter är det bara att använda din Vercel-URL för att logga in och använda appen på nätet.
