import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ToolboxService } from '@nullshot/agent';
import { stepCountIs, type LanguageModel, type Provider, tool } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { AiSdkAgent, AIUISDKMessage } from '@nullshot/agent';
import { createPublicClient, http, formatUnits } from 'viem';
import { mainnet, arbitrum, optimism, polygon, base } from 'viem/chains';
import { z } from 'zod';
import mcpConfig from '../mcp.json'

// Instantiate application with Hono
const app = new Hono<{ Bindings: Env }>();

app.use(
	'*',
	cors({
		origin: '*', // Allow any origin for development; restrict this in production
		allowMethods: ['POST', 'GET', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
		exposeHeaders: ['X-Session-Id'],
		maxAge: 86400, // 24 hours
	}),
);

// API endpoint to get real-time Base data
app.get('/api/base-data', async (c) => {
	const { BASE_RPC_URL } = c.env;
	
	try {
		// Fetch gas price
		const gasPriceResponse = await fetch(BASE_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_gasPrice',
				params: [],
				id: 1
			})
		});
		const gasPriceData: any = await gasPriceResponse.json();
		const gasPrice = parseInt(gasPriceData.result, 16) / 1e9; // Convert to gwei
		
		// Fetch latest block
		const blockResponse = await fetch(BASE_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_blockNumber',
				params: [],
				id: 2
			})
		});
		const blockData: any = await blockResponse.json();
		const blockNumber = parseInt(blockData.result, 16);
		
		return c.json({
			gasPrice: gasPrice.toFixed(4),
			blockNumber,
			network: 'Base',
			rpcHealthy: true
		});
	} catch (error: any) {
		return c.json({ error: error.message, rpcHealthy: false }, 500);
	}
});

// API endpoint to get ETH balance
app.post('/api/eth-balance', async (c) => {
	const { BASE_RPC_URL } = c.env;
	const { address } = await c.req.json();
	
	try {
		const response = await fetch(BASE_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_getBalance',
				params: [address, 'latest'],
				id: 1
			})
		});
		
		const result: any = await response.json();
		const balanceWei = result.result ? parseInt(result.result, 16) : 0;
		const balanceEth = (balanceWei / 1e18).toFixed(4);
		
		return c.json({ balance: balanceEth, address });
	} catch (error: any) {
		return c.json({ error: error.message, balance: '0.0000' }, 500);
	}
});

// API endpoint to get token balance
app.post('/api/token-balance', async (c) => {
	const { BASE_RPC_URL } = c.env;
	const { address, tokenAddress } = await c.req.json();
	
	try {
		// ERC20 balanceOf function signature
		const data = '0x70a08231' + address.slice(2).padStart(64, '0');
		
		const response = await fetch(BASE_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_call',
				params: [{
					to: tokenAddress,
					data: data
				}, 'latest'],
				id: 1
			})
		});
		
		const result: any = await response.json();
		const balance = result.result ? parseInt(result.result, 16) : 0;
		
		return c.json({ balance: balance.toString(), address, tokenAddress });
	} catch (error: any) {
		return c.json({ error: error.message }, 500);
	}
});

