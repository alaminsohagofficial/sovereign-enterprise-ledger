# Sovereign Enterprise Ledger

A browser-based financial ledger engine with `localStorage` persistence and GitHub Contents API synchronization support for partner accounts (`Minister hi tech park (DEAL002905)` and `BUTTERFLY MARKETING LIMITED (3000002272)`).

## Features

- **Real-Time Ledger Totals & Running Due:** Tracks `Bill` (+), `Credit` (-), and `Debit` (+) entries in BDT (`৳`) with partner filtering and instant search across ID, partner, type, and description.
- **Collision-Resistant Entry IDs & Custom Dates:** Generates unique transaction IDs using timestamp + random suffix and supports custom transaction dates.
- **GitHub API Sync (`Sync GitHub` / `GitHub Config`):** Allows configuring GitHub owner, repository, branch, file path, and a Personal Access Token (API key) stored locally in browser `localStorage` to push ledger snapshots (`data/ledger-data.json`) via the GitHub REST API.

## Project Structure

```text
├── index.html            # Ledger dashboard UI & GitHub config modal
├── style.css             # Typography & dark theme scrollbar styling
├── script.js             # Ledger calculations, UI actions & GitHub API sync engine
├── data/
│   └── ledger-data.json  # Sample/initial BDT ledger dataset
└── README.md             # Project documentation
```

## Security Note

- Never hardcode raw API keys or GitHub Personal Access Tokens directly in source files committed to Git. Enter your token inside the **GitHub Config** modal so it stays in your local browser storage.
