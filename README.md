# Base Yield Agent - Advanced DeFi Intelligence with A2A Composability

> **Production-grade AI agent demonstrating NullShot's Agent-to-Agent (A2A) communication and blockchain composability patterns on Cloudflare Workers.**

Built on the [NullShot Agent Framework](https://nullshot.ai), this agent showcases advanced patterns for building interoperable, blockchain-native AI systems with autonomous coordination capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Base Yield Agent                         │
├─────────────────────────────────────────────────────────────┤
│  NullShot Agent Framework (Durable Objects + AI SDK v5)    │
│  ├─ Agent Coordinator Service (A2A Communication)          │
│  ├─ Toolbox Service (MCP Integration)                      │
│  └─ Custom Middleware (Tool Injection)                     │
├─────────────────────────────────────────────────────────────┤
│  Blockchain Layer (viem + Thirdweb)                        │
│  ├─ Multi-chain RPC (Base, Arbitrum, Optimism, Polygon)   │
│  ├─ Smart Contract Interactions (Aave, Uniswap, Curve)    │
│  ├─ Transaction Simulation & Building                      │
│  └─ Wallet Abstraction (Thirdweb Connect)                 │
├─────────────────────────────────────────────────────────────┤
│  MCP Servers (Model Context Protocol)                      │
│  ├─ defi-data: Protocol yield aggregation                 │
│  ├─ blockchain-rpc: Advanced chain operations             │
│  ├─ agent-coordinator: A2A messaging & discovery          │
│  └─ cross-chain: Bridge & messaging protocols             │
└─────────────────────────────────────────────────────────────┘
```

## Key Technologies

### NullShot Agent Framework
- **Durable Objects**: Persistent agent state and session management
- **AI SDK v5**: Provider-agnostic LLM integration (OpenAI, Anthropic, DeepSeek)
- **Service Architecture**: Modular middleware for tool injection and response transformation
- **MCP Integration**: Native Model Context Protocol support for extensible tooling

### Thirdweb Integration
- **Wallet Connect**: Non-custodial wallet integration with session keys
- **Smart Accounts**: Account abstraction for gasless transactions
- **Multi-chain Support**: Unified interface across EVM chains
- **RPC Infrastructure**: Reliable blockchain connectivity

### Blockchain Stack
- **viem**: Type-safe Ethereum interactions with full TypeScript support
- **Multi-chain Architecture**: Base (primary), Arbitrum, Optimism, Polygon, Mainnet
- **DeFi Protocols**: Direct integration with Aave V3, Uniswap V3, Curve, Yearn
- **Transaction Safety**: Simulation-first approach with gas estimation

## Advanced Features

### 1. Agent-to-Agent (A2A) Communication

Implements the NullShot A2A protocol for autonomous agent coordination:

```typescript
// Agent registration with capability declaration
await coordinator.registerAgent({
  id: 'base-yield-optimizer',
  name: 'Base Yield Optimizer',
  capabilities: [{
    id: 'defi-yield-optimization',
    chains: ['base', 'arbitrum', 'optimism'],
    protocols: ['aave', 'compound', 'uniswap', 'curve'],
    operations: ['yield-analysis', 'risk-assessment', 'strategy-optimization']
  }]
});

// Capability-based agent discovery
const agents = await coordinator.discoverAgents('yield-analysis');

// Task delegation with reputation-based routing
const delegation = await coordinator.delegateTask({
  fromAgent: 'coordinator',
  toAgent: agents[0].id, // Highest reputation agent
  task: {
    type: 'optimize-yield',
    parameters: {
      asset: 'USDC',
      chains: ['base', 'arbitrum'],
      minAPY: 5.0,
      riskTolerance: 'medium'
    }
  }
});

// Multi-agent workflow composition
const workflow = await coordinator.composeWorkflow({
  name: 'Optimized Yield Strategy',
  steps: [
    { agentCapability: 'yield-analysis', task: {...} },
    { agentCapability: 'risk-assessment', task: {...} },
    { agentCapability: 'transaction-builder', task: {...} }
  ]
});
```

**Key Patterns:**
- Capability-based service discovery
- Reputation-weighted agent selection
- Asynchronous task delegation with status tracking
- Workflow orchestration across specialized agents

### 2. Blockchain Composability

Production-ready blockchain interaction patterns:

```typescript
// Multi-chain balance aggregation
const balances = await getMultiChainBalance({
  address: userAddress,
  tokenAddress: USDC_ADDRESS,
  chains: ['base', 'arbitrum', 'optimism', 'polygon']
});

// DeFi protocol data fetching (Aave V3)
const aaveData = await getAaveData({
  chain: 'base',
  asset: USDC_ADDRESS
});
// Returns: { supplyAPY: '5.23%', borrowAPY: '3.45%', ... }

// Transaction simulation before execution
const simulation = await simulateTransaction({
  chain: 'base',
  from: userAddress,
  to: AAVE_POOL_ADDRESS,
  data: encodedSupplyCall,
  value: '0'
});
// Returns: { willSucceed: true, estimatedGas: '125000' }

// Uniswap V3 pool analytics
const poolData = await getUniswapPool({
  chain: 'base',
  poolAddress: USDC_WETH_POOL
});
// Returns: { liquidity, currentTick, fee, token0, token1 }
```

**Advanced Capabilities:**
- Parallel multi-chain queries with Promise.all
- Protocol-specific ABI parsing and data extraction
- Gas estimation and transaction simulation
- Type-safe contract interactions via viem

### 3. MCP Server Architecture

Extensible tooling via Model Context Protocol:

```json
{
  "mcpServers": {
    "defi-data": {
      "description": "Real-time DeFi protocol data aggregation",
      "tools": [
        "getProtocolYields",
        "compareProtocols", 
        "getHistoricalAPY",
        "getTVLData",
        "getProtocolRisks"
      ]
    },
    "blockchain-rpc": {
      "description": "Advanced blockchain operations",
      "tools": [
        "executeTransaction",
        "simulateTransaction",
        "getContractState",
        "watchEvents",
        "batchCalls"
      ]
    },
    "agent-coordinator": {
      "description": "A2A communication and coordination",
      "tools": [
        "registerAgent",
        "discoverAgents",
        "delegateTask",
        "sendMessage",
        "coordinateWorkflow"
      ]
    }
  }
}
```

**MCP Benefits:**
- Hot-reloadable tools without agent redeployment
- Standardized tool interface across agents
- Composable tool chains
- Third-party tool integration

### 4. Thirdweb Wallet Integration

Production wallet management with Thirdweb:

```typescript
// Initialize Thirdweb client
const client = createThirdwebClient({
  clientId: env.THIRDWEB_CLIENT_ID
});

// Connect wallet with session keys
const wallet = await connectWallet({
  client,
  chain: base,
  strategy: 'metamask'
});

// Smart account for gasless transactions
const smartAccount = await createSmartAccount({
  client,
  chain: base,
  sponsorGas: true
});

// Execute transaction via smart account
const tx = await sendTransaction({
  account: smartAccount,
  transaction: preparedTransaction
});
```

**Features:**
- Non-custodial wallet connection
- Smart account abstraction
- Gasless transaction sponsorship
- Session key management for autonomous operations

## Technical Implementation

### NullShot Service Pattern

```typescript
export class BaseYieldAgent extends AiSdkAgent<Env> {
  constructor(state: DurableObjectState, env: Env) {
    const provider = createAnthropic({
      apiKey: env.AI_PROVIDER_API_KEY
    });
    const model = provider.languageModel(env.MODEL_ID);

    // Service composition
    super(state, env, model, [
      new ToolboxService(env, mcpConfig),      // MCP integration
      new AgentCoordinatorService(),           // A2A communication
      new BlockchainService(env),              // Web3 tools
      new CustomMiddleware()                   // Tool injection
    ]);
  }

  async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
    const result = await this.streamTextWithMessages(
      sessionId,
      messages.messages,
      {
        system: EXPERT_SYSTEM_PROMPT,
        maxSteps: 10,
        experimental_toolCallStreaming: true,
        onError: (error) => this.handleError(error)
      }
    );

    return result.toTextStreamResponse();
  }
}
```

### Durable Object State Management

```typescript
// Session persistence
await this.state.storage.put(`session:${sessionId}`, {
  messages: conversationHistory,
  context: agentContext,
  timestamp: Date.now()
});

