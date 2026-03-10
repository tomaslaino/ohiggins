# O'Higgins y Las Huertas — Bokföring

Enkel, professionell webbapp för bokföring och registrering för ekologisk fruktodling i Uruguay.

---

## Vad är detta?

- **Inloggning** med roller: Administrador och **Usuario** (tidigare Trabajador)
- **Bokföring**: ingreso/gasto med datum, kategori, valfritt **fruktyp**, belopp i **UYU eller USD**, beskrivning, betalmetod
- **Flexibla kategorier och frukttyper**: både admin och usuario kan lägga till under **Configuración**
- **Dashboard**: totaler per valuta (UYU/USD), balans, senaste poster, sammanfattning per kategori
- **Lista** med filter (datum, kategori, moneda, typ)
- **Informe**: rapport med datumfilter, totaler UYU/USD och per kategori
- **Användarhantering** (endast admin): lista användare

Gränssnittet är på **spanska** och **mobilvänligt**.

---

## Teknisk stack (och varför)

| Teknik | Roll | Varför just denna? |
|--------|------|---------------------|
| **Next.js 16** | React-ramverk, sidor + API | En kodbas för både frontend och backend, enkelt att köra lokalt med `npm run dev`. |
| **TypeScript** | Språk | Fångar fel tidigt och gör koden lättare att förstå. |
| **Prisma 6** | ORM mot databas | Tydlig datamodell i `prisma/schema.prisma`, typad åtkomst, enkla migreringar. |
| **SQLite** | Databas | Ingen separat databasserver – allt ligger i en fil (`prisma/dev.db`). Perfekt för lokalt utveckling och MVP; byt sen till t.ex. PostgreSQL om du vill. |
| **NextAuth (v5)** | Inloggning | Standard för Next.js: JWT-sessioner, skyddade routes, enkel rollhantering. |
| **Tailwind CSS** | Styling | Snabb, konsekvent design och enkel att göra mobil-first. |

---

## Krav

- **Node.js** 20 eller nyare  
- **npm** (följer med Node)

Kontrollera:

```bash
node -v   # ska visa t.ex. v20.x eller v22.x
npm -v
```

---

## Installation och start (exakta kommandon)

Öppna en terminal i projektmappen (`ohiggins`).

### 1. Installera paket (redan gjort om du klonat)

```bash
npm install
```

### 2. Skapa databas och tabeller

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Om du redan har en äldre databas och får fel vid migrering kan du återställa och köra om (all data raderas):

```bash
npx prisma migrate reset
npm run db:seed
```

Detta skapar filen `prisma/dev.db` och tabellerna `User`, `Category`, `FruitType` och `Entry`.

### 3. Fyll med demodata (användare + exempelposter)

```bash
npm run db:seed
```

Du får:
- **Admin**: `admin@ohiggins.com` / lösenord: `admin123`
- **Usuario**: `usuario@ohiggins.com` / lösenord: `usuario123`
- Standardkategorier och frukttyper samt exempelposter (UYU och USD)

### 4. Starta appen

```bash
npm run dev
```

Öppna webbläsaren på **http://localhost:3000**. Du omdirigeras till inloggning; logga in med någon av demoanvändarna ovan.

---

## Andra användbara kommandon

| Kommando | Betydelse |
|----------|-----------|
| `npm run dev` | Startar utvecklingsserver (hot reload). |
| `npm run build` | Bygger för produktion. |
| `npm run start` | Startar produktionsbuild (kör `npm run build` först). |
| `npx prisma studio` | Öppnar Prisma Studio för att bläddra/redigera databasen i en webbgränssnitt. |
| `npm run db:seed` | Kör seed igen (lägger till/uppdaterar demodata). |

---

## Projektstruktur – vad gör varje fil?

### Rotfiler

- **`package.json`** – Projektets beroenden och skript (`dev`, `build`, `db:seed` m.m.).
- **`.env.local`** – Lokala miljövariabler (t.ex. `AUTH_SECRET` för NextAuth). Används inte i git; skapa den om den saknas.
- **`prisma/schema.prisma`** – Databasschemat: modellerna `User` och `Entry`.
- **`prisma/seed.ts`** – Script som fyller databasen med demoanvändare och exempelposter.
- **`prisma/dev.db`** – SQLite-databasfilen (skapas av `prisma migrate dev`).

### `src/`

- **`src/auth.ts`** – NextAuth-konfiguration: inloggning med e-post/lösenord mot databasen, JWT-session, roll (ADMIN/TRABAJADOR) i sessionen.
- **`src/middleware.ts`** – Skyddar routes: skickar oinloggade till `/login`, admin-only-routes (t.ex. `/usuarios`) endast för ADMIN.
- **`src/lib/prisma.ts`** – En delad Prisma-klient så att vi inte skapar flera anslutningar i dev.
- **`src/lib/constants.ts`** – Konstanter: kategorier, typer (ingreso/gasto), betalmetoder, roller.

