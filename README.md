# F1 Globe

An interactive 3D visualization of the 2026 Formula 1 racing calendar — explore all 24 races on a rotating globe.

## Overview

F1 Globe renders the full 2026 F1 season on a WebGL-powered 3D globe. Race locations are plotted as animated markers, connected by curved arc paths that trace the order of the season. Hover over any marker to see race details, drag to spin the globe, and scroll to zoom.

## Features

- **Interactive 3D globe** — drag to rotate, scroll to zoom, touch-friendly
- **24 race markers** — pulsing indicators for every 2026 Grand Prix
- **Curved race paths** — animated arcs connecting consecutive race venues in season order
- **Hover tooltips** — displays round number, country, venue name, and race date on hover
- **Atmospheric effects** — glow shader, wireframe grid overlay, and latitude reference lines
- **Smooth auto-rotation** — slows on interaction, resumes when idle
- **High-DPI support** — optimised pixel ratio for retina displays

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| 3D Rendering | Three.js (WebGL) |
| Styling | Tailwind CSS 4 |
| Linting | ESLint 9 |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build   # Production build
npm start       # Start production server
npm run lint    # Run ESLint
```

## Project Structure

```
f1-globe/
├── app/
│   ├── page.tsx        # Root page — manages tooltip state and hover throttling
│   ├── layout.tsx      # Root layout and metadata
│   └── globals.css     # Global styles
├── components/
│   ├── Globe.tsx       # Three.js scene — globe, markers, arcs, lighting, interaction
│   └── Tooltip.tsx     # Race info tooltip with blur backdrop
├── data/
│   └── races.ts        # 2026 F1 calendar data (24 races)
├── utils/
│   └── globe.ts        # 3D math helpers (lat/lng → 3D coords, arc generation)
└── public/             # Static assets
```

## Race Data

Each race in `data/races.ts` follows this shape:

```ts
interface Race {
  round: number;   // Race number in the season (1–24)
  country: string; // Host country
  city: string;    // Host city
  name: string;    // Official Grand Prix name
  date: string;    // Race weekend date range (e.g. "06 – 08 Mar")
  lat: number;     // Venue latitude
  lng: number;     // Venue longitude
}
```

To update the calendar or add races, edit `data/races.ts` — the globe picks up changes automatically.

## License

MIT
