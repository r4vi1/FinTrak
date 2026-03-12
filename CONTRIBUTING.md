# Contributing to FinTrak

First off, thank you for considering contributing to FinTrak! It's people like you that make FinTrak a great personal finance tool for the community.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/r4vi1/FinTrak/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

If you're looking for an issue to pick up, we try to label beginner-friendly issues with the `good first issue` or `help wanted` tags.

## Fork & create a branch

If the issue you're working on is confirmed or you already know what to do, get the code on your local machine:

1. Fork the repository
2. Clone your fork locally
3. Create a branch: `git checkout -b your-branch-name`

## Setting up your local environment

FinTrak uses a Node.js backend with SQLite and a React/Vite frontend.

1. Install dependencies for both the server and the client:
   ```bash
   npm install
   cd client && npm install
   cd ..
   ```
2. Start the development environment:
   ```bash
   npm start
   ```
   This command starts both the Express server (port 5000) and the Vite frontend development server concurrently.

## Coding Guidelines

We want to keep the codebase clean, legible, and "vibe coded". 

- **Formatting:** We use Prettier for code formatting. Please ensure your editor is configured to use it, or run formatting commands before you commit.
- **Component Style:** We use standard React functional components. For styling, we primarily rely on TailwindCSS for responsive layouts.

## Committing and Pushing

Once you've made your changes:

1. Stage your changes: `git add .`
2. Commit your changes. Try to clearly describe what your commit does (e.g., `git commit -m "fix: sidebar responsive layout on mobile"`).
3. Push to your branch: `git push origin your-branch-name`
4. Open a Pull Request from your fork to the main `FinTrak` repository!

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms. Be welcoming and respectful to everyone.

Thank you for contributing!
