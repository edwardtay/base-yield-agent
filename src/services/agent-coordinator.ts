/**
 * Agent Coordinator Service
 * Enables Agent-to-Agent (A2A) communication and coordination
 */

import { Service } from '@nullshot/agent';

export interface AgentCapability {
	id: string;
	name: string;
	description: string;
	chains: string[];
	protocols: string[];
	operations: string[];
}

export interface RegisteredAgent {
	id: string;
	name: string;
	endpoint: string;
	capabilities: AgentCapability[];
	registeredAt: Date;
	lastSeen: Date;
	reputation: number;
}

export interface AgentMessage {
	from: string;
	to: string;
	type: 'request' | 'response' | 'event' | 'delegation';
	payload: any;
	timestamp: number;
	signature?: string;
}

export interface TaskDelegation {
	taskId: string;
	fromAgent: string;
	toAgent: string;
	task: {
		type: string;
		description: string;
		parameters: any;
	};
	status: 'pending' | 'in-progress' | 'completed' | 'failed';
	result?: any;
	error?: string;
}

/**
 * Agent Coordinator Service
 * Manages agent registry, discovery, and inter-agent communication
 */
export class AgentCoordinatorService implements Service {
	name = '@nullshot/agent-coordinator';
	private agents: Map<string, RegisteredAgent> = new Map();
	private messages: Map<string, AgentMessage[]> = new Map();
	private delegations: Map<string, TaskDelegation> = new Map();

	async initialize(): Promise<void> {
		console.log('Initializing Agent Coordinator Service');
		// In production, load from D1 or KV
	}

	/**
	 * Register an agent in the network
	 */
	async registerAgent(agent: Omit<RegisteredAgent, 'registeredAt' | 'lastSeen' | 'reputation'>): Promise<RegisteredAgent> {
		const registeredAgent: RegisteredAgent = {
			...agent,
			registeredAt: new Date(),
			lastSeen: new Date(),
			reputation: 100, // Start with neutral reputation
		};

		this.agents.set(agent.id, registeredAgent);
		console.log(`Agent registered: ${agent.name} (${agent.id})`);

		return registeredAgent;
	}

	/**
	 * Discover agents by capability
	 */
	async discoverAgents(capability: string): Promise<RegisteredAgent[]> {
		const matchingAgents: RegisteredAgent[] = [];

		for (const agent of this.agents.values()) {
			// Check if agent has the required capability
			const hasCapability = agent.capabilities.some(
				(cap) =>
					cap.operations.includes(capability) ||
					cap.protocols.includes(capability) ||
					cap.chains.includes(capability)
			);

			if (hasCapability) {
				matchingAgents.push(agent);
			}
		}

		// Sort by reputation
		return matchingAgents.sort((a, b) => b.reputation - a.reputation);
	}

	/**
	 * Send message to another agent
	 */
	async sendMessage(message: Omit<AgentMessage, 'timestamp'>): Promise<void> {
		const fullMessage: AgentMessage = {
			...message,
			timestamp: Date.now(),
		};

		// Store message in recipient's queue
		const recipientMessages = this.messages.get(message.to) || [];
		recipientMessages.push(fullMessage);
		this.messages.set(message.to, recipientMessages);

		console.log(`Message sent from ${message.from} to ${message.to}`);

		// In production, use Durable Objects or Queue for reliable delivery
	}

	/**
	 * Receive messages for an agent
	 */
	async receiveMessages(agentId: string): Promise<AgentMessage[]> {
		const messages = this.messages.get(agentId) || [];
		this.messages.delete(agentId); // Clear after reading
		return messages;
	}

	/**
	 * Delegate task to another agent
	 */
	async delegateTask(delegation: Omit<TaskDelegation, 'taskId' | 'status'>): Promise<TaskDelegation> {
		const taskId = crypto.randomUUID();
		const fullDelegation: TaskDelegation = {
			...delegation,
			taskId,
			status: 'pending',
		};

		this.delegations.set(taskId, fullDelegation);

		// Send delegation message to target agent
		await this.sendMessage({
			from: delegation.fromAgent,
			to: delegation.toAgent,
			type: 'delegation',
			payload: {
				taskId,
				task: delegation.task,
			},
		});

		console.log(`Task delegated: ${taskId} from ${delegation.fromAgent} to ${delegation.toAgent}`);

		return fullDelegation;
	}

	/**
	 * Update task delegation status
	 */
	async updateDelegation(taskId: string, status: TaskDelegation['status'], result?: any, error?: string): Promise<void> {
		const delegation = this.delegations.get(taskId);
		if (!delegation) {
			throw new Error(`Delegation not found: ${taskId}`);
		}

		delegation.status = status;
		if (result) delegation.result = result;
		if (error) delegation.error = error;

		this.delegations.set(taskId, delegation);

		// Notify originating agent
		await this.sendMessage({
			from: delegation.toAgent,
			to: delegation.fromAgent,
			type: 'response',
			payload: {
				taskId,
				status,
				result,
				error,
			},
		});
	}

	/**
	 * Get delegation status
	 */
	async getDelegation(taskId: string): Promise<TaskDelegation | undefined> {
		return this.delegations.get(taskId);
	}

	/**
	 * Get all registered agents
	 */
	async listAgents(): Promise<RegisteredAgent[]> {
		return Array.from(this.agents.values());
	}

	/**
	 * Update agent reputation based on performance
	 */
	async updateReputation(agentId: string, delta: number): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`);
		}

		agent.reputation = Math.max(0, Math.min(200, agent.reputation + delta));
		agent.lastSeen = new Date();
		this.agents.set(agentId, agent);
	}

	/**
	 * Compose multi-agent workflow
	 */
	async composeWorkflow(workflow: {
		name: string;
		steps: Array<{
			agentCapability: string;
			task: any;
		}>;
	}): Promise<any[]> {
		const results: any[] = [];

		for (const step of workflow.steps) {
			// Find best agent for this step
			const agents = await this.discoverAgents(step.agentCapability);
			if (agents.length === 0) {
				throw new Error(`No agent found with capability: ${step.agentCapability}`);
			}

			const bestAgent = agents[0];

			// Delegate task
			const delegation = await this.delegateTask({
				fromAgent: 'coordinator',
				toAgent: bestAgent.id,
				task: {
					type: step.agentCapability,
					description: `Workflow step: ${workflow.name}`,
					parameters: step.task,
				},
			});

			// Wait for completion (in production, use async/await with timeout)
			// For now, simulate immediate completion
			results.push({
				step: step.agentCapability,
				agent: bestAgent.name,
				result: delegation,
			});
		}

		return results;
	}
}