// Agent registry (A2A)
await this.state.storage.put(`agent:${agentId}`, {
  capabilities,
  reputation,
  lastSeen: Date.now()
});
```

### Multi-Chain RPC Configuration

```typescript
const CHAINS = {
  base: { chain: base, rpc: env.BASE_RPC_URL },
  arbitrum: { chain: arbitrum, rpc: env.ARBITRUM_RPC_URL },
  optimism: { chain: optimism, rpc: env.OPTIMISM_RPC_URL },
  polygon: { chain: polygon, rpc: env.POLYGON_RPC_URL }
};

function getPublicClient(chainName: ChainName) {
  const config = CHAINS[chainName];
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  });
}
```

## Performance Characteristics

### Cloudflare Workers Edge Deployment
- **Cold Start**: <50ms (Durable Objects)
- **Response Time**: <200ms (LLM streaming)
- **Concurrent Sessions**: 1000+ per Durable Object
- **Global Latency**: <100ms (edge network)

### Blockchain Operations
- **RPC Latency**: 50-150ms (QuickNode)
- **Multi-chain Queries**: Parallel execution via Promise.all
- **Transaction Simulation**: <500ms
- **Gas Estimation**: <200ms

### Cost Optimization
- **Durable Objects**: $0.15/million requests
- **Workers Compute**: $0.30/million requests
- **AI Inference**: Pay-per-token (OpenAI/Anthropic)
- **RPC Calls**: Included in QuickNode plan

## Development Setup

### Prerequisites
```bash
node >= 22.0.0
pnpm >= 10.0.0
wrangler >= 4.0.0
```

### Installation
```bash
# Clone the NullShot framework
git clone https://github.com/null-shot/typescript-agent-framework.git
cd typescript-agent-framework

