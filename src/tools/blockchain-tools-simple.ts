/**
 * Enhanced Blockchain Tools for Agent Composability
 * Simplified version with plain functions
 */

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

type ChainName = keyof typeof CHAINS;

/**
 * Get public client for a chain
 */
function getPublicClient(chainName: ChainName) {
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
	chain: ChainName;
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
 * Simulate Transaction
 */
export async function simulateTransaction(params: {
	chain: ChainName;
	from: string;
	to: string;
	data?: string;
	value?: string;
}) {
	try {
		const { chain, from, to, data, value } = params;
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
			chain: params.chain,
			simulation: {
				willSucceed: false,
				error: error.message,
			},
		};
	}
}

/**
 * Build Transaction Data
 */
export async function buildTransaction(params: {
	chain: ChainName;
	contractAddress: string;
	functionName: string;
	abi: any[];
	args?: any[];
	value?: string;
}) {
	try {
		const { chain, contractAddress, functionName, abi, args = [], value } = params;

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
}

/**
 * Get DeFi Protocol Data (Aave)
 */
export async function getAaveData(params: { chain: ChainName; asset: string }) {
	try {
		const { chain, asset } = params;
		const client = getPublicClient(chain);

		// Aave V3 Pool address
		const AAVE_POOL_ADDRESSES: Record<ChainName, Address> = {
			base: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
			mainnet: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
			arbitrum: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
			optimism: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
			polygon: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
		};

		const poolAddress = AAVE_POOL_ADDRESSES[chain];

		// Get reserve data
		const reserveData = (await client.readContract({
			address: poolAddress,
			abi: parseAbi([
				'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
			]),
			functionName: 'getReserveData',
			args: [asset as Address],
		})) as any[];

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
			chain: params.chain,
			protocol: 'Aave V3',
		};
	}
}

/**
 * Get Uniswap V3 Pool Data
 */
export async function getUniswapPool(params: { chain: ChainName; poolAddress: string }) {
	try {
		const { chain, poolAddress } = params;
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
				currentTick: (slot0 as any)[1],
				sqrtPriceX96: (slot0 as any)[0].toString(),
			},
		};
	} catch (error: any) {
		return {
			success: false,
			error: error.message,
			chain: params.chain,
			protocol: 'Uniswap V3',
		};
	}
}

/**
 * Get Multi-Chain Token Balance
 */
export async function getMultiChainBalance(params: {
	address: string;
	tokenAddress: string;
	chains: ChainName[];
}) {
	try {
		const { address, tokenAddress, chains } = params;
		const balances: Record<string, string> = {};

		// Check balance on each chain
		await Promise.all(
			chains.map(async (chain: ChainName) => {
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
}

/**
 * Export all blockchain tools
 */
export const blockchainTools = {
	callContract,
	simulateTransaction,
	buildTransaction,
	getAaveData,
	getUniswapPool,
	getMultiChainBalance,
};
