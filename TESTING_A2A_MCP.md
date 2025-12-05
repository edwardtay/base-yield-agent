# Testing A2A and MCP Integration

This guide helps you test Agent-to-Agent (A2A) communication and MCP (Model Context Protocol) functionality.

## Prerequisites

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .vars-example .dev.vars
# Edit .dev.vars and add your API keys
```

## 1. Testing MCP Configuration

### Check MCP Config
```bash
# View current MCP configuration
cat mcp.json

# Validate JSON structure
node -e "console.log(JSON.parse(require('fs').readFileSync('mcp.json', 'utf8')))"
```

### Test MCP Server Connection
```bash
# Start the agent in dev mode
pnpm dev

# In another terminal, test MCP endpoint
curl http://localhost:8787/mcp/health
```

## 2. Testing Agent Coordinator Service

### Test Agent Registration
```bash
# Register a new agent
curl -X POST http://localhost:8787/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "yield-optimizer-1",
    "name": "Yield Optimizer Agent",
    "endpoint": "http://localhost:8787",
    "capabilities": [{
      "id": "defi-yield",
      "name": "DeFi Yield Optimization",
      "description": "Optimizes yield farming strategies",
      "chains": ["base", "arbitrum", "optimism"],
      "protocols": ["aave", "compound", "uniswap"],
      "operations": ["optimize-yield", "compare-protocols", "risk-analysis"]
    }]
  }'
```

### Test Agent Discovery
```bash
# Discover agents by capability
curl -X POST http://localhost:8787/agent/discover \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "defi-yield"
  }'

# Expected response:
# {
#   "agents": [
#     {
#       "id": "yield-optimizer-1",
#       "name": "Yield Optimizer Agent",
#       "reputation": 100,
#       "capabilities": [...]
#     }
#   ]
# }
```

### Test Agent Messaging
```bash
# Send message to another agent
curl -X POST http://localhost:8787/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "from": "agent-1",
    "to": "yield-optimizer-1",
    "type": "request",
    "payload": {
      "action": "optimize-yield",
      "parameters": {
        "asset": "USDC",
        "amount": "10000",
        "riskTolerance": "medium"
      }
    }
  }'
```

### Test Task Delegation
```bash
# Delegate task to another agent
curl -X POST http://localhost:8787/agent/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "fromAgent": "coordinator",
    "toAgent": "yield-optimizer-1",
    "task": {
      "type": "optimize-yield",
      "description": "Find best USDC yield on Base",
      "parameters": {
        "asset": "USDC",
        "chain": "base",
        "minAPY": 5
      }
    }
  }'

# Check delegation status
curl http://localhost:8787/agent/delegation/{taskId}
```

## 3. Testing Blockchain Tools

### Test Smart Contract Read
```bash
# Chat with agent to call a contract
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Read the total supply of USDC on Base. Contract address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    }]
  }'
```

### Test Transaction Simulation
```bash
# Simulate a transaction
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Simulate supplying 1000 USDC to Aave on Base from address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }]
  }'
```

### Test DeFi Protocol Data
```bash
# Get Aave data
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "What is the current supply APY for USDC on Aave Base?"
    }]
  }'
```

### Test Multi-Chain Balance
```bash
# Check balance across chains
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "role": "user",
      "content": "Check USDC balance for 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb across Base, Arbitrum, and Optimism"
    }]
  }'
```

## 4. Testing Multi-Agent Workflows

### Test Workflow Composition
```bash
# Execute multi-agent workflow
curl -X POST http://localhost:8787/agent/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Optimize and Execute Yield Strategy",
    "steps": [
      {
        "agentCapability": "defi-yield",
        "task": {
          "action": "find-best-yield",
          "asset": "USDC",
          "chains": ["base", "arbitrum"]
        }
      },
      {
        "agentCapability": "risk-analysis",
        "task": {
          "action": "assess-risk",
          "protocol": "aave"
        }
      },
      {
        "agentCapability": "transaction-builder",
        "task": {
          "action": "build-transaction",
          "operation": "supply"
        }
      }
    ]
  }'
```

## 5. Testing with Chat Interface

### Basic Queries
```bash
# Start dev server
pnpm dev

# Open browser to http://localhost:8787
# Try these queries in the chat:

1. "Register this agent with capability: defi-yield"
2. "Discover other agents that can help with yield optimization"
3. "Delegate the task of finding best USDC yields to another agent"
4. "What is the current APY for USDC on Aave Base?"
5. "Simulate supplying 1000 USDC to Aave"
6. "Check my USDC balance across Base, Arbitrum, and Optimism"
```

### Advanced Queries
```bash
1. "Find the best yield opportunity for USDC across all chains"
2. "Compare Aave vs Compound yields on Base"
3. "Build a transaction to supply 5000 USDC to the best protocol"
4. "Coordinate with other agents to execute a multi-step yield strategy"
5. "What agents are available in the network?"
```

## 6. Testing MCP Tools

### List Available MCP Tools
```bash
curl http://localhost:8787/mcp/tools
```

### Call MCP Tool Directly
```bash
# Example: Call a DeFi data tool
curl -X POST http://localhost:8787/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "server": "defi-data",
    "tool": "getProtocolYields",
    "parameters": {
      "protocol": "aave",
      "chain": "base"
    }
  }'
