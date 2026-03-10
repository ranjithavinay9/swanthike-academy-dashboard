# Swanthike Academy Frontend

A simple React + Vite frontend for your academy system.

## 1. Configure the backend URL
Open this file:

`src/config.js`

Replace this line:

```js
export const API_BASE = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with your Apps Script Web App URL:

```js
export const API_BASE = "https://script.google.com/macros/s/AKfycb.../exec";
```

Use only the base URL. Do not include `?action=students`.

## 2. Install and run

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## 3. Current features
- Dashboard counters from `?action=dashboard`
- Student directory from `?action=students`
- Add student via `doPost`
- Mark attendance via `doPost`
- Record payment via `doPost`

## 4. Important note
Attendance is currently saved one student at a time because it matches your current Apps Script backend.
A later upgrade can switch this to a bulk attendance API.
