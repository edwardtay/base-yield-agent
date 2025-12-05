/**
 * Enhanced Blockchain Tools for Agent Composability
 * Provides comprehensive Web3 interaction capabilities
 */

import { z } from 'zod';
import { createPublicClient, http, parseAbi, encodeFunctionData, Address } from 'viem';
import { base, mainnet, arbitrum, optimism, polygon } from 'viem/chains';

// Chain configuration
const CHAINS = {
	base,
	mainnet,
	arbitrum,
	optimism,
	polygon,
};

const RPC_URLS = {
	base: 'https://mainnet.base.org',
	mainnet: 'https://eth.llamarpc.com',
	arbitrum: 'https://arb1.arbitrum.io/rpc',
	optimism: 'https://mainnet.optimism.io',
	polygon: 'https://polygon-rpc.com',
};

/**
 * Get public client for a chain
 */
function getPublicClient(chainName: keyof typeof CHAINS) {
	const chain = CHAINS[chainName];
	return createPublicClient({
		chain,
		transport: http(RPC_URLS[chainName]),
	});
}

/**
 * Call Smart Contract (Read)
 */
export async function callContract(params: {
	chain: keyof typeof CHAINS;
	contractAddress: string;
	functionName: string;
	abi: any[];
	args?: any[];
}) {
	try {
		const { chain, contractAddress, functionName, abi, args = [] } = params;
		const client = getPublicClient(chain);

		const result = await client.readContract({
			address: contractAddress as Address,
			abi,
			functionName,
			args,
		});

		return {
			success: true,
			chain,
			contract: contractAddress,
			function: functionName,
			result,
		};
	} catch (error: any) {
		return {
			success: false,
			error: error.message,
			chain: params.chain,
			contract: params.contractAddress,
		};
	}
}

/**
 * Tool: Simulate Transaction
 */
export const simulateTransactionTool = tool({
	description: 'Simulate a transaction before execution to check if it will succeed',
	parameters: z.object({
		chain: z.enum(['base', 'mainnet', 'arbitrum', 'optimism', 'polygon']).describe('Blockchain network'),
		from: z.string().describe('Sender address'),
		to: z.string().describe('Recipient/contract address'),
		data: z.string().optional().describe('Transaction data (for contract calls)'),
		value: z.string().optional().describe('ETH value to send (in wei)'),
	}),
	execute: async ({ chain, from, to, data, value }: {
		chain: keyof typeof CHAINS;
		from: string;
		to: string;
		data?: string;
		value?: string;
	}) => {
		try {
			const client = getPublicClient(chain);

			// Simulate the transaction
			const result = await client.call({
				account: from as Address,
				to: to as Address,
				data: data as `0x${string}`,
				value: value ? BigInt(value) : undefined,
			});

			// Estimate gas
			const gasEstimate = await client.estimateGas({
				account: from as Address,
				to: to as Address,
				data: data as `0x${string}`,
				value: value ? BigInt(value) : undefined,
			});

			return {
				success: true,
				chain,
				simulation: {
					willSucceed: true,
					result: result.data,
					estimatedGas: gasEstimate.toString(),
				},
			};
		} catch (error: any) {
			return {
				success: false,
				chain,
				simulation: {
					willSucceed: false,
					error: error.message,
				},
			};
		}
	},
});

/**
 * Tool: Build Transaction Data
 */
export const buildTransactionTool = tool({
	description: 'Build transaction data for user to sign and execute',
	parameters: z.object({
		chain: z.enum(['base', 'mainnet', 'arbitrum', 'optimism', 'polygon']).describe('Blockchain network'),
		contractAddress: z.string().describe('Smart contract address'),
		functionName: z.string().describe('Function name to call'),
		abi: z.array(z.any()).describe('Contract ABI'),
		args: z.array(z.any()).optional().describe('Function arguments'),
		value: z.string().optional().describe('ETH value to send (in wei)'),
	}),
	execute: async ({ chain, contractAddress, functionName, abi, args = [], value }: {
		chain: keyof typeof CHAINS;
		contractAddress: string;
		functionName: string;
		abi: any[];
		args?: any[];
		value?: string;
	}) => {
		try {
			// Encode function data
			const data = encodeFunctionData({
				abi,
				functionName,
				args,
			});

			return {
				success: true,
				chain,
				transaction: {
					to: contractAddress,
					data,
					value: value || '0',
					chainId: CHAINS[chain].id,
				},
				instructions: 'User should sign and broadcast this transaction using their wallet',
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
			};
		}
	},
});

/**
 * Tool: Get DeFi Protocol Data (Aave)
 */