```

## 7. Monitoring and Debugging

### Check Agent Status
```bash
# Get agent health
curl http://localhost:8787/agent/health

# Expected response:
# {
#   "status": "healthy",
#   "registeredAgents": 5,
#   "activeConnections": 3,
#   "mcpServers": ["mcp-template", "defi-data"],
#   "uptime": 3600
# }
```

### View Agent Logs
```bash
# In dev mode, logs appear in terminal
pnpm dev

# For production, use Cloudflare dashboard:
# https://dash.cloudflare.com -> Workers -> fantastic-tool-wwkw -> Logs
```

### Debug MCP Connection
```bash
# Check MCP server status
curl http://localhost:8787/mcp/status

# Test specific MCP server
curl http://localhost:8787/mcp/test/defi-data
```

## 8. Performance Testing

### Load Test Agent Communication
```bash
# Install k6 for load testing
brew install k6  # macOS
# or download from https://k6.io

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    messages: [{
      role: 'user',
      content: 'What is the gas price on Base?'
    }]
  });

  const res = http.post('http://localhost:8787/agent/chat', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}
EOF

# Run load test
k6 run load-test.js
```

## 9. Integration Testing

### Test Full A2A Flow
```javascript
// test-a2a-flow.js
const BASE_URL = 'http://localhost:8787';

async function testA2AFlow() {
  // 1. Register two agents
  const agent1 = await fetch(`${BASE_URL}/agent/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'agent-1',
      name: 'Coordinator Agent',
      endpoint: BASE_URL,
      capabilities: [{ id: 'coordination', operations: ['coordinate'] }]
    })
  });

  const agent2 = await fetch(`${BASE_URL}/agent/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'agent-2',
      name: 'Executor Agent',
      endpoint: BASE_URL,
      capabilities: [{ id: 'execution', operations: ['execute'] }]
    })
  });

  console.log('✅ Agents registered');

  // 2. Discover agents
  const discovery = await fetch(`${BASE_URL}/agent/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ capability: 'execution' })
  });

  const agents = await discovery.json();
  console.log('✅ Agents discovered:', agents.length);

  // 3. Delegate task
  const delegation = await fetch(`${BASE_URL}/agent/delegate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromAgent: 'agent-1',
      toAgent: 'agent-2',
      task: {
        type: 'execute',
        description: 'Test task',
        parameters: { test: true }
      }
    })
  });

  const task = await delegation.json();
  console.log('✅ Task delegated:', task.taskId);

  // 4. Check status
  const status = await fetch(`${BASE_URL}/agent/delegation/${task.taskId}`);
  const taskStatus = await status.json();
  console.log('✅ Task status:', taskStatus.status);

  console.log('\n🎉 A2A flow test completed successfully!');
}

testA2AFlow().catch(console.error);
```

Run the test:
```bash
node test-a2a-flow.js
```

## 10. Troubleshooting

### Common Issues

#### MCP Server Not Found
```bash
# Check if MCP servers are configured
cat mcp.json

# Verify MCP service binding in wrangler.jsonc
grep -A 5 "services" wrangler.jsonc
```

#### Agent Not Responding
```bash
# Check Durable Object status
curl http://localhost:8787/agent/health

# Restart dev server
pnpm dev
```

#### Blockchain RPC Errors
```bash
# Test RPC connectivity
curl -X POST https://mainnet.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check if RPC URLs are correct in blockchain-tools.ts
```

#### Tool Not Available
```bash
# List all available tools
curl http://localhost:8787/agent/tools

# Check if tool is registered in index.ts
grep -n "tool" src/index.ts
```

## Success Criteria

✅ MCP configuration loads successfully
✅ Agents can register and be discovered
✅ Messages can be sent between agents
✅ Tasks can be delegated and tracked
✅ Blockchain tools can read contract data
✅ Transactions can be simulated
✅ DeFi protocol data can be fetched
✅ Multi-agent workflows execute correctly
✅ Performance meets requirements (< 2s response time)
✅ No errors in logs

## Next Steps

After successful testing:

1. Deploy to Cloudflare Workers staging
2. Test with real blockchain data
3. Implement additional MCP servers
4. Add authentication and authorization
5. Set up monitoring and alerting
6. Deploy to production

## Resources

- [NullShot Agent Docs](https://nullshot.ai/docs)
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [Viem Documentation](https://viem.sh)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
