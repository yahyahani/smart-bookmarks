# Smart Bookmarks

A bookmark manager that automatically fetches a preview (title, description, image, and favicon) for any link you save — no manual copy-pasting required.

Paste a URL, and the app scrapes the page's metadata for you, the same way Twitter or WhatsApp generates a rich preview when you share a link.

## Features

- 🔐 **Authentication** — secure registration and login with JWT and bcrypt password hashing
- 🔗 **Automatic link previews** — scrapes title, description, image, and favicon from any URL using Open Graph metadata
- 🏷️ **Tags** — organize bookmarks with custom tags
- 🔍 **Search** — filter bookmarks by title, description, or tag
- 🗑️ **Full CRUD** — add, update, and delete bookmarks
- 🔒 **Per-user data isolation** — every user only ever sees their own bookmarks

## Tech stack

**Backend**
- Node.js + Express
- PostgreSQL (via `pg`)
- JWT for authentication, bcrypt for password hashing
- Cheerio for HTML parsing / web scraping

**Frontend**
- React (Vite)
- Plain CSS (no framework) with a custom design system

## Screenshots

*(Add a screenshot or two of the dashboard here — drag an image into the GitHub README editor, or place it in a `docs/` folder and reference it with `![Dashboard](docs/dashboard.png)`)*

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher, for native `fetch` support)
- [PostgreSQL](https://www.postgresql.org/) running locally

### 1. Clone the repository
```bash
git clone https://github.com/yahyahani/smart-bookmarks.git
cd smart-bookmarks
```

### 2. Set up the database
```bash
createdb smart_bookmarks
```

### 3. Set up the backend
```bash
cd server
npm install
cp .env.example .env
```
Open `.env` and fill in your database credentials and a random `JWT_SECRET` (you can generate one with `openssl rand -hex 32`).

Create the tables:
```bash
psql smart_bookmarks -f src/db/schema.sql
```

Start the server:
```bash
npm run dev
```
The API will run on `http://localhost:3001` (or whatever port you set in `.env`).

### 4. Set up the frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## API overview

| Method | Endpoint              | Description                          | Auth required |
|--------|------------------------|---------------------------------------|----------------|
| POST   | `/api/auth/register`   | Create a new account                  | No             |
| POST   | `/api/auth/login`      | Log in and receive a JWT              | No             |
| GET    | `/api/bookmarks`       | List bookmarks (supports `?search=` and `?tag=`) | Yes |
| POST   | `/api/bookmarks`       | Add a bookmark (scrapes metadata automatically) | Yes |
| PATCH  | `/api/bookmarks/:id`   | Update a bookmark's title or tags     | Yes            |
| DELETE | `/api/bookmarks/:id`   | Delete a bookmark                     | Yes            |

Authenticated requests require an `Authorization: Bearer <token>` header.

## Project structure

```
smart-bookmarks/
├── server/                 # Express API
│   └── src/
│       ├── controllers/    # Request handling logic
│       ├── models/         # Database queries
│       ├── middleware/     # JWT auth middleware
│       ├── routes/         # API route definitions
│       ├── utils/          # Web scraping logic
│       └── db/             # Database connection + schema
└── client/                 # React frontend
    └── src/
        ├── pages/          # Auth and Dashboard pages
        ├── components/     # Reusable UI components
        └── api/            # API client
```

## What I learned building this

This project was built to practice full-stack fundamentals: JWT-based authentication, relational database design with foreign keys, building a REST API with proper authorization checks, and basic web scraping with Cheerio.

## License

MIT
