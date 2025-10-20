# Contributing to Nuxt AI Chat

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start for Contributors

### For Human Developers
1. **Read the Playbook**: [docs/AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md) - Core principles and workflows
2. **Check priorities**: [TODO.md](./TODO.md) - Current tasks and roadmap
3. **Understand the architecture**: [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md)
4. **Set up your environment**: See [README.md](./README.md#quick-start)

### For AI Assistants
1. **READ FIRST**: [docs/AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md) - **MANDATORY** before any code changes
2. **Check context**: [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md) - System overview
3. **Review priorities**: [TODO.md](./TODO.md) - What to work on
4. **Ask before big changes**: Follow the "Plan First" workflow

## 📋 Before You Code

### Micro Changes (< 30 min, 1-3 files)
- ✅ Just do it
- Run tests and linters
- Commit with conventional format: `type(scope): description`

### Medium Changes (New features, APIs, refactors)
- ⚠️ Write a **Mini Plan** first (see [AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md#medium-change-new-feature-api-or-refactor))
- Share plan and wait for approval
- Implement in small commits
- Add tests
- Update docs

### Big Changes (Domain models, auth systems, streaming)
- 🛑 Write an **RFC Plan** first (see [AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md#big-change-domain-model-streaming-multi-phase-work))
- Get explicit approval
- Split into phases
- Add comprehensive tests
- Document migration path

## 🧪 Testing

Run tests before submitting:
```bash
bun test              # All tests
bun test auth         # Specific test
bun test --coverage   # With coverage
```

## 📝 Commit Convention

Format: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation only
- `test`: Adding/updating tests
- `chore`: Tooling, deps, config

**Examples**:
```bash
feat(auth): add refresh token rotation
fix(chat): handle streaming errors gracefully
docs(playbook): add testing guidelines
```

## ✅ Pull Request Checklist

Copy this into your PR description:

```markdown
## Description
[What does this PR do?]

## Related Issues
Fixes #[issue number]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Plan/RFC linked (if medium/big change)
- [ ] Code follows project standards
- [ ] Types/DTOs updated
- [ ] Tests added/updated (and passing)
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Manual smoke test passed
- [ ] TODO.md updated (if applicable)
```

## 🔐 Security Guidelines

- Never commit secrets (API keys, JWT_SECRET)
- Always use `event.context.user` for auth (never trust headers/query)
- Hash passwords with Argon2 (never store plaintext)
- Return clean DTOs (never expose password hashes)
- Validate all input (prefer Zod schemas)

## 📚 Code Standards

See [docs/AI_PLAYBOOK.md#6-coding-standards](./docs/AI_PLAYBOOK.md#6-coding-standards) for:
- File organization
- Naming conventions
- Type separation (DB vs API)
- Repository pattern
- Store pattern
- Component pattern
- Error handling

## 🤝 Getting Help

- **Questions about architecture?** Read [docs/AI_AGENT_BRIEF.md](./docs/AI_AGENT_BRIEF.md)
- **Questions about process?** Read [docs/AI_PLAYBOOK.md](./docs/AI_PLAYBOOK.md)
- **Found a bug?** Open an issue with reproduction steps
- **Have a feature idea?** Open an issue to discuss first

## 🎯 What to Work On

Check [TODO.md](./TODO.md) for prioritized tasks:

**Priority levels**:
1. 🚨 **P0 - Unblockers**: Broken builds, auth failures, critical bugs
2. 🔒 **P1 - Safety**: Security issues, data integrity, migrations
3. 👤 **P2 - User Value**: Features users will see/use
4. 🛠️ **P3 - Maintainability**: Tests, types, documentation
5. ✨ **P4 - Polish**: UI details, optimizations

## 🚫 What Not to Do

- ❌ Don't commit directly to main
- ❌ Don't skip tests
- ❌ Don't ignore security warnings
- ❌ Don't make big changes without a plan
- ❌ Don't expose secrets or credentials
- ❌ Don't trust user input without validation

## 🌟 Best Practices

- ✅ Start simple, iterate
- ✅ Write tests for new features
- ✅ Keep functions small and focused
- ✅ Use TypeScript properly (no `any`)
- ✅ Log important events
- ✅ Handle errors gracefully
- ✅ Update documentation

---

**Thank you for contributing! 🎉**

If you have questions or need clarification, don't hesitate to ask.
