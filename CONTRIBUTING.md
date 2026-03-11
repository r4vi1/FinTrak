# Contributing to FinTrak

Thanks for the interest! Here's the deal.

## Ground rules

- **Keep it simple.** This is a full-stack JS app, not a NASA project. Don't introduce frameworks or abstractions unless there's a clear win.
- **One thing per PR.** Bug fix? Feature? Refactor? Pick one. Makes reviews way easier.
- **Test what you break.** No test suite yet (I know, I know), but at minimum make sure `npm run db:migrate` and the dev server still start.

## Getting set up

```bash
git clone https://github.com/r4vi1/FinTrak.git
cd FinTrak
npm install
cd client && npm install && cd ..
npm run db:migrate
npm run db:seed
```

You now have a working app with seed data. Backend on `:3001`, frontend on `:5173`.

## What to work on

Check the [issues](https://github.com/r4vi1/FinTrak/issues) tab. Anything tagged `good first issue` is fair game.

Some areas that could use help:
- **Mobile responsive** — the layout is desktop-first right now
- **Tests** — we have literally zero. Unit tests for the category engine would be a great start
- **Accessibility** — screen reader support, keyboard nav, color contrast
- **Documentation** — API docs, JSDoc comments, anything that makes the codebase more approachable

## Submitting a PR

1. Fork the repo
2. Create a branch (`git checkout -b fix/something-broken`)
3. Make your changes
4. Push to your fork and open a PR against `main`

I'll try to review within a couple days. If it's been a week and you haven't heard back, ping me.

## Style

- No semicolons in JS (or do use them, I don't care, just be consistent within the file you're editing)
- React functional components only
- camelCase for JS, kebab-case for CSS classes
- Commit messages: imperative mood, keep it under 72 chars. `Fix currency formatting for large numbers` not `fixed stuff`

## Questions?

Open an issue or ping me. Don't overthink it.
