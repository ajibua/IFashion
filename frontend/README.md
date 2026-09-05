# ✦ IFASHION — Frontend Client & Digital Atelier UI

> **Ultra-sleek, responsive bespoke tailoring client built with React, Vite, Framer Motion, and Lucide Icons.**

---

## 🎨 Design Philosophy & Aesthetics

The IFashion frontend was built using a **Warm Atelier Luxury** design system:
* **Color Palette**: Rich Espresso Dark (`#161311`), Warm Cream / Ivory background (`#FAF7F2`), Warm Cognac & Polished Gold accents (`#B3702A` / `#C59A6F`).
* **Typography**: Luxury serif display headings paired with clean, accessible geometric sans-serif for everyday readability.
* **Micro-Interactions**: Smooth spring animations with Framer Motion, live status indicators, hover cards, and seamless transitions.
* **Humanized Copy**: Natural, friendly English that is accessible to anyone without jargon.

---

## 🧩 Key Components

| Component | Path | Description |
| :--- | :--- | :--- |
| **`App.jsx`** | `src/App.jsx` | Main application shell, dynamic atelier bio link routing (`?designer=handle`), Hero spotlight, interactive gallery filter, and footer. |
| **`ChatWidget.jsx`** | `src/components/ChatWidget.jsx` | Slide-out AI bespoke concierge chat drawer with quick style suggestion chips and real-time order verification. |
| **`AuthModal.jsx`** | `src/components/AuthModal.jsx` | Centered modal with segmented tabs (`Sign In` vs `Create Profile`), password strength enforcement, and show/hide password toggle. |
| **`AdminModal.jsx`** | `src/components/AdminModal.jsx` | Private tailor portal with visual Kanban order tracker, customer size search, 1-click bio link copy, and profile editor. |
| **`MeasurementPreview.jsx`** | `src/components/MeasurementPreview.jsx` | Interactive anatomical fit visualizer guiding customers on how measurements are taken with 1-click order initialization. |
| **`TapeDivider.jsx`** | `src/components/TapeDivider.jsx` | Atelier bespoke tailor tape-measure divider element with metric increments. |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file (or copy from `.env.example`):
```env
VITE_API_BASE=http://127.0.0.1:8000
```
*(In production on Vercel, set `VITE_API_BASE` to your deployed backend URL).*

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🚢 Vercel Deployment
The frontend includes a pre-configured `vercel.json` with client-side SPA rewrites so direct visits to custom atelier links (e.g. `https://ifashion.vercel.app/?designer=marvelous`) always load cleanly without 404 errors.
