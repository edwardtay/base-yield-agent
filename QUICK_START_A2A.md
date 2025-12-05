# Quick Start: A2A & Blockchain Composability

## What You Have Now

✅ **Base Yield Agent** - DeFi-focused AI agent
✅ **Basic MCP Config** - Template server configured
✅ **Simple Web3 Tools** - Gas price, token balance
✅ **Chat UI** - Wallet connection, streaming responses

## What's Been Added

### 1. Agent Coordinator Service (`src/services/agent-coordinator.ts`)
Enables agent-to-agent communication:
- Agent registration and discovery
- Inter-agent messaging
- Task delegation
- Multi-agent workflow composition
- Reputation tracking

### 2. Enhanced Blockchain Tools (`src/tools/blockchain-tools.ts`)
Comprehensive Web3 capabilities:
- Smart contract read/write
- Transaction simulation
- DeFi protocol integrations (Aave, Uniswap)
- Multi-chain balance checking
- Transaction building

### 3. Updated MCP Config (`mcp.json`)
Roadmap for specialized MCP servers:
- `defi-data` - DeFi protocol data aggregation
- `blockchain-rpc` - Advanced blockchain operations
- `agent-coordinator` - A2A communication
- `cross-chain` - Cross-chain messaging

### 4. Documentation
- `IMPROVEMENTS.md` - Comprehensive improvement roadmap
- `TESTING_A2A_MCP.md` - Testing guide
- `QUICK_START_A2A.md` - This file

## How to Use

### Step 1: Integrate Agent Coordinator

Update `src/index.ts`:

```typescript
import { AgentCoordinatorService } from './services/agent-coordinator';

export class SimplePromptAgent extends AiSdkAgent<Env> {
	constructor(state: DurableObjectState, env: Env) {
		// ... existing code ...
		
		// Add Agent Coordinator Service
		super(state, env, model, [
			new ToolboxService(env, mcpConfig),
			new AgentCoordinatorService()  // Add this
		]);
	}
}
```

### Step 2: Add Blockchain Tools

Update `src/index.ts` to include new tools:

```typescript
import { blockchainTools } from './tools/blockchain-tools';

// In your agent's processMessage method:
async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
	const result = await this.streamTextWithMessages(
		sessionId,
		messages.messages,
		{
			system: `...your existing system prompt...`,
			tools: {
				// Add blockchain tools
				...blockchainTools,
				// Your existing tools...
			},
			maxSteps: 10,
		}
	);
	
	return result.toTextStreamResponse();
}
```

### Step 3: Test A2A Communication

```bash
# Start dev server
pnpm dev

# In chat UI, try:
"Register this agent as a yield optimizer"
"Discover other agents in the network"
"Delegate yield optimization task to another agent"
```

### Step 4: Test Blockchain Tools

```bash
# In chat UI, try:
"What is the supply APY for USDC on Aave Base?"
"Simulate supplying 1000 USDC to Aave"
"Check USDC balance across Base, Arbitrum, and Optimism"
"Get Uniswap V3 pool data for USDC/WETH on Base"
```

## Key Concepts

### Agent-to-Agent (A2A) Communication

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Agent 1   │────────>│ Coordinator │────────>│   Agent 2   │
│  (Yield)    │ Delegate│   Service   │ Route   │   (Risk)    │
└─────────────┘         └─────────────┘         └─────────────┘
```

**Benefits:**
- Specialized agents for specific tasks
- Parallel processing of complex workflows
- Shared knowledge and state
- Reputation-based agent selection

### Blockchain Composability

```
┌─────────────┐
│    Agent    │
└──────┬──────┘
       │
       ├──> Read Contract (Aave APY)
       ├──> Simulate Transaction
       ├──> Build Transaction
       ├──> Multi-chain Query
       └──> Cross-chain Message
