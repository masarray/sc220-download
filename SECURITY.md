# Security Policy

## Supported versions

Security fixes are evaluated for the latest stable SC220 Live release published in this repository.

| Version | Supported |
|---|---|
| Latest stable release | Yes |
| Older releases | Best effort |
| Repackaged or third-party builds | No |

## Reporting a vulnerability

Please do **not** disclose security vulnerabilities, exploit details, credentials, activation data, or sensitive logs in a public issue.

Preferred reporting path:

1. Open the repository's **Security** tab.
2. Use **Report a vulnerability** or the private security advisory flow when available.
3. Include the affected version, impact, reproduction steps, and a minimal proof of concept.
4. Remove unrelated personal information, license data, and credentials.

If private vulnerability reporting is not available, open a public issue titled **Security contact request** without technical details. A private reporting channel can then be arranged.

## What to report

Examples include:

- Installer tampering or release-integrity issues.
- Unsafe handling of local files, paths, or configuration data.
- Credential, activation, or private-data exposure.
- Privilege escalation or arbitrary code execution.
- Insecure update or download behavior.
- Vulnerabilities in the public landing page that could affect visitors.

## What is not a vulnerability

- Windows SmartScreen showing an unknown-publisher warning by itself.
- A checksum mismatch for a file downloaded from an unofficial mirror.
- General audio quality, latency, routing, or device-compatibility problems.
- Requests for proprietary source code or signing material.

## Release verification

Only trust installers published under this repository's GitHub Releases. Verify the SHA-256 checksum before installation and avoid repackaged binaries from third-party download sites.

## Disclosure process

After a report is received, the maintainer will attempt to:

1. Confirm receipt.
2. Reproduce and assess severity.
3. Prepare a fix or mitigation when applicable.
4. Publish an updated release and advisory when disclosure is appropriate.

Timelines depend on severity, reproducibility, and affected dependencies. Coordinated disclosure is appreciated.
