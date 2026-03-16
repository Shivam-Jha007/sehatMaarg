# 🩺 SehatMaarg — Symptom se Specialist Tak, Aapka Digital Saathi

**SehatMaarg** is an AI-powered health assistant that helps users identify the right medical specialist based on their symptoms, locates nearby clinics and hospitals on an interactive map, and enables emergency contact alerts with live GPS location.

> _"Bridging the gap between symptom onset and the right healthcare provider."_

---

[link] (https:/sehat-maarg.vercel.app)

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [How It Works](#-how-it-works)
- [Setup & Installation](#-setup--installation)
- [Deployment (Vercel)](#-deployment-vercel)
- [Database Setup (Supabase)](#-database-setup-supabase)
- [API Details](#-api-details)
- [Challenges Faced](#-challenges-faced)
- [Future Scope](#-future-scope)
- [Disclaimer](#-disclaimer)

---

## 🎯 Problem Statement

In India, many people — especially in semi-urban and rural areas — struggle to identify which doctor to visit when they fall ill. Delayed or incorrect specialist visits lead to wasted time, money, and worsened health outcomes. There is no simple, accessible tool that bridges the gap between symptom onset and reaching the right healthcare provider.

---

## 💡 Solution

SehatMaarg provides a fast, intelligent, and accessible digital health assistant that:

1. **Analyzes symptoms using AI** to recommend the appropriate medical specialist and assess urgency.
2. **Locates nearby clinics and hospitals** on an interactive map with tier-based color coding.
3. **Detects medical emergencies** and auto-loads the nearest hospitals with emergency guidance.
4. **Enables emergency contact alerts** — logged-in users can call or SMS their saved contact with their live GPS location.
5. **Supports voice input** — users can speak their symptoms for hands-free accessibility.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Symptom Analysis** | Natural language input analyzed by Google Gemini 2.5 Flash. Factors in age, gender, and pre-existing conditions. |
| **Specialist Recommendation** | Returns the type of doctor to visit (e.g., Cardiologist, Dermatologist). |
| **Urgency Detection** | Classifies urgency as Low, Medium, or High with color-coded badges. |
| **Interactive Map** | Leaflet.js map with real-time geolocation and manual location search. |
| **Tier-Coded Markers** | Clinics are color-coded: 🟢 Budget, 🟡 Moderate, 🔴 Premium. |
| **Emergency Mode** | High urgency → hospitals-only mode (5 km radius, red markers, emergency advice). |
| **Emergency Contact Alerts** | One-tap Call or SMS to saved contacts with auto-generated GPS location and Google Maps link. |
| **User Authentication** | Secure email/password login via Supabase with password reset support. |
| **Voice Input** | Microphone-based symptom entry using the Web Speech API. |
| **Responsive Design** | Fully mobile-friendly, works on any device. |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | UI, styling, and app logic |
| **AI/ML** | Google Gemini 2.5 Flash API (v1beta) | Symptom analysis and specialist recommendation |
| **Maps** | Leaflet.js, OpenStreetMap | Interactive map rendering |
| **Clinic Data** | Overpass API | Querying nearby clinics/hospitals from OpenStreetMap |
| **Geocoding** | Nominatim (OpenStreetMap) | Converting place names to coordinates |
| **Auth & Database** | Supabase (PostgreSQL + Auth) | User authentication, emergency contact storage |
| **Voice** | Web Speech API | Browser-native speech-to-text |
| **Deployment** | Vercel | Static site hosting with environment variable support |

---

## 📁 Project Structure

```
sehatMaarg/
├── index.html          # Main application UI
├── about.html          # About page (project info, disclaimer)
├── style.css           # All styles (brand theme, modals, responsive)
├── ai.js               # Gemini API integration (prompt + parse)
├── map.js              # Leaflet map, geolocation, Overpass queries
├── auth.js             # Supabase auth + emergency contact CRUD
├── script.js           # Main orchestrator (form, modals, voice, emergency flow)
├── config.js           # API keys (gitignored — never committed)
├── config.example.js   # Template with placeholder keys (committed)
├── build.sh            # Vercel build script (generates config.js from env vars)
├── logo.png            # Brand logo
├── .gitignore          # Ignores config.js, node_modules, OS files
└── README.md           # This file
```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User (Browser)                     │
│                                                      │
│  index.html ─── style.css                            │
│      │                                               │
│  script.js (orchestrator)                            │
│      ├── ai.js ──────────► Google Gemini 2.5 Flash   │
│      │                     (symptom → specialist)     │
│      │                                               │
│      ├── map.js ─────────► Geolocation API           │
│      │   ├───────────────► Overpass API (clinics)     │
│      │   └───────────────► Nominatim (geocoding)      │
│      │                                               │
│      └── auth.js ────────► Supabase                  │
│          ├───────────────► Auth (login/signup)        │
│          └───────────────► PostgreSQL (contacts)      │
│                                                      │
│  [Emergency] → SMS/Call with GPS location            │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 How It Works

### Normal Flow
1. User enters symptoms (text or voice), optionally providing age, gender, and existing conditions.
2. `ai.js` sends the data to **Gemini 2.5 Flash** with a structured system prompt.
3. Gemini returns a JSON response: `{ specialist, urgency, explanation }`.
4. `script.js` displays the recommendation with a color-coded urgency badge.
5. `map.js` auto-detects the user's GPS location and fetches nearby clinics/hospitals via the **Overpass API**.
6. Clinics are shown on a **Leaflet.js** map with tier-based color coding.

### Emergency Flow (Urgency = High)
1. The emergency warning card appears with a pulsing red border.
2. Hospitals are auto-loaded within a **5 km radius** (wider than normal 3 km).
3. If the user is **logged in** and has **saved emergency contacts**:
   - Call and SMS buttons appear for each contact.
   - SMS is pre-filled with: `"EMERGENCY: I may need immediate medical help. My location: [GPS coordinates] [Google Maps link] — Sent via SehatMaarg"`

---

## ⚙️ Setup & Installation

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox)
- [Google AI API Key](https://aistudio.google.com/apikey) (Gemini)
- [Supabase Project](https://supabase.com/) (for auth + contacts)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sehatMaarg.git
   cd sehatMaarg
   ```

2. **Create your config file:**
   ```bash
   cp config.example.js config.js
   ```

3. **Add your API keys** in `config.js`:
   ```js
   const CONFIG = {
     GEMINI_API_KEY: "your-real-gemini-key",
     SUPABASE_URL: "https://your-project.supabase.co",
     SUPABASE_ANON_KEY: "your-supabase-anon-key",
   };
   ```

4. **Serve locally** (any static server):
   ```bash
   npx serve .
   ```
   Or open `index.html` directly (note: voice input and geolocation require HTTPS or localhost).

---

## 🚀 Deployment (Vercel)

1. Push your code to GitHub (make sure `config.js` is in `.gitignore`).

2. Import the repo on [Vercel](https://vercel.com/).

3. Set **environment variables** in Vercel project settings:
   | Variable | Value |
   |----------|-------|
   | `GEMINI_API_KEY` | Your Google AI API key |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon/public key |

4. Set build settings:
   - **Build Command:** `sh build.sh`
   - **Output Directory:** `.`

5. Deploy. The `build.sh` script auto-generates `config.js` from environment variables at build time.

---

## 🗄 Database Setup (Supabase)

### 1. Create the `profiles` table

Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  contact1 TEXT,
  contact2 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Enable Row Level Security (RLS)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id);
```

> **Important:** The `id` column must be `UUID`, not `bigint`. Using `bigint` causes RLS policy failures because `auth.uid()` returns a UUID.

---

## 📡 API Details

### Google Gemini 2.5 Flash
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- **Auth:** API key passed as URL parameter (`?key=...`)
- **Config:** `temperature: 0.3`, `maxOutputTokens: 2048`
- **Rate Limit (Free Tier):** 20 requests/minute

### Overpass API (OpenStreetMap)
- **Endpoint:** `https://overpass-api.de/api/interpreter`
- **Normal mode:** Queries `clinic`, `hospital`, `doctors` within 3 km
- **Emergency mode:** Queries `hospital` nodes and ways within 5 km
- **No API key required**

### Nominatim Geocoder
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Usage:** Converts text location queries to lat/lng coordinates
- **No API key required** (respect usage policy: 1 req/sec)

### Supabase
- **Auth:** `supabase.auth.signUp()`, `signInWithPassword()`, `signOut()`, `resetPasswordForEmail()`
- **Database:** PostgreSQL with RLS. CRUD on `profiles` table.

---

## 🧗 Challenges Faced

| Challenge | Root Cause | Solution |
|-----------|-----------|----------|
| **Supabase RLS "new row violates policy"** | `profiles.id` was `bigint` (auto-increment), but `auth.uid()` returns `UUID` — type mismatch | Dropped table and recreated with `id UUID PRIMARY KEY REFERENCES auth.users(id)` |
| **Supabase upsert failing under RLS** | `.upsert()` doesn't work reliably with certain RLS configurations | Switched to explicit `SELECT → INSERT/UPDATE` pattern |
| **Gemini API truncated responses** | `maxOutputTokens` was set to 300 | Increased to 2048 |
| **Hidden form field blocking submission** | Password field had `required` attribute even when hidden (forgot password mode) | Dynamically toggle `required` with `setAttribute`/`removeAttribute` |
| **Inaccurate geolocation** | Default geolocation settings returned approximate position | Set `enableHighAccuracy: true` + added Nominatim as manual fallback |
| **Voice input silent failures** | Web Speech API requires HTTPS; mic permission wasn't being requested first | Added explicit `getUserMedia` call before `SpeechRecognition.start()` |
| **Vercel build command too long** | 256-character limit on Vercel build command field | Created `build.sh` script to generate `config.js` from env vars |
| **API key exposure in GitHub** | Keys were hardcoded in source files | Moved to `config.js` (gitignored) + `config.example.js` (committed) pattern |

---

## 🔮 Future Scope

- 🌐 **Multi-language support** — Hindi, regional Indian languages
- 🚑 **Ambulance dispatch integration** — Connect with emergency vehicle APIs
- 📅 **Appointment booking** — Book directly with listed clinics
- 📊 **Health history tracking** — Store past analyses for returning users
- 🤖 **Chatbot mode** — Conversational follow-up questions for better diagnosis
- 📱 **PWA support** — Installable on mobile devices for offline access

---

## ⚠️ Disclaimer

SehatMaarg **does not provide medical diagnosis**. It is a triage assistance tool that suggests specialist types based on symptoms. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment. Do not delay seeking emergency medical care based on this tool's output.

---

## 📄 License

This project is built for educational and demonstration purposes.

---

<p align="center">
  Built with ❤️ by the SehatMaarg team
</p>
