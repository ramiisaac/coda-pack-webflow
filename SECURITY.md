# Security Policy

## Supported Versions

Only the latest released version of this pack is supported for security updates. Coda installs the latest released version by default, so security fixes propagate to installed instances automatically once a new version is released.

## Reporting a Vulnerability

If you believe you have found a security vulnerability in this pack, do not open a public GitHub issue. Instead, report it privately.

Preferred channel:

- Email the maintainer at `raisaac@icloud.com` with subject line `SECURITY: <pack name>`.

Alternatively, use GitHub's private vulnerability reporting on this repository (Security tab, "Report a vulnerability").

Please include:

- The pack name and version.
- A description of the vulnerability and its impact.
- Steps to reproduce, or a minimal proof of concept.
- Any relevant logs, request or response bodies (with secrets redacted).
- Your assessment of severity and any suggested remediation.

Do not include real credentials, API keys, or personal data in your report. Redact before sending.

## Response Process

- Acknowledgment of the report within 7 days.
- Initial assessment and severity classification within 14 days.
- Fix and release timeline communicated once the issue is confirmed.
- Public disclosure coordinated with the reporter after a fix is released, unless the reporter requests otherwise.

## Scope

In scope:

- The pack's source code in this repository.
- Authentication, credential handling, and network configuration declared by the pack.
- Data exposed by the pack's formulas, sync tables, and column formats.

Out of scope:

- The Coda platform itself. Report Coda platform vulnerabilities to Coda directly.
- The `@codahq/packs-sdk` package. Report SDK vulnerabilities to the SDK maintainers.
- Third-party APIs the pack integrates with. Report those to the respective API providers.
- Vulnerabilities that require the attacker to already have write access to this repository or to the pack owner's Coda account.

## Credentials and Secrets

This pack does not store or transmit credentials outside the Coda platform's authentication system. If you discover a case where credentials could leak (for example, being logged, included in an error message surfaced to other users, or sent to an unintended domain), treat it as in-scope and report it through the channels above.

## Dependencies

Dependency vulnerabilities detected by GitHub Dependabot or similar scanners are monitored on this repository. If you observe a transitive dependency vulnerability that affects the pack at runtime, report it so it can be prioritized.

Author: Rami Isaac <https://github.com/ramiisaac>