# Install dependencies
pnpm install

# Navigate to agent
cd examples/base-yield-agent

# Configure environment
cp .vars-example .dev.vars
# Edit .dev.vars with your API keys
```

### Environment Variables
```bash
# AI Provider
AI_PROVIDER=anthropic
MODEL_ID=claude-sonnet-4-20250514
AI_PROVIDER_API_KEY=sk-ant-...

# Blockchain RPC
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
POLYGON_RPC_URL=https://polygon-rpc.com

# Thirdweb
THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key
```

### Local Development
```bash
# Start dev server with hot reload
pnpm dev

# Access at http://localhost:8787
# Chat UI: http://localhost:8787/
# Health: http://localhost:8787/agent/health
```

### Testing
```bash
# Run test suite
pnpm test

# Test A2A communication
curl -X POST http://localhost:8787/agent/register \
  -H "Content-Type: application/json" \
  -d '{"id":"test-agent","name":"Test","capabilities":[]}'

# Test blockchain tools
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is USDC APY on Aave Base?"}]}'
```

### Deployment
```bash
# Deploy to Cloudflare Workers
pnpm deploy

# Set production secrets
npx wrangler secret put AI_PROVIDER_API_KEY
npx wrangler secret put THIRDWEB_SECRET_KEY

# Monitor logs
npx wrangler tail
```

## Advanced Use Cases

### 1. Autonomous Yield Optimization
```typescript
// Agent discovers best yield across chains
const strategy = await agent.chat({
  message: "Find optimal USDC yield strategy across Base, Arbitrum, and Optimism with <5% risk"
});

// Agent coordinates with specialized agents
// 1. Yield Analyzer Agent: Fetches APYs from all protocols
// 2. Risk Assessor Agent: Evaluates smart contract risks
// 3. Transaction Builder Agent: Constructs optimal transaction
```

### 2. Multi-Agent DeFi Strategy
```typescript
// Coordinator agent orchestrates workflow
const workflow = await coordinator.composeWorkflow({
  name: 'Delta-Neutral Yield Strategy',
  steps: [
    { agent: 'yield-finder', task: 'find-best-lending-rate' },
    { agent: 'hedge-calculator', task: 'calculate-hedge-ratio' },
    { agent: 'dex-router', task: 'find-best-swap-route' },
    { agent: 'transaction-builder', task: 'build-atomic-transaction' }
  ]
});
```

### 3. Cross-Chain Arbitrage
```typescript
// Agent monitors price differences across chains
const arbitrage = await agent.chat({
  message: "Monitor USDC/USDT spread across Base and Arbitrum, execute if >0.5%"
});

// Agent uses cross-chain MCP server for bridging
// Coordinates with transaction builder for atomic execution
```

## Production Considerations

### Security
- ✅ No private key handling in agent code
- ✅ Transaction simulation before execution
- ✅ User approval required for all transactions
- ✅ Rate limiting via Cloudflare
- ✅ Input validation on all blockchain operations

### Monitoring
```typescript
// Custom metrics
await env.ANALYTICS.writeDataPoint({
  blobs: ['agent-action', 'yield-query'],
  doubles: [apy, tvl],
  indexes: [chainId]
});

// Error tracking
Sentry.captureException(error, {
  tags: { agent: 'base-yield', chain: 'base' }
});
```

### Scaling
- Horizontal: Multiple Durable Object instances
- Vertical: Increased compute limits per Worker
- Geographic: Edge deployment across 300+ cities
- Cost: Pay-per-use with no idle costs

## Documentation

- **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** - 8-week implementation roadmap
- **[TESTING_A2A_MCP.md](./TESTING_A2A_MCP.md)** - Comprehensive testing guide
- **[QUICK_START_A2A.md](./QUICK_START_A2A.md)** - Quick reference
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security audit report
- **[SUMMARY.md](./SUMMARY.md)** - Project overview

## Contributing

This agent demonstrates advanced patterns from the NullShot framework. Contributions welcome:

1. Fork the [NullShot framework](https://github.com/null-shot/typescript-agent-framework)
2. Create feature branch
3. Add tests for new functionality
4. Submit PR with detailed description

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

Built with:
- [NullShot Agent Framework](https://nullshot.ai) - Agent infrastructure
- [Thirdweb](https://thirdweb.com) - Wallet and smart account abstraction
- [viem](https://viem.sh) - Ethereum interactions
- [AI SDK v5](https://sdk.vercel.ai) - LLM integration
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge compute

---

**Production Agent** | Built on NullShot | Powered by Cloudflare Workers