export const getAaveDataTool = tool({
	description: 'Get lending/borrowing data from Aave protocol',
	parameters: z.object({
		chain: z.enum(['base', 'mainnet', 'arbitrum', 'optimism', 'polygon']).describe('Blockchain network'),
		asset: z.string().describe('Asset address (e.g., USDC, WETH)'),
	}),
	execute: async ({ chain, asset }: {
		chain: keyof typeof CHAINS;
		asset: string;
	}) => {
		try {
			const client = getPublicClient(chain);

			// Aave V3 Pool address (example for Base)
			const AAVE_POOL_ADDRESSES: Record<string, Address> = {
				base: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
				mainnet: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
				arbitrum: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
				optimism: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
				polygon: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
			};

			const poolAddress = AAVE_POOL_ADDRESSES[chain];

			// Get reserve data
			const reserveData = await client.readContract({
				address: poolAddress,
				abi: parseAbi([
					'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
				]),
				functionName: 'getReserveData',
				args: [asset as Address],
			}) as any[];

			// Calculate APY from rates (Aave uses ray units: 1e27)
			const supplyAPY = (Number(reserveData[2]) / 1e27) * 100;
			const borrowAPY = (Number(reserveData[4]) / 1e27) * 100;

			return {
				success: true,
				chain,
				protocol: 'Aave V3',
				asset,
				data: {
					supplyAPY: supplyAPY.toFixed(2) + '%',
					borrowAPY: borrowAPY.toFixed(2) + '%',
					aTokenAddress: reserveData[8],
					lastUpdate: new Date(Number(reserveData[6]) * 1000).toISOString(),
				},
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
				chain,
				protocol: 'Aave V3',
			};
		}
	},
});

/**
 * Tool: Get Uniswap V3 Pool Data
 */
export const getUniswapPoolTool = tool({
	description: 'Get liquidity pool data from Uniswap V3',
	parameters: z.object({
		chain: z.enum(['base', 'mainnet', 'arbitrum', 'optimism', 'polygon']).describe('Blockchain network'),
		poolAddress: z.string().describe('Uniswap V3 pool address'),
	}),
	execute: async ({ chain, poolAddress }: {
		chain: keyof typeof CHAINS;
		poolAddress: string;
	}) => {
		try {
			const client = getPublicClient(chain);

			// Get pool data
			const [token0, token1, fee, liquidity, slot0] = await Promise.all([
				client.readContract({
					address: poolAddress as Address,
					abi: parseAbi(['function token0() view returns (address)']),
					functionName: 'token0',
				}),
				client.readContract({
					address: poolAddress as Address,
					abi: parseAbi(['function token1() view returns (address)']),
					functionName: 'token1',
				}),
				client.readContract({
					address: poolAddress as Address,
					abi: parseAbi(['function fee() view returns (uint24)']),
					functionName: 'fee',
				}),
				client.readContract({
					address: poolAddress as Address,
					abi: parseAbi(['function liquidity() view returns (uint128)']),
					functionName: 'liquidity',
				}),
				client.readContract({
					address: poolAddress as Address,
					abi: parseAbi([
						'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
					]),
					functionName: 'slot0',
				}),
			]);

			return {
				success: true,
				chain,
				protocol: 'Uniswap V3',
				pool: poolAddress,
				data: {
					token0,
					token1,
					fee: Number(fee) / 10000 + '%',
					liquidity: liquidity.toString(),
					currentTick: slot0[1],
					sqrtPriceX96: slot0[0].toString(),
				},
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
				chain,
				protocol: 'Uniswap V3',
			};
		}
	},
});

/**
 * Tool: Get Multi-Chain Token Balance
 */
export const getMultiChainBalanceTool = tool({
	description: 'Get token balance across multiple chains',
	parameters: z.object({
		address: z.string().describe('Wallet address'),
		tokenAddress: z.string().describe('Token contract address'),
		chains: z.array(z.enum(['base', 'mainnet', 'arbitrum', 'optimism', 'polygon'])).describe('Chains to check'),
	}),
	execute: async ({ address, tokenAddress, chains }: {
		address: string;
		tokenAddress: string;
		chains: Array<keyof typeof CHAINS>;
	}) => {
		try {
			const balances: Record<string, string> = {};

			// Check balance on each chain
			await Promise.all(
				chains.map(async (chain: keyof typeof CHAINS) => {
					try {
						const client = getPublicClient(chain);

						const balance = await client.readContract({
							address: tokenAddress as Address,
							abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
							functionName: 'balanceOf',
							args: [address as Address],
						});

						balances[chain] = balance.toString();
					} catch (error) {
						balances[chain] = 'Error: ' + (error as Error).message;
					}
				})
			);

			return {
				success: true,
				address,
				token: tokenAddress,
				balances,
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
			};
		}
	},
});

/**
 * Export all blockchain tools
 */
export const blockchainTools = {
	callContract: callContractTool,
	simulateTransaction: simulateTransactionTool,
	buildTransaction: buildTransactionTool,
	getAaveData: getAaveDataTool,
	getUniswapPool: getUniswapPoolTool,
	getMultiChainBalance: getMultiChainBalanceTool,
};
