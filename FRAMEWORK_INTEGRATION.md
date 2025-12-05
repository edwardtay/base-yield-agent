# Framework Integration Guide

## Repository Structure

This agent demonstrates the recommended pattern for building production agents with the NullShot framework:

```
nullshot-framework/                    # Main framework repository
├── packages/
│   ├── agent/                        # @nullshot/agent package
│   ├── mcp/                          # @nullshot/mcp package
│   └── cli/                          # @nullshot/cli package
├── examples/
│   ├── base-yield-agent/            # Your production agent (this)
│   ├── simple-prompt-agent/         # Basic example
│   └── playground-showcase/         # Full-featured demo
└── README.md                         # Framework documentation
```

## Why This Structure?

### ✅ Advantages

1. **Framework Visibility**: Shows your agent is built on NullShot
2. **Shared Dependencies**: Leverages framework packages directly
3. **Example Reference**: Helps others learn from your implementation
4. **Monorepo Benefits**: Single `pnpm install` for everything
5. **Version Sync**: Agent stays in sync with framework updates

### 🎯 Positioning

Your agent is positioned as a **featured example** in the framework, demonstrating:
- Production-grade patterns
- Advanced A2A communication
- Blockchain composability
- Real-world use case

## Dual Repository Strategy

### Main Framework Repo
**Location**: `nullshot-framework/examples/base-yield-agent/`
**Purpose**: 
- Show integration with framework
- Provide reference implementation
- Enable framework contributors to test with real agent

### Standalone Agent Repo
**Location**: `https://github.com/edwardtay/base-yield-agent`
**Purpose**:
- Independent deployment
- Custom CI/CD pipeline
- Agent-specific issues and PRs
- Production releases

## Keeping Repos in Sync

### Option 1: Git Subtree (Recommended)
```bash
# In framework repo
git subtree push --prefix=examples/base-yield-agent \
  https://github.com/edwardtay/base-yield-agent.git main

# In standalone repo
git subtree pull --prefix=. \
  https://github.com/null-shot/typescript-agent-framework.git main \
  --squash
```

### Option 2: Git Submodule
```bash
# In framework repo
git submodule add https://github.com/edwardtay/base-yield-agent.git \
  examples/base-yield-agent

# Update submodule
git submodule update --remote examples/base-yield-agent
```

### Option 3: Manual Sync
```bash
# Copy changes from framework to standalone
rsync -av --exclude='.git' \
  nullshot-framework/examples/base-yield-agent/ \
  base-yield-agent/

# Commit and push to standalone repo
cd base-yield-agent
git add .
git commit -m "sync: Update from framework"
git push
```

## Alternative Structures

### Option A: Standalone Only
```
base-yield-agent/                     # Your repo
├── src/
├── package.json
└── README.md

# Dependencies
"dependencies": {
  "@nullshot/agent": "^0.3.4",
  "@nullshot/mcp": "^0.1.0"
}
```

**Pros**: Full control, simpler CI/CD
**Cons**: Less visibility, harder to contribute to framework

### Option B: Framework Fork
```
your-nullshot-fork/                   # Forked framework
├── packages/
├── examples/
│   └── base-yield-agent/            # Your agent
└── README.md
```

**Pros**: Easy to contribute back, full framework access
**Cons**: Merge conflicts, harder to stay updated

### Option C: Monorepo with Framework as Dependency
```
your-monorepo/
├── packages/
│   └── base-yield-agent/
├── package.json
└── pnpm-workspace.yaml

# Dependencies
"dependencies": {
  "@nullshot/agent": "^0.3.4"
}
```

**Pros**: Your own monorepo, clean separation
**Cons**: No framework visibility, duplicate setup

## Recommended: Current Structure ✅

**Keep your agent in `examples/base-yield-agent/` because:**

1. **Showcases Framework**: Demonstrates NullShot's capabilities
2. **Reference Implementation**: Helps other developers
3. **Framework Testing**: Maintainers can test with real agent
4. **Community Visibility**: Featured in framework README
5. **Easy Contributions**: Can contribute framework improvements

**Maintain standalone repo for:**
- Production deployments
- Custom CI/CD
- Agent-specific releases
- Independent versioning

## Development Workflow

### Working on Agent
```bash
# In framework repo
cd examples/base-yield-agent
pnpm dev

# Make changes
git add .
git commit -m "feat: Add new feature"

# Push to both repos
git push origin main  # Framework repo
git push standalone main  # Your standalone repo
```

### Working on Framework
```bash
# In framework repo root
cd packages/agent
# Make changes to @nullshot/agent

# Test with your agent
cd ../../examples/base-yield-agent
pnpm dev  # Uses local framework packages
```

### Deploying to Production
```bash
# From standalone repo
cd base-yield-agent
pnpm deploy  # Cloudflare Workers
```

## CI/CD Setup

### Framework Repo (GitHub Actions)
```yaml
# .github/workflows/test-examples.yml
name: Test Examples
on: [push, pull_request]
jobs:
  test-base-yield-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter base-yield-agent test
```

### Standalone Repo (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Documentation Strategy

### Framework README
- Link to your agent as featured example
- Highlight advanced patterns
- Show real-world use case

### Agent README
- Focus on agent capabilities
- Mention built with NullShot
- Link back to framework

### Cross-References
```markdown
# In framework README
🌟 **Featured Example**: [Base Yield Agent](./examples/base-yield-agent)

# In agent README
Built with [NullShot Agent Framework](https://nullshot.ai)
```

## Questions?

- **Framework Issues**: https://github.com/null-shot/typescript-agent-framework/issues
- **Agent Issues**: https://github.com/edwardtay/base-yield-agent/issues
- **Discord**: https://discord.gg/acwpp6zWEc (#agent channel)

---

**Current Setup**: ✅ Optimal for showcasing framework integration while maintaining deployment independence
