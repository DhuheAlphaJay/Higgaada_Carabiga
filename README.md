# حروف

A kid-friendly Arabic alphabet and spelling game. The interface is Somali, the lessons are Arabic, and the layout is right-to-left.

## Play

- **Dhageyso oo Dooro** at `/listen` — hear a letter name, then tap the matching glyph.
- **Isku Dubarid Xarfaha** at `/spell` — tap or drag letters into the slots to spell a word.

Correct answers play a rising tone and confetti. Wrong answers play a soft tone, shake, and show “Waad khaldatay, isku day mar kale”.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

The app is a standard Next.js project and deploys to Vercel with the default settings. Lesson content currently comes from `src/data` through async readers in `src/data/repository.ts`, ready to be swapped for Firestore.
