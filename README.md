# FieldLog

Free, offline-first app for collecting data in the field. **Build your own forms**, record measurements on your phone or laptop, and **export to Excel or CSV**. No account, no server, no tracking: your data stays on your device.

English · Español (the UI switches automatically)

## Features

- **Custom forms** – text, number (with units), long text, date, time, choice list, yes/no and GPS location.
- **Example forms** – groundwater level, water quality sample, site inspection. Edit or delete them freely.
- **Offline / installable** – works without internet and can be installed as an app (PWA).
- **Export** – Excel (one sheet per form) or CSV, with spreadsheet formula-injection protection.
- **Backup & restore** – JSON file to move data between devices.
- **Private** – everything is stored in your browser's local storage; nothing is uploaded.

## Use it

```bash
npm install
npm start          # http://localhost:4200
npm run build      # static site in ./www
npm test
```

The build output is a plain static site: host it anywhere (GitHub Pages, Netlify, an intranet server, a USB stick). It uses hash routing, so no server rewrite rules are needed.

### Deploy to GitHub Pages

Enable *Settings → Pages → Source: GitHub Actions*; the included workflow publishes every push to `main`.

### Native Android / iOS (optional)

Capacitor is preconfigured (`capacitor.config.ts`):

```bash
npm run build
npx cap add android   # or ios
npx cap sync
```

Note: file downloads inside a native webview may need a Capacitor Filesystem/Share plugin; the web/PWA version works out of the box.

## Data & limits

Data lives in `localStorage` (~5 MB per browser). Clearing site data deletes it, so download backups regularly. There is no sync between devices by design; the data layer is isolated in `src/app/core/store.ts` if you want to add a backend.

## Project layout

```
src/app/core/    store, i18n, export helpers, example forms
src/app/pages/   forms list, fill form, records, form editor, settings
```

Add a language by extending the dictionaries in `src/app/core/i18n.ts`.

## Contributing

Issues and pull requests are welcome. Please run `npm test` and `npm run build` before submitting.

## License

[MIT](LICENSE)