```

**Benefits:**
- Interact with any smart contract
- Safe transaction simulation
- Multi-chain operations
- DeFi protocol integrations

### MCP Architecture

```
┌─────────────────────────────────────┐
│           Your Agent                │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────┐ │
│  │ DeFi    │  │Blockchain│  │ A2A │ │
│  │ Data    │  │   RPC    │  │Coord│ │
│  │  MCP    │  │   MCP    │  │ MCP │ │
│  └─────────┘  └─────────┘  └─────┘ │
└─────────────────────────────────────┘
```

**Benefits:**
- Modular tool architecture
- Easy to add new capabilities
- Reusable across agents
- Standard protocol

## Example Workflows

### 1. Simple Yield Query
```
User: "What's the best USDC yield on Base?"
  ↓
Agent uses: getAaveData tool
  ↓
Response: "Aave offers 5.2% APY for USDC on Base"
```

### 2. Multi-Agent Workflow
```
User: "Find and execute best yield strategy"
  ↓
Agent 1 (Coordinator): Discovers yield agents
  ↓
Agent 2 (Yield Finder): Finds best APY
  ↓
Agent 3 (Risk Analyzer): Assesses risks
  ↓
Agent 1: Builds transaction
  ↓
Response: "Best strategy: Aave 5.2% APY, Low risk, Transaction ready"
```

### 3. Cross-Chain Operation
```
User: "Check my USDC balance everywhere"
  ↓
Agent uses: getMultiChainBalance tool
  ↓
Parallel queries: Base, Arbitrum, Optimism, Polygon
  ↓
Response: "Base: 1000 USDC, Arbitrum: 500 USDC, ..."
```

## Next Steps

### Immediate (This Week)
1. ✅ Integrate Agent Coordinator Service
2. ✅ Add blockchain tools to agent
3. ✅ Test A2A communication
4. ✅ Test blockchain interactions

### Short Term (Next 2 Weeks)
1. Create first specialized MCP server (defi-data)
2. Implement agent registry with D1
3. Add authentication for agent communication
4. Deploy to Cloudflare Workers staging

### Medium Term (Next Month)
1. Build remaining MCP servers
2. Implement cross-chain messaging
3. Add agent wallet service
4. Create multi-agent workflows

### Long Term (Next Quarter)
1. Agent autonomy and execution
2. Revenue sharing mechanisms
3. Performance optimization
4. Production deployment

## Common Patterns

### Pattern 1: Agent Discovery
```typescript
// Find agents with specific capability
const agents = await coordinator.discoverAgents('defi-yield');
const bestAgent = agents[0]; // Sorted by reputation
```

### Pattern 2: Task Delegation
```typescript
// Delegate task to specialized agent
const delegation = await coordinator.delegateTask({
  fromAgent: 'coordinator',
  toAgent: bestAgent.id,
  task: {
    type: 'optimize-yield',
    parameters: { asset: 'USDC', chain: 'base' }
  }
});
```

### Pattern 3: Multi-Chain Query
```typescript
// Check balance across chains
const balances = await getMultiChainBalance({
  address: userAddress,
  tokenAddress: USDC_ADDRESS,
  chains: ['base', 'arbitrum', 'optimism']
});
```

### Pattern 4: Smart Contract Interaction
```typescript
// Read from any contract
const data = await callContract({
  chain: 'base',
  contractAddress: AAVE_POOL,
  functionName: 'getReserveData',
  abi: AAVE_ABI,
  args: [USDC_ADDRESS]
});
```

## Troubleshooting

### Issue: Agent not responding
**Solution:** Check Durable Object status, restart dev server

### Issue: Blockchain tool fails
**Solution:** Verify RPC URLs, check contract addresses

### Issue: MCP server not found
**Solution:** Check mcp.json, verify service binding

### Issue: A2A message not delivered
**Solution:** Check agent registration, verify coordinator service

## Resources

- **Full Roadmap:** See `IMPROVEMENTS.md`
- **Testing Guide:** See `TESTING_A2A_MCP.md`
- **NullShot Docs:** https://nullshot.ai/docs
- **MCP Spec:** https://modelcontextprotocol.io
- **Viem Docs:** https://viem.sh

## Questions?

Join the NullShot Discord: https://discord.gg/acwpp6zWEc
Channel: #agent or #mcp

---

**You now have the foundation for building a network of interoperable AI agents with blockchain composability!** 🚀
