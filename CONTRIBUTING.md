# Contributing to LocalDrop

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/akshay/localdrop.git
cd localdrop
npm install
npm run dev    # Starts server (3001) + client (5173) concurrently
```

## Project Structure

- `client/` — Svelte 5 + Vite frontend (all browser logic)
- `server/` — Node.js + ws signaling server (no file data touches this)

## Making Changes

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Test on at least two devices (or two browser tabs)
4. Run `npm run build` to ensure no errors
5. Submit a PR

## Code Style

- TypeScript strict mode everywhere
- No comments unless the "why" is non-obvious
- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- CSS custom properties from `global.css` — don't hardcode colors

## What We're Looking For

- **Bug fixes** — especially cross-platform edge cases
- **Performance** — WebRTC throughput improvements
- **Accessibility** — keyboard navigation, screen reader support
- **Mobile UX** — responsive layout improvements
- **New platforms** — testing on devices we don't have

## What We're NOT Looking For (Yet)

- TURN server / cross-network relay (planned for v2, needs design discussion first)
- Native app wrappers (v1 is web-only by design)
- Cloud storage integration (explicitly out of scope)

## Reporting Bugs

Use [GitHub Issues](https://github.com/akshay/localdrop/issues). Include:
- Browser + version (e.g., Chrome 120, iPhone Safari 17)
- Steps to reproduce
- What you expected vs. what happened
- Console errors (if any)
- Connection diagnostics screenshot (click the 📈 icon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