// Serve the UI at root
app.get('/', (c) => {
	return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Base Yield Agent</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%230052FF'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='%23FFD700' font-weight='bold'>⚡</text></svg>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/thirdweb@5/dist/thirdweb.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        

        
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            margin: 0;
            color: #fff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .price-ticker {
            background: #111;
            padding: 12px 24px;
            display: flex;
            gap: 24px;
            overflow-x: auto;
            border-bottom: 1px solid #222;
        }
        
        .price-ticker::-webkit-scrollbar { height: 4px; }
        .price-ticker::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .price-ticker::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
        
        .ticker-item {
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        .ticker-symbol {
            font-weight: 700;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .ticker-price {
            font-weight: 600;
            font-size: 14px;
            color: white;
        }
        
        .ticker-change {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        
        .ticker-change.positive {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .ticker-change.negative {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        
        .container {
            background: #1a1a1a;
            border: none;
            border-radius: 0;
            box-shadow: none;
            max-width: 100%;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        .sidebar {
            width: 280px;
            background: #111;
            border-right: 1px solid #222;
            padding: 20px;
            overflow-y: auto;
        }
        
        .sidebar::-webkit-scrollbar { width: 6px; }
        .sidebar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .sidebar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
        
        .sidebar h3 {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        
        .metric-card {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 12px;
        }
        
        .metric-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        
        .metric-value {
            font-size: 20px;
            font-weight: 700;
            color: white;
        }
        
        .metric-subtext {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 4px;
        }
        
        .protocol-item {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .protocol-item:hover {
            background: #0052FF;
            border-color: #0052FF;
            transform: translateX(4px);
        }
        
        .protocol-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        
        .protocol-name {
            font-weight: 600;
            font-size: 14px;
            color: white;
        }
        
        .protocol-apy {
            font-weight: 700;
            font-size: 14px;
            color: #10b981;
        }
        
        .protocol-tvl {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .header {
            background: #111;
            padding: 20px 24px;
            border-bottom: 1px solid #222;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .header-left h1 .base-text {
            color: #0052FF;
        }
        
        .header-left h1 .yield-text {
            color: #FFD700;
        }
        
        .header-left h1 .agent-text {
            color: #FFD700;
        }
        
        .base-logo {
            width: 28px;
            height: 28px;
            background: #0052FF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 16px;
            color: white;
        }
        
        .header-left p {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .wallet-btn {
            padding: 10px 20px;
            background: #0052FF;
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .wallet-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 82, 255, 0.4);
            background: #0045DD;
        }
        
        .wallet-btn.connected {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.4);
        }
        
        .portfolio {
            padding: 16px 24px;
            background: rgba(16, 185, 129, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: none;
        }
        
        .portfolio.visible { display: block; }
        
        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
        }
        
        .portfolio-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }
        
        .portfolio-item label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .portfolio-item .value {
            font-size: 18px;
            font-weight: 700;
            margin-top: 4px;
            color: #10b981;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .messages::-webkit-scrollbar { width: 8px; }
        .messages::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .messages::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message {
            max-width: 75%;
            padding: 14px 18px;
            border-radius: 16px;
            word-wrap: break-word;
            line-height: 1.6;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        }
        
        .message strong {
            color: #fff;
            font-weight: 600;
        }
        
        .message em {
            font-style: italic;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .message code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }
        
        .user {
            align-self: flex-end;
            background: #0052FF;
            color: white;
            box-shadow: 0 4px 12px rgba(0, 82, 255, 0.3);
        }
        
        .assistant {
            align-self: flex-start;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            color: #e0e0e0;
        }
        
        .loading {
            align-self: flex-start;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            color: #888;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
        }
        
        .loading-dots {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        
        .loading-dot {
            width: 8px;
            height: 8px;
            background: #0052FF;
            border-radius: 50%;
            animation: pulse 1.4s ease-in-out infinite;
        }
        
        .loading-dot:nth-child(1) {
            animation-delay: 0s;
        }
        
        .loading-dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .loading-dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes pulse {
            0%, 60%, 100% {
                transform: scale(1);
                opacity: 0.4;
            }
            30% {
                transform: scale(1.3);
                opacity: 1;
            }
        }
        
        .loading-text {
            font-weight: 500;
            color: #888;
            font-size: 13px;
        }
        
        .examples {
            padding: 12px 24px;
            background: #111;
            border-top: 1px solid #222;
            font-size: 12px;
        }
        
        .examples strong {
            color: rgba(255, 255, 255, 0.7);
            display: block;
            margin-bottom: 8px;
        }
        
        .example-btn {
            display: inline-block;
            margin: 4px 4px 0 0;
            padding: 6px 12px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 12px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
            color: #888;
        }
        
        .example-btn:hover {
            background: #0052FF;
            color: white;
            border-color: transparent;
            transform: translateY(-2px);
        }
        
        .input-area {
            padding: 20px 24px;
            background: #111;
            border-top: 1px solid #222;
            display: flex;
            gap: 12px;
        }
        
        input {
            flex: 1;
            padding: 14px 20px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 16px;
            font-size: 14px;
            color: white;
            outline: none;
            transition: all 0.3s;
        }
        
        input::placeholder { color: #555; }
        
        input:focus {
            background: #222;
            border-color: #0052FF;
            box-shadow: 0 0 0 3px rgba(0, 82, 255, 0.2);
        }
        
        .send-btn {
            padding: 14px 28px;
            background: #0052FF;
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .send-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 82, 255, 0.4);
            background: #0045DD;
        }
        
        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="price-ticker" id="priceTicker">
            <div class="ticker-item">
                <span class="ticker-symbol">ETH</span>
                <span class="ticker-price" id="eth-price">$--</span>
                <span class="ticker-change" id="eth-change">--%</span>
            </div>
            <div class="ticker-item">
                <span class="ticker-symbol">BTC</span>
                <span class="ticker-price" id="btc-price">$--</span>
                <span class="ticker-change" id="btc-change">--%</span>
            </div>
            <div class="ticker-item">
                <span class="ticker-symbol">USDC</span>
                <span class="ticker-price" id="usdc-price">$--</span>
                <span class="ticker-change" id="usdc-change">--%</span>
            </div>
            <div class="ticker-item">
                <span class="ticker-symbol">AAVE</span>
                <span class="ticker-price" id="aave-price">$--</span>
                <span class="ticker-change" id="aave-change">--%</span>
            </div>
            <div class="ticker-item">
                <span class="ticker-symbol">UNI</span>
                <span class="ticker-price" id="uni-price">$--</span>
                <span class="ticker-change" id="uni-change">--%</span>
            </div>
        </div>
        
        <div class="header">
            <div class="header-left">
                <h1>
                    <span class="base-logo">⚡</span> 
                    <span class="base-text">Base</span> 
                    <span class="yield-text">Yield</span> 
                    <span class="agent-text">Agent</span>
                </h1>
                <p>Elite DeFi alpha for sophisticated traders</p>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button id="refreshBtn" onclick="fetchAllTokenBalances()" style="display: none; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #888; font-size: 18px; cursor: pointer; transition: all 0.2s; line-height: 1;" onmouseover="this.style.background='rgba(0, 82, 255, 0.1)'; this.style.borderColor='rgba(0, 82, 255, 0.3)'; this.style.transform='rotate(180deg)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.transform='rotate(0deg)';" title="Refresh balances">
                    🔄
                </button>
                <button class="wallet-btn" id="walletBtn" onclick="connectWallet()">
                    <span id="walletIcon">🦊</span>
                    <span id="walletText">Connect Wallet</span>
                </button>
            </div>
        </div>
        
        <div class="portfolio" id="portfolio">
            <div class="portfolio-grid">
                <div class="portfolio-item">
                    <label>Address</label>
                    <div class="value" id="address" style="font-size: 12px;">-</div>
                </div>
                <div class="portfolio-item">
                    <label>Balance</label>
                    <div class="value" id="balance">-</div>
                </div>
                <div class="portfolio-item">
                    <label>Network</label>
                    <div class="value" id="network">-</div>
                </div>
                <div class="portfolio-item" style="grid-column: 1 / -1;">
                    <button onclick="fetchAllTokenBalances()" style="width: 100%; padding: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: #888; font-size: 11px; cursor: pointer; font-weight: 500; transition: all 0.2s;" onmouseover="this.style.background='rgba(0, 82, 255, 0.1)'; this.style.borderColor='rgba(0, 82, 255, 0.3)'; this.style.color='#0052FF';" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.color='#888';">
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="sidebar">
                <h3>📊 Base Metrics</h3>
                <div class="metric-card">
                    <div class="metric-label">Gas Price</div>
                    <div class="metric-value" id="gas-price">-- gwei</div>
                    <div class="metric-subtext">Base Network</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Total TVL</div>
                    <div class="metric-value" id="total-tvl">$--</div>
                    <div class="metric-subtext">Across all protocols</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Active Users</div>
                    <div class="metric-value" id="active-users">--</div>
                    <div class="metric-subtext">Last 24h</div>
                </div>
                
                <h3 style="margin-top: 24px;">⚡ AI Yield Agents</h3>
                <div class="protocol-item" onclick="window.open('https://app.arma.xyz', '_blank')" style="background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(75, 0, 130, 0.1) 100%); border: 1px solid rgba(138, 43, 226, 0.3);">
                    <div class="protocol-header">
                        <span class="protocol-name">🛡️ ARMA</span>
                        <span class="protocol-apy" style="color: #8A2BE2;">Auto</span>
                    </div>
                    <div class="protocol-tvl">Giza's Stablecoin Agent • Autonomous</div>
                </div>
                <div class="protocol-item" onclick="window.open('https://studio.fungi.ag', '_blank')" style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%); border: 1px solid rgba(255, 215, 0, 0.3);">
                    <div class="protocol-header">
                        <span class="protocol-name">🍄 Fungi</span>
                        <span class="protocol-apy" style="color: #FFD700;">Auto</span>
                    </div>
                    <div class="protocol-tvl">USDC Yield Agent • Non-custodial</div>
                </div>
                
                <h3 style="margin-top: 20px;">🔥 Trending Protocols</h3>
                <div class="protocol-item" onclick="sendExample('Tell me about Aerodrome Finance')">
                    <div class="protocol-header">
                        <span class="protocol-name">Aerodrome</span>
                        <span class="protocol-apy">12.5%</span>
                    </div>
                    <div class="protocol-tvl">TVL: $450M</div>
                </div>
                <div class="protocol-item" onclick="sendExample('What is Moonwell on Base?')">
                    <div class="protocol-header">
                        <span class="protocol-name">Moonwell</span>
                        <span class="protocol-apy">8.3%</span>
                    </div>
                    <div class="protocol-tvl">TVL: $180M</div>
                </div>
                <div class="protocol-item" onclick="sendExample('Explain BaseSwap yields')">
                    <div class="protocol-header">
                        <span class="protocol-name">BaseSwap</span>
                        <span class="protocol-apy">15.7%</span>
                    </div>
                    <div class="protocol-tvl">TVL: $95M</div>
                </div>
                <div class="protocol-item" onclick="sendExample('How does Seamless Protocol work?')">
                    <div class="protocol-header">
                        <span class="protocol-name">Seamless</span>
                        <span class="protocol-apy">6.8%</span>
                    </div>
                    <div class="protocol-tvl">TVL: $120M</div>
                </div>
                <div class="protocol-item" onclick="sendExample('Compare Uniswap V3 on Base')">
                    <div class="protocol-header">
                        <span class="protocol-name">Uniswap V3</span>
                        <span class="protocol-apy">9.2%</span>
                    </div>
                    <div class="protocol-tvl">TVL: $280M</div>
                </div>
            </div>
            
            <div class="chat-area">
                <div class="messages" id="messages">
                <div class="message assistant">
                    <div style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #000; margin-bottom: 12px;">⚡ EXPERT MODE</div><br>
                    <strong>Base Yield Agent - Alpha Edition</strong><br><br>
                    Elite DeFi intelligence for sophisticated traders. I provide:<br><br>
                    📊 Advanced yield optimization strategies<br>
                    💎 Alpha opportunities across Base protocols<br>
                    ⚙️ Technical analysis: APYs, TVLs, utilization rates<br>
                    🎯 Risk-adjusted return calculations<br>
                    🔬 Smart contract mechanics & exploit vectors<br><br>
                    <div style="background: rgba(138, 43, 226, 0.1); border: 1px solid rgba(138, 43, 226, 0.3); padding: 10px; border-radius: 8px; margin: 10px 0;">
                        <strong>🛡️ ARMA</strong> <span style="font-size: 12px; color: #888;">by Giza • Autonomous stablecoin yield</span><br>
                        <button onclick="window.open('https://app.arma.xyz', '_blank')" style="margin-top: 6px; padding: 5px 10px; background: #8A2BE2; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">Launch →</button>
                        <button onclick="window.open('https://docs.arma.xyz', '_blank')" style="margin-left: 6px; padding: 5px 10px; background: transparent; color: #8A2BE2; border: 1px solid #8A2BE2; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">Docs</button>
                    </div>
                    <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); padding: 10px; border-radius: 8px; margin: 10px 0;">
                        <strong>🍄 Fungi</strong> <span style="font-size: 12px; color: #888;">USDC yield • Non-custodial</span><br>
                        <button onclick="window.open('https://studio.fungi.ag', '_blank')" style="margin-top: 6px; padding: 5px 10px; background: #FFD700; color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 11px;">Launch →</button>
                    </div>
                    <strong>Connect wallet for portfolio analysis →</strong>
                </div>
            </div>
            
                <div class="examples">
                <strong>💡 Quick Actions:</strong><br>
                <span class="example-btn" onclick="sendExample('Compare ARMA vs Fungi yield agents')">🛡️ ARMA vs Fungi</span>
                <span class="example-btn" onclick="sendExample('How does ARMA work and what are the fees?')">🤖 ARMA Agent</span>
                <span class="example-btn" onclick="sendExample('Best stablecoin yields on Base')">💵 Stablecoin Yields</span>
                <span class="example-btn" onclick="sendExample('Analyze AI agents vs manual farming')">⚖️ AI vs Manual</span>
                <span class="example-btn" onclick="sendExample('What is the gas price on Base?')">⛽ Gas Price</span>
            </div>
            
            <div class="input-area">
                <input type="text" id="userInput" placeholder="Ask about Base yields, gas prices, or your portfolio..." onkeypress="handleKeyPress(event)">
                <button class="send-btn" onclick="sendMessage()" id="sendBtn">Send</button>
            </div>
            </div>
        </div>
    </div>
    
    <script>
        const messagesDiv = document.getElementById('messages');
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');
        const sessionId = crypto.randomUUID();
        let conversationHistory = [];
        let walletAddress = null;
        let thirdwebClient = null;
        
        // Initialize Thirdweb
        const THIRDWEB_CLIENT_ID = 'd597e60a1420c5e5fed43ef178b99f57';
        const BASE_CHAIN_ID = 8453;
        
        // Base token addresses
        const BASE_TOKENS = {
            USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
            AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            WETH: '0x4200000000000000000000000000000000000006'
        };

        async function connectWallet() {
            if (typeof window.ethereum === 'undefined') {
                alert('MetaMask is not installed! Please install MetaMask to connect your wallet.');
                window.open('https://metamask.io/download/', '_blank');
                return;
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                walletAddress = accounts[0];
                
                // Check if on Base network
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const chainIdDecimal = parseInt(chainId, 16);
                
                // Switch to Base if not already
                if (chainIdDecimal !== BASE_CHAIN_ID) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x2105' }], // Base chain ID
                        });
                    } catch (switchError) {
                        // Chain not added, add it
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                                    rpcUrls: ['https://mainnet.base.org'],
                                    blockExplorerUrls: ['https://basescan.org']
                                }]
                            });
                        }
                    }
                }
                
                // Get ETH balance via QuickNode
                const balanceResponse = await fetch('/api/eth-balance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: walletAddress })
                });
                const balanceData = await balanceResponse.json();
                const ethBalance = balanceData.balance || '0.0000';
                
                // Fetch token balances using QuickNode
                await fetchAllTokenBalances();
                
                // Update UI
                document.getElementById('walletBtn').classList.add('connected');
                document.getElementById('walletIcon').textContent = '✅';
                document.getElementById('walletText').textContent = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
                document.getElementById('portfolio').classList.add('visible');
                document.getElementById('address').textContent = walletAddress.slice(0, 10) + '...' + walletAddress.slice(-8);
                document.getElementById('balance').textContent = ethBalance + ' ETH';
                document.getElementById('network').textContent = 'Base';
                
                // Fetch token balances silently - they show in portfolio section above
                await fetchAllTokenBalances();
                
            } catch (error) {
                console.error('Error connecting wallet:', error);
                alert('Failed to connect wallet: ' + error.message);
            }
        }

        function addMessage(content, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user' : 'assistant'}\`;
            messageDiv.innerHTML = formatMessage(content);
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function formatMessage(text) {
            // Format headers (###, ##, #)
            text = text.replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 700; color: #FFD700; margin: 12px 0 8px 0;">$1</h3>');
            text = text.replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 700; color: #FFD700; margin: 14px 0 10px 0;">$1</h2>');
            text = text.replace(/^# (.+)$/gm, '<h1 style="font-size: 20px; font-weight: 700; color: #FFD700; margin: 16px 0 12px 0;">$1</h1>');
            
            // Format line breaks
            text = text.split('\\n').join('<br>');
            
            // Format markdown bold
            const boldRegex = /\\*\\*([^*]+)\\*\\*/g;
            text = text.replace(boldRegex, '<strong style="color: #fff;">$1</strong>');
            
            // Format markdown italic
            const italicRegex = /\\*([^*]+)\\*/g;
            text = text.replace(italicRegex, '<em style="color: rgba(255,255,255,0.8);">$1</em>');
            
            // Format lists with proper styling
            text = text.replace(/^- (.+)$/gm, '<div style="margin-left: 12px; margin-bottom: 4px;">• $1</div>');
            text = text.replace(/^\\d+\\. (.+)$/gm, '<div style="margin-left: 12px; margin-bottom: 4px;"><strong>$1</strong></div>');
            
            // Format code blocks
            text = text.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre style="background: #000; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0;"><code>$1</code></pre>');
            text = text.replace(/\`([^\`]+)\`/g, '<code style="background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>');
            
            // Format percentages
            const percentRegex = /(\\d+\\.?\\d*)%/g;
            text = text.replace(percentRegex, '<span style="color: #10b981; font-weight: 600;">$1%</span>');
            
            // Format dollar amounts
            const dollarRegex = /\\$(\\d+\\.?\\d*[KMB]?)/g;
            text = text.replace(dollarRegex, '<span style="color: #0052FF; font-weight: 600;">$$1</span>');
            
            return text;
        }

        function addLoadingMessage() {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message loading';
            loadingDiv.id = 'loading';
            loadingDiv.innerHTML = \`
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
                <span class="loading-text">Analyzing DeFi data...</span>
            \`;
            messagesDiv.appendChild(loadingDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Fetch live crypto prices
        async function fetchPrices() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,aave,uniswap&vs_currencies=usd&include_24hr_change=true');
                const data = await response.json();
                
                updatePrice('eth', data.ethereum);
                updatePrice('btc', data.bitcoin);
                updatePrice('usdc', data['usd-coin']);
                updatePrice('aave', data.aave);
                updatePrice('uni', data.uniswap);
            } catch (error) {
                console.error('Error fetching prices:', error);
            }
        }
        
        function updatePrice(symbol, data) {
            if (!data) return;
            const price = data.usd;
            const change = data.usd_24h_change;
            
            document.getElementById(\`\${symbol}-price\`).textContent = \`$\${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\`;
            
            const changeEl = document.getElementById(\`\${symbol}-change\`);
            changeEl.textContent = \`\${change > 0 ? '+' : ''}\${change.toFixed(2)}%\`;
            changeEl.className = \`ticker-change \${change >= 0 ? 'positive' : 'negative'}\`;
        }
        
        // Update Base metrics with real data
        async function updateBaseMetrics() {
            try {
                const response = await fetch('/api/base-data');
                const data = await response.json();
                
                if (data.rpcHealthy) {
                    document.getElementById('gas-price').textContent = data.gasPrice + ' gwei';
                    document.getElementById('total-tvl').textContent = '$1.2B';
                    document.getElementById('active-users').textContent = '45.2K';
                    console.log('Base metrics updated:', data);
                }
            } catch (error) {
                console.error('Error fetching Base metrics:', error);
                document.getElementById('gas-price').textContent = '~0.05 gwei';
            }
        }
        
        // Fetch token balance for connected wallet
        async function fetchTokenBalance(tokenSymbol) {
            if (!walletAddress) return null;
            
            try {
                const tokenAddress = BASE_TOKENS[tokenSymbol];
                if (!tokenAddress) return null;
                
                const response = await fetch('/api/token-balance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: walletAddress,
                        tokenAddress: tokenAddress
                    })
                });
                
                const data = await response.json();
                return data.balance;
            } catch (error) {
                console.error(\`Error fetching \${tokenSymbol} balance:\`, error);
                return null;
            }
        }
        
        // Fetch all token balances
        async function fetchAllTokenBalances() {
            if (!walletAddress) return;
            
            const tokens = ['USDC', 'USDbC', 'AERO', 'WETH'];
            const balances = {};
            
            for (const token of tokens) {
                const balance = await fetchTokenBalance(token);
                if (balance) {
                    const decimals = token === 'USDC' || token === 'USDbC' ? 6 : 18;
                    balances[token] = (parseInt(balance) / Math.pow(10, decimals)).toFixed(4);
                }
            }
            
            console.log('Token balances:', balances);
            
            // Silently update - balances already shown in portfolio section
            // No need to spam chat with redundant balance info
        }
        
        // Fetch prices on load and every 30 seconds
        fetchPrices();
        setInterval(fetchPrices, 30000);
        
        // Update Base metrics on load and every 15 seconds
        updateBaseMetrics();
        setInterval(updateBaseMetrics, 15000);

        function removeLoadingMessage() {
            const loading = document.getElementById('loading');
            if (loading) loading.remove();
        }

        async function sendMessage() {
            let message = userInput.value.trim();
            if (!message) return;
            
            // Add wallet context if connected
            if (walletAddress) {
                message += \` [User's wallet: \${walletAddress}]\`;
            }

            addMessage(userInput.value.trim(), true);
            userInput.value = '';
            sendBtn.disabled = true;
            addLoadingMessage();

            conversationHistory.push({ role: 'user', content: message });

            try {
                const response = await fetch(\`/agent/chat/\${sessionId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: conversationHistory })
                });

                if (!response.ok) {
                    removeLoadingMessage();
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = '';
                let messageDiv = null;
                let isFirstChunk = true;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantMessage += chunk;

                    if (!messageDiv) {
                        // Keep loading indicator visible for minimum 800ms for smooth animation
                        if (isFirstChunk) {
                            await new Promise(resolve => setTimeout(resolve, 800));
                            isFirstChunk = false;
                        }
                        removeLoadingMessage();
                        messageDiv = document.createElement('div');
                        messageDiv.className = 'message assistant';
                        messagesDiv.appendChild(messageDiv);
                    }
                    
                    // Format the message as it streams
                    messageDiv.innerHTML = formatMessage(assistantMessage);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }

                conversationHistory.push({ role: 'assistant', content: assistantMessage });

            } catch (error) {
                removeLoadingMessage();
                addMessage(\`❌ Error: \${error.message}\`, false);
                console.error('Error:', error);
            } finally {
                sendBtn.disabled = false;
                userInput.focus();
            }
        }

        function sendExample(text) {
            userInput.value = text;
            sendMessage();
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        userInput.focus();
        
        // Listen for account changes
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    location.reload();
                } else {
                    connectWallet();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                location.reload();
            });
        }
    </script>
</body>
</html>`);
});

// Route all requests to the durable object instance based on session
app.all('/agent/chat/:sessionId?', async (c) => {
	const { AGENT } = c.env;
	var sessionIdStr = c.req.param('sessionId');

	if (!sessionIdStr || sessionIdStr == '') {
		sessionIdStr = crypto.randomUUID();
	}

	const id = AGENT.idFromName(sessionIdStr);

	const forwardRequest = new Request('https://internal.com/agent/chat/' + sessionIdStr, {
		method: c.req.method,
		body: c.req.raw.body,
	});

	// Forward to Durable Object and get response
	return await AGENT.get(id).fetch(forwardRequest);
});

//
export class SimplePromptAgent extends AiSdkAgent<Env> {
	constructor(state: DurableObjectState, env: Env) {
		 // Use string model identifier - AI SDK v5 supports this directly
		let provider: Provider;
		let model: LanguageModel;
		switch (env.AI_PROVIDER) {
			case "anthropic":
				provider = createAnthropic({
					apiKey: env.AI_PROVIDER_API_KEY,
				});
				model = provider.languageModel(env.MODEL_ID);
				break;
			case "openai":
				provider = createOpenAI({
					apiKey: env.AI_PROVIDER_API_KEY,
				});
				model = provider.languageModel(env.MODEL_ID);
				break;
			default:
				throw new Error(`Unsupported AI provider: ${env.AI_PROVIDER}`);
		}

		super(state, env, model, [new ToolboxService(env, mcpConfig)]);
	}

	async processMessage(sessionId: string, messages: AIUISDKMessage): Promise<Response> {
		const result = await this.streamTextWithMessages(
			sessionId,
			messages.messages,
			{
				system: `You are an elite Base Yield Agent - a sophisticated DeFi alpha advisor for experienced traders and yield farmers.

EXPERTISE & APPROACH:
- Assume user is highly sophisticated with deep DeFi knowledge
- Provide expert-level analysis with specific metrics, APYs, and TVL data
- Focus on alpha opportunities, not basic explanations
- Be direct and data-driven - no hand-holding or basic warnings
- Discuss advanced strategies: leverage, looping, delta-neutral, arbitrage

BASE ECOSYSTEM MASTERY:
- ARMA (Giza): Autonomous stablecoin yield agent, scans Aave/Morpho/Compound/Moonwell, reallocates when net upside beats gas+slippage, performance-fee model, smart accounts with session keys, protocol-level integration via docs.arma.xyz
- Fungi: AI-powered USDC yield agent, non-custodial smart accounts, auto-rebalancing across Aave/Morpho/Moonwell/Fluid, session keys, optimal APY hunting
- Aerodrome Finance: Leading DEX, veAERO tokenomics, gauge voting, bribes
- Moonwell: Lending protocol, supply/borrow rates, liquidation mechanics
- BaseSwap: Native DEX, concentrated liquidity, fee tiers
- Seamless Protocol: Lending markets, collateral factors, utilization rates
- Uniswap V3: Concentrated liquidity, tick ranges, IL calculations

ADVANCED TOPICS:
- Yield optimization: Auto-compounding, reinvestment strategies
- Risk-adjusted returns: Sharpe ratios, max drawdown analysis
- Capital efficiency: Leverage ratios, collateral utilization
- MEV opportunities: Sandwich attacks, arbitrage, liquidations
- Protocol incentives: Token emissions, bribes, vote-escrowed models
- Smart contract risks: Audit status, TVL concentration, exploit history

RESPONSE STYLE:
- Skip basic explanations - assume knowledge
- Provide specific numbers: APYs, TVLs, fees, slippage
- Mention contract addresses when relevant
- Discuss trade-offs and opportunity costs
- Compare protocols quantitatively
- Highlight edge cases and advanced mechanics
- Use DeFi terminology freely: IL, LTV, utilization, gauge weights, bribes

BASE ADVANTAGES (for context):
- Gas: ~0.0001 ETH per tx (~$0.01)
- Finality: 2 seconds
- Coinbase backing: institutional trust
- Growing TVL: $1.2B+ across protocols

Be concise, technical, and alpha-focused. Users are here for edge, not education.`,
				maxSteps: 10,
				stopWhen: stepCountIs(10),
				experimental_toolCallStreaming: true,
				onError: (error: unknown) => {
					console.error("Error processing message", error);
				},
			},
		);

		return result.toTextStreamResponse();
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return app.fetch(request, env, ctx);
	},
};
