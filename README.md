# Web3 Crypto Yield Agent 🚀

An AI-powered agent that helps you discover and analyze DeFi yield opportunities across multiple blockchains. Built on Cloudflare Workers with the Nullshot Agent Framework.

## Features

- 🔍 **Multi-Chain Support**: Ethereum, Arbitrum, Optimism, Polygon, Base
- 💰 **Yield Comparison**: Compare APY/APR across major DeFi protocols
- ⚖️ **Risk Analysis**: Evaluate smart contract, liquidity, and market risks
- 💸 **Gas Tracking**: Monitor transaction costs across chains
- 🪙 **Token Balances**: Check wallet balances on any supported chain
- 🤖 **AI-Powered**: Natural language interface for complex DeFi queries
- 💬 **Session Management**: Persistent conversations using Durable Objects
- 🔄 **Streaming Responses**: Real-time AI responses with tool call streaming

## Quick Start

### Prerequisites

- Node.js 22+ and pnpm
- Cloudflare account with Workers enabled
- OpenAI or Anthropic API key

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .vars-example .dev.vars
   # Edit .dev.vars and add your API key
   ```

3. **Run locally**:
   ```bash
   pnpm dev
   ```

4. **Deploy to Cloudflare**:
   ```bash
   # Add your API key as a secret
   npx wrangler secret put AI_PROVIDER_API_KEY
   
   # Deploy
   pnpm deploy
   ```

## Example Queries

Try these natural language queries with the agent:

- "What are the best USDC yield opportunities right now?"
- "Compare Aave vs Compound yields for ETH"
- "Check my wallet balance: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
- "What's the gas price on Arbitrum?"
- "Analyze the risks of Uniswap V3 liquidity pools"
- "Find me low-risk stablecoin yields above 5% APY"
- "What's the difference between Curve and Yearn?"
- "Should I provide liquidity on Polygon or Arbitrum?"

## API Usage

### Start a Conversation

```bash
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the best yield opportunities for USDC?"
      }
    ]
  }'
```

### Continue a Conversation

```bash
curl -X POST http://localhost:8787/agent/chat/my-session-123 \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What about the risks?"
      }
    ]
  }'
```

## Available Tools

The agent has access to these Web3 tools:

### 1. getTokenBalance
Check ERC-20 token balance for any address on supported chains.

### 2. getGasPrice
Get current gas prices in gwei for transaction cost estimation.

### 3. compareYields
Compare APY/APR across major DeFi protocols (Aave, Compound, Uniswap, Curve, Yearn).

### 4. analyzeRisk
Analyze risk factors including smart contract risk, liquidity risk, impermanent loss, and more.

## Supported Protocols

- **Aave**: Lending and borrowing
- **Compound**: Algorithmic money markets
- **Uniswap**: Decentralized exchange and liquidity pools
- **Curve**: Stablecoin-focused AMM
- **Yearn Finance**: Yield aggregator

## Supported Chains

- Ethereum Mainnet
- Arbitrum
- Optimism
- Polygon
- Base

## Configuration

### Environment Variables

Set these in `.dev.vars` for local development or as Cloudflare secrets for production:

```bash
AI_PROVIDER=openai  # or anthropic
MODEL_ID=gpt-4o     # or claude-3-sonnet-20241022
AI_PROVIDER_API_KEY=your_api_key_here
```

### Switching AI Providers

**OpenAI (Default)**:
```bash
AI_PROVIDER=openai
MODEL_ID=gpt-4o
```

**Anthropic**:
```bash
AI_PROVIDER=anthropic
MODEL_ID=claude-3-sonnet-20241022
```

## Architecture

- **Framework**: Nullshot Agent SDK
- **Runtime**: Cloudflare Workers
- **AI SDK**: Vercel AI SDK v5
- **Web3**: viem for blockchain interactions
- **Session Management**: Cloudflare Durable Objects
- **API Framework**: Hono

## Roadmap

- [ ] Real-time yield data from DefiLlama API
- [ ] Historical yield tracking and charts
- [ ] Portfolio optimization recommendations
- [ ] Automated yield farming strategies
- [ ] Integration with more L2s (zkSync, Scroll, Linea)
- [ ] NFT yield opportunities
- [ ] Liquid staking derivatives analysis
- [ ] Price alerts and notifications
- [ ] Multi-wallet portfolio tracking

## Security Notes

⚠️ **Important**: This agent provides information only. Always:
- Verify data from multiple sources
- Understand the risks before investing
- Never share private keys with the agent
- Start with small amounts
- DYOR (Do Your Own Research)
- Be aware of smart contract risks
- Consider gas costs in your calculations

## Development

### Local Development

```bash
# Start with hot reload
pnpm dev

# Generate TypeScript types
pnpm cf-typegen

# Type check
pnpm build
```

### Testing

```bash
# Test basic query
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is DeFi?"}]}'

# Test with tools
curl -X POST http://localhost:8787/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is the gas price on Ethereum?"}]}'
```

## Project Structure

```
├── src/
│   └── index.ts              # Main agent with Web3 tools
├── package.json              # Dependencies
├── wrangler.jsonc           # Cloudflare Workers config
├── mcp.json                 # MCP tools configuration
├── .dev.vars                # Local environment variables
└── README.md                # This file
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- [Nullshot Documentation](https://nullshot.ai/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [viem Documentation](https://viem.sh)

---

Built with ❤️ using the Nullshot Agent Framework
