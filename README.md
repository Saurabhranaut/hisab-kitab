# Ghar Ka Hisab

Roommate expense splitter for Saurabh, Rakesh, Deepak, Sunil — with a real
file-based activity log, so data survives refreshes, closed tabs, or a
phone dying.

## Run it locally

```bash
npm install
npm start
```

Then open `http://localhost:3000/?id=0` (0=Saurabh, 1=Rakesh, 2=Deepak, 3=Sunil).
Each roommate opens the site with their own `?id=` so the page shows their
personal balance and dues.

## How the log works

- Every add/delete is appended as one line of JSON to `logs/activity.log`.
- On every page load, the server replays that file from the top to rebuild
  the current list of expenses — so nothing depends on the browser. If a
  phone breaks or the tab is closed, the data is still sitting in the log
  file on the server.
- `logs/activity.log` is a plain text file, one JSON event per line —
  you can open it directly to see the full history of who added what and when.

## Hosting it for real

This needs a place that can run a Node.js process (not a static host like
GitHub Pages, since it writes to a real file on disk). Simple options:
Render, Railway, a small VPS, or your own machine on the home network.
Whatever you use, just make sure the `logs/` folder is writable and persists
between restarts (don't use a host that wipes the filesystem on redeploy,
or the log will reset).

## Dues logic

Section 2 on the page shows exactly who owes whom, computed straight from
the bills — nothing is merged or cancelled out across different people, so
it stays easy to tell "why do I owe this amount, and to whom."
