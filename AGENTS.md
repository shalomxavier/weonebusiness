# Project verification

- `npm run build` runs TypeScript checking followed by the Vite production build.
- `npm run lint` currently fails because ESLint 9 is installed but there is no eslint.config.js/mjs/cjs configuration. Do not treat this as a feature regression or change project configuration without approval.
- PDF documents use the existing `@react-pdf/renderer` dependency; quotation records are saved by `NewDocumentModal` in the Firestore `documents` collection.
