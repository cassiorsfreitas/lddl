# LDDL - Local Dev Decision Log

A local-first CLI tool that helps you log technical decisions directly in your git workflow. Never forget why you made that architectural choice!

## Features

- 🪝 **Git Hook Integration** - Automatically prompts for decision logs when you add dependencies
- 📝 **ADR Format** - Structured markdown files following Architecture Decision Records pattern
- 🎯 **Simple CLI** - Create and list decisions with easy commands
- 💾 **Local-First** - Everything stored as markdown in your repository
- 🚀 **Non-Intrusive** - Never blocks commits, all prompts are optional

## Installation

```bash
npm install -g lddl
```

## Quick Start

1. **Initialize in your project:**

```bash
cd your-project
lddl init
```

2. **Create decisions manually:**

```bash
lddl new
```

3. **Automatic prompts during commits:**
   When you add dependencies and commit, LDDL will detect it and prompt you:

```
📦 New dependencies detected: express

Would you like to create a decision log for this? (y/N)
```

4. **List all decisions:**

```bash
lddl list
```

## Usage

### Commands

- `lddl init` - Install git hooks in your repository
- `lddl new` - Create a new decision log
- `lddl list` - List all decision logs

### Options for `lddl new`

```bash
lddl new --title "Add Redis" \
         --context "Need caching layer for session management" \
         --decision "Using Redis for distributed caching" \
         --consequences "Adds infrastructure dependency, but improves scalability"
```

## Decision Format

Each decision is stored as a markdown file in `.lddl/decisions/`:

```markdown
# Add Express Framework

**Date:** 2026-01-03T02:00:00.000Z

## Context

Need a web framework for building REST API

## Decision

Using Express.js for its simplicity and ecosystem

## Consequences

- Large ecosystem of middleware
- Well-documented and stable
- May need to add structure for larger apps

## References

https://expressjs.com
```

## How It Works

1. **Pre-commit hook** detects changes (e.g., new dependencies in package.json)
2. **Prepare-commit-msg hook** prompts you to log the decision
3. Decision saved as markdown in `.lddl/decisions/`
4. Commit proceeds normally

All prompts are optional - you can skip by pressing Enter or typing 'n'.

## Why LDDL?

- **Remember Context**: Capture the "why" behind technical decisions
- **Team Communication**: Share decision rationale with your team
- **Onboarding**: Help new developers understand past choices
- **Low Friction**: Integrates into existing workflow

## Future Features

We're planning to expand LDDL with more intelligent detectors and features:

- 🏗️ **Infrastructure Changes** - Detect Docker, CI/CD, and deployment configuration changes
- 🏛️ **Architecture Changes** - Track modifications to folder structure, module boundaries, and design patterns
- 🔄 **Process Changes** - Detect new scripts, workflow changes, and development process updates
- ✅ **Required Fields** - Configurable mandatory fields for decision logs
- 🤖 **Smart Suggestions** - AI-powered context suggestions based on code changes
- 🔍 **Advanced Detectors** - Monitor test coverage changes, security updates, and performance impacts
- 📊 **Decision Analytics** - Visualize decision patterns and track technical debt
- 🔗 **Integration Support** - Connect with issue trackers, wikis, and team communication tools

## License

MIT
