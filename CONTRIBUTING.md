# Contributing

Thanks for your interest in contributing. This document describes how to work with this pack's repository.

## Scope

This repository contains a single Coda Pack. Scope is limited to:

- the pack's formulas, sync tables, column formats, and schemas
- authentication and network configuration
- tests covering pack behavior
- documentation for the pack

Out of scope:

- changes to the Coda platform
- changes to `@codahq/packs-sdk` itself
- cross-repository refactors

## Requirements

- Node.js `>=22`
- `pnpm@9.12.3`
- A Coda account for publishing (not required for local development or tests)

## Setup

```
pnpm install
```

## Development workflow

Run these scripts from the repository root:

| Script                  | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `pnpm run typecheck`    | Type-check without emitting                 |
| `pnpm run lint`         | ESLint                                      |
| `pnpm run lint:fix`     | ESLint with autofix                         |
| `pnpm run format`       | Prettier write                              |
| `pnpm run format:check` | Prettier check                              |
| `pnpm test`             | Run the unit test suite                     |
| `pnpm run coda:build`   | `coda build` the pack                       |
| `pnpm run coda:validate`| `coda validate` the pack                    |
| `pnpm run coda:upload`  | Upload a new pack version                   |
| `pnpm run coda:release` | Release an uploaded version                 |

Before opening a pull request, all of the following must pass locally:

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm test`
- `pnpm run coda:validate`

## Coding standards

- TypeScript strict mode. Do not introduce `any`, `as any`, `as unknown as T`, `@ts-ignore`, or `@ts-expect-error` to silence errors. Fix the root cause.
- At external API boundaries, declare minimal response interfaces that describe only the fields actually consumed. Cast `response.body` once per call site (for example `as ExpectedResponse | undefined`) and operate on the typed value.
- Narrow caught errors. Use `catch (error)` (defaults to `unknown`) and a type guard or `error instanceof Error` before accessing `.message`.
- Do not use `null` for properties that a Coda schema types as `string | undefined`. The SDK's `ObjectSchemaDefinitionType` rejects `null` for string properties; emit `undefined` for "absent".
- Keep `.prettierrc` as the single source of Prettier configuration. Do not add an inline `prettier` key to `package.json`.
- Do not list the same package in both `dependencies` and `devDependencies`.
- No emojis anywhere in source, tests, documentation, commit messages, CLI output, or logs.

## Documentation tone

- Factual and neutral. No marketing language ("powerful", "best", "revolutionary"), no calls to action, no sales framing.
- State what the pack does, what it does not do, and what is required to use it.
- Developer-focused. Prefer concrete examples over adjectives.
- Update `README.md` when adding or removing formulas, sync tables, column formats, or authentication methods.

## Tests

- Unit tests live under `test/` (or `src/__tests__/` for Jest-based packs).
- Use the Coda SDK test utilities from `@codahq/packs-sdk/dist/development` (`executeFormulaFromPackDef`, `executeSyncFormulaFromPackDef`, `newMockExecutionContext`, `newJsonFetchResponse`) for pack-level tests.
- A new formula or sync table must ship with tests covering at least: success path, empty/invalid input, and a representative error response from the upstream API.

## Pull requests

- Keep PRs narrowly scoped. One concern per PR.
- Include a short summary of what changed and why.
- Reference the formula, sync table, or issue the change targets.
- Ensure the four pre-merge checks above pass on your branch.

## Publishing

Publishing to Coda is performed with the Coda CLI and requires a personal API token stored in a local, gitignored file (`.coda.json` or `.env.local`). Do not commit credentials.

```
pnpm run coda:upload   # upload a new version
pnpm run coda:release  # release the uploaded version to the pack's users
```

## Reporting issues

Open an issue with a minimal reproduction: the pack version, the formula or sync table involved, the input values, and the observed versus expected behavior.

## License

By contributing, you agree that your contributions will be licensed under the MIT license that covers this repository.

Author: Rami Isaac <https://github.com/ramiisaac>