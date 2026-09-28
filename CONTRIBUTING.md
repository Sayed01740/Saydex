# Contributing to Saydex Protocol

Thank you for your interest in contributing to Saydex Protocol! We welcome community contributions to help improve the decentralized exchange interface and developer tooling.

## Code of Conduct

Please be respectful, collaborative, and constructive when opening issues, submitting pull requests, or participating in discussions.

## Development Workflow

1. **Fork the Repository:** Create your own fork of `Sayed01740/Saydex`.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Develop & Test:**
   ```bash
   npm run dev
   ```
5. **Verify Types & Build:**
   Ensure TypeScript type-checking passes with zero errors before opening a pull request:
   ```bash
   npm run lint
   npm run build
   ```
6. **Submit a Pull Request:** Open a PR against the `main` branch with a clear title and description of your proposed changes.

## Coding Standards

- **TypeScript:** Use strict typing. Avoid `any` where typed interfaces are applicable.
- **Design System:** Respect the existing matte dark theme, CSS variables, and Inter typography conventions.
- **Security:** Do not log private keys, mnemonic phrases, or sensitive RPC credentials.