### `src/app/`

- **`layout.tsx`** – Rotlayout (titlar, teckensnitt, `<Providers>`).
- **`page.tsx`** – Startsida (redirect sker i middleware till `/login` eller `/dashboard`).
- **`providers.tsx`** – Wrapprar appen med NextAuth `SessionProvider` så att klienten kan använda session.
- **`globals.css`** – Globala färger och grundstilar (mjuka gröna toner, ingreso/gasto).

### Sidor

- **`login/page.tsx`** – Inloggningssida (e-post, lösenord, felmeddelande).
- **`(dashboard)/layout.tsx`** – Gemensam layout för inloggade sidor: sidebar med “O'Higgins y Las Huertas”, navigation (Inicio, Nueva entrada, Listado, Informe, Configuración, Usuarios för admin, Salir).
- **`(dashboard)/dashboard/page.tsx`** – Dashboard: totala ingreso/gasto, balans, senaste poster, sammanfattning per kategori.
- **`(dashboard)/nueva/page.tsx`** – Formulär för att skapa en ny bokföringspost.
- **`(dashboard)/entradas/page.tsx`** – Lista över alla poster med filter (datum, kategori, moneda, typ).
- **`(dashboard)/informe/page.tsx`** – Rapportvy med datumfilter, totaler UYU/USD och per kategori.
- **`(dashboard)/configuracion/page.tsx`** – Lägg till kategorier och frukttyper (alla inloggade användare).
- **`(dashboard)/informe/EntradasReportClient.tsx`** – Klientkomponent för datumfiltren på informesidan.
- **`(dashboard)/usuarios/page.tsx`** – Lista användare (endast synlig för ADMIN).

### API

- **`api/auth/[...nextauth]/route.ts`** – NextAuth:s API (signin, signout, session m.m.).
- **`api/entries/route.ts`** – **GET**: lista poster (query: `dateFrom`, `dateTo`, `categoryId`, `fruitTypeId`, `currency`, `type`). **POST**: skapa post (JSON: categoryId, fruitTypeId?, currency, amount, …).
- **`api/categories/route.ts`** – **GET**: lista categorier. **POST**: skapa kategori (JSON: name).
- **`api/fruit-types/route.ts`** – **GET**: lista frukttyper. **POST**: skapa frukttyp (JSON: name).

---

## Säkerhet (kort)

- Lösenord lagras **aldrig** i klartext; de hashas med bcrypt i seed och vid inloggning.
- Skyddade sidor kräver inloggning (middleware).
- `/usuarios` är begränsad till rollen ADMIN.
- API-routes kollar session innan de returnerar eller skriver data.
- Säkerhetsheaders: X-Frame-Options, X-Content-Type-Options, Referrer-Policy (se `next.config.ts`).

### För produktion (nätet)

1. **Miljövariabler**  
   Kopiera `.env.example` till `.env.local` (eller använd värdens konfiguration).  
   - **AUTH_SECRET** – obligatoriskt. Generera med: `openssl rand -base64 33`.  
   - **DATABASE_URL** – för produktion rekommenderas PostgreSQL (byt provider i `prisma/schema.prisma` och kör migrering).  
   - **NEXTAUTH_URL** – sätt till din publika URL (t.ex. `https://din-domän.com`).

2. **Byt lösenord** för demoanvändarna (admin/usuario) eller ta bort dem och skapa nya via registrering.

3. **HTTPS** – kör alltid bakom HTTPS (Vercel, Netlify, Railway m.fl. ger det automatiskt).

4. **Registrering** – `/registro` är öppen. Vill du endast inbjudna användare kan du ta bort eller skydda registreringsrouten (t.ex. med middleware eller inbjudningskod).

**Checklista innan du lägger ut på nätet:** Sätt AUTH_SECRET (t.ex. `openssl rand -base64 33`), NEXTAUTH_URL till din publika adress, byt lösenord för demoanvändare, och vid PostgreSQL: DATABASE_URL + `prisma migrate deploy`.

---

## Mobil och design

- Sidor och formulär är byggda **mobile-first** (stora knappar, läsbar text, enkel navigation).
- Färger: mjuka gröna toner, vit/ljus bakgrund, tydlig kontrast; ingreso i grönt, gasto i rött.

---

## Nästa steg (vidareutveckling)

- **Exportera poster** – t.ex. CSV eller Excel från listan/informe.
- **Bilaga/kvitto** – fält eller uppladdning av bild för varje post (kräver filagring, t.ex. S3 eller lokalt).
- **Fler roller eller rättigheter** – enkelt att bygga vidare på `session.user.role` i middleware och på sidor.
- **Byta till PostgreSQL** – ändra i `prisma/schema.prisma` (provider + url) och kör migrering igen; koden behöver i princip inte ändras.

Om något steg i README inte stämmer med din miljö kan du justera kommandona (t.ex. `pnpm` i stället för `npm`).
