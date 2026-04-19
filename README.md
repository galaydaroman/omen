# Omen

Omen is a modern, privacy-first event tracking and logging application. Built as a Progressive Web App (PWA), it is designed for **habit tracking** and **medical/health monitoring**, but flexible enough for any general-purpose event logging. All data is stored locally in your browser using IndexedDB, ensuring your privacy remains a priority.

🌐 **Live Demo:** [https://galaydaroman.github.io/omen-page/](https://galaydaroman.github.io/omen-page/)

## ✨ Features

- **Health & Habit Tracking:** Log symptoms, medication, daily habits, or any recurring events with custom tags.
- **Privacy Centric:** No cloud syncing by default; your data stays on your device (Offline-first).
- **Rich Visualization:** Analyze patterns with interactive charts and statistics powered by Recharts.
- **Advanced Filtering:** Browse your history with infinite scroll and multi-criteria filters (events, tags, dates).
- **Data Portability:** Full control over your data with JSON-based Import/Export functionality.
- **PWA Ready:** Install it on your mobile device or desktop for an app-like experience.
- **Theming:** Native support for Light and Dark modes.

## 🚀 Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
- **Storage:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb`)
- **Charts:** [Recharts](https://recharts.org/)

## 🛠️ Getting Started

### Prerequisites

- **Node.js:** ~24.12.0
- **npm** (or your preferred package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/galaydaroman/omen-page.git
   cd omen
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the application for production.
- `npm run test`: Runs the test suite using Vitest.
- `npm run lint`: Performs linting checks with ESLint.
- `npm run preview`: Previews the production build locally.
- `npm run deploy`: Deploys the application to GitHub Pages.

## 📝 Roadmap

Check the [TODO.md](./TODO.md) file for planned features, including:
- [ ] Calendar view for the Statistics page.
- [ ] Frequent event prioritization for faster logging.
- [ ] UI refinements for the New Event Log action.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
