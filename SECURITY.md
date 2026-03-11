# Security

## Reporting a vulnerability

If you discover a security issue, please report it responsibly:

- **Do not** open a public GitHub issue for security vulnerabilities.
- Email the maintainers (or open a private security advisory on GitHub) with a description and steps to reproduce.
- Allow time for a fix before any public disclosure.

## Security policy

- **Never commit secrets.** Do not put API keys, passwords, tokens, or private keys in the repository. Use environment variables and `.env` files (which are gitignored). See `.env.example` and `backend/.env.example` for required and optional variables.
- Keep dependencies up to date. Run `npm audit` and `pip audit` (or similar) periodically.
- In production, set `APP_ENV=production`, `DEBUG=false`, and a strong `SECRET_KEY`; use a secrets manager or vault for credentials where possible.
