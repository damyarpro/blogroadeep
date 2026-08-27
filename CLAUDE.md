# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This repository (`blogroadeep`) is newly initialized and currently contains no application code. Its only contents are:

- `README.md` — project title only
- `LICENSE` — MIT License (copyright IamDamyar)

There is no build system, test framework, linter, or CI configuration yet.

## Agent Rules (قوانین ایجنت)

1. **Language / زبان**: Always communicate with the user in Persian (Farsi). All chat responses, explanations, and questions to the user must be in Persian. Code, identifiers, and commit messages stay in English.
2. **Stack confirmation**: Since no language, framework, or tooling has been chosen yet, confirm the intended stack with the user before scaffolding a project.
3. **Keep this file current**: When code is added, update this file with the actual build, lint, and test commands, and a description of the resulting architecture.
4. **Branching**: Never commit directly to `main`; develop on a feature branch and open a pull request.
5. **License**: The project is MIT-licensed; keep the existing LICENSE file intact.
6. **Scope**: Make only the changes the user asked for; ask before destructive or hard-to-reverse actions (deleting files, force-pushing, rewriting history).
