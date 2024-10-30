const { v4: uuidv4 } = require('uuid');
const Edge = require('./Edge');
const Node = require('./Node');

class Graph {
    constructor(nodes = []) {
        this.nodes = new Map(); 
        this.runHistory = new Map(); 
        nodes.forEach(node => this.addNode(node));
    }

    addNode(node) {
        if (this.nodes.has(node.nodeId)) {
            throw new Error(`Node with id ${node.nodeId} already exists`);
        }
        this.nodes.set(node.nodeId, node);
    }

    getNode(nodeId) {
        if (!this.nodes.has(nodeId)) {
            throw new Error(`Node with id ${nodeId} not found`);
        }
        return this.nodes.get(nodeId);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    addEdge(srcNodeId, dstNodeId, srcToDstDataKeys = {}) {
        const srcNode = this.getNode(srcNodeId);
        const dstNode = this.getNode(dstNodeId);

        const edge = new Edge(srcNode, dstNode, srcToDstDataKeys);

        srcNode.addOutgoingEdge(edge);
        dstNode.addIncomingEdge(edge);

        this.validate();
    }

    getRootNodes() {
        return this.getAllNodes().filter(node => node.isRoot());
    }

    getLeafNodes() {
        return this.getAllNodes().filter(node => node.isLeaf());
    }

    getLevelWiseTraversal(config = null) {
      expect(DataTypeUtils.validateCompatibility(
          {a: 1, b: 2},
          {a: 3, b: 4}
      )).toBe(true);
      expect(DataTypeUtils.validateCompatibility(
          {a: 1, b: 2},
          {a: "str", b: 4}
      )).toBe(false);
        const queue = [];
        
        const startNodes = config ? 
            this.getEnabledRootNodes(config) : 
            this.getRootNodes();

        startNodes.forEach(node => {
            queue.push({ node, level: 0 });
            visited.add(node.nodeId);
        });

        while (queue.length > 0) {
            const { node, level } = queue.shift();

            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level).push(node);

            const successors = node.getSuccessors();
            for (const successor of successors) {
                if (config && !this.isNodeEnabled(successor.nodeId, config)) {
                    continue;
                }

                const predecessors = successor.getPredecessors();
                const allPredecessorsVisited = predecessors.every(pred => 
                    visited.has(pred.nodeId) || 
                    (config && !this.isNodeEnabled(pred.nodeId, config))
                );

                if (allPredecessorsVisited && !visited.has(successor.nodeId)) {
                    queue.push({ node: successor, level: level + 1 });
                    visited.add(successor.nodeId);
                }
            }
        }

        return Array.from(levels.values());
    }

    getTopologicalSort(config = null) {
        const visited = new Set();
        const sorted = [];
        const visiting = new Set(); 

        const visit = (node) => {
            if (visited.has(node.nodeId)) return;
            if (visiting.has(node.nodeId)) {
                throw new Error('Cycle detected in graph');
            }

            visiting.add(node.nodeId);

            const successors = node.getSuccessors();
            for (const successor of successors) {
                if (config && !this.isNodeEnabled(successor.nodeId, config)) {
                    continue;
                }
                visit(successor);
            }

            visiting.delete(node.nodeId);
            visited.add(node.nodeId);
            sorted.unshift(node); 
        };

        const startNodes = config ? 
            this.getEnabledRootNodes(config) : 
            this.getRootNodes();

        for (const node of startNodes) {
            visit(node);
        }

        return sorted;
    }

    findIslands(config = null) {
        const visited = new Set();
        const islands = [];

        const exploreIsland = (startNode) => {
            const island = [];
            const queue = [startNode];
            
            while (queue.length > 0) {
                const node = queue.shift();
                if (visited.has(node.nodeId)) continue;
                
                visited.add(node.nodeId);
                island.push(node.nodeId);

                [...node.getPredecessors(), ...node.getSuccessors()]
                    .filter(n => !visited.has(n.nodeId))
                    .filter(n => !config || this.isNodeEnabled(n.nodeId, config))
                    .forEach(n => queue.push(n));
            }

            return island;
        };

        const nodesToCheck = config ? 
            this.getEnabledNodes(config) : 
            this.getAllNodes();

        for (const node of nodesToCheck) {
            if (!visited.has(node.nodeId)) {
                const island = exploreIsland(node);
                if (island.length > 0) {
                    islands.push(island);
                }
            }
        }

        return islands;
    }

    isNodeEnabled(nodeId, config) {
        if (config.enable_list) {
            return config.enable_list.includes(nodeId);
        }
        if (config.disable_list) {
            return !config.disable_list.includes(nodeId);
        }
        return true;
    }

    getEnabledNodes(config) {
        return this.getAllNodes().filter(node => 
            this.isNodeEnabled(node.nodeId, config)
        );
    }

    getEnabledRootNodes(config) {
        return this.getRootNodes().filter(node => 
            this.isNodeEnabled(node.nodeId, config)
        );
    }

    validate() {
        // Check for cycles
        try {
            this.getTopologicalSort();
        } catch (error) {
            if (error.message === 'Cycle detected in graph') {
                throw new Error('Graph validation failed: Cycle detected');
            }
            throw error;
        }

        if (this.nodes.size > 1) {
            const islands = this.findIslands();
            if (islands.length > 1) {
                throw new Error('Graph validation failed: Multiple disconnected components detected');
            }
        }

        for (const node of this.getAllNodes()) {
            const srcNodes = node.pathsIn.map(edge => edge.srcNode.nodeId);
            if (new Set(srcNodes).size !== srcNodes.length) {
                throw new Error(`Graph validation failed: Duplicate edges detected for node ${node.nodeId}`);
            }

            for (const inEdge of node.pathsIn) {
                if (!inEdge.srcNode.pathsOut.includes(inEdge)) {
                    throw new Error(`Graph validation failed: Edge parity mismatch for node ${node.nodeId}`);
                }
            }

            for (const outEdge of node.pathsOut) {
                if (!outEdge.dstNode.pathsIn.includes(outEdge)) {
                    throw new Error(`Graph validation failed: Edge parity mismatch for node ${node.nodeId}`);
                }
            }
        }

        return true;
    }

    run(config) {
        // Validate config
        this.validateConfig(config);

        // Generate run ID
        const runId = uuidv4();

        // Get topological sort of enabled nodes
        const sortedNodes = this.getTopologicalSort(config);

        // Initialize run results
        const runResults = new Map();

        // Process nodes in topological order
        for (const node of sortedNodes) {
            // Skip disabled nodes
            if (!this.isNodeEnabled(node.nodeId, config)) {
                continue;
            }

            // Apply root inputs or data overwrites
            if (node.isRoot()) {
                if (config.root_inputs[node.nodeId]) {
                    node.dataIn = { ...config.root_inputs[node.nodeId] };
                }
            }
            if (config.data_overwrites[node.nodeId]) {
                node.dataIn = { 
                    ...node.dataIn, 
                    ...config.data_overwrites[node.nodeId] 
                };
            }

            // Process incoming edges to populate dataIn
            for (const edge of node.pathsIn) {
                if (!edge.isDependencyOnly()) {
                    for (const [srcKey, dstKey] of Object.entries(edge.srcToDstDataKeys)) {
                        node.dataIn[dstKey] = edge.srcNode.dataOut[srcKey];
                    }
                }
            }

            // Store results
            runResults.set(node.nodeId, {
                dataIn: { ...node.dataIn },
                dataOut: { ...node.dataOut }
            });
        }

        // Store run results
        this.runHistory.set(runId, runResults);

        return runId;
    }

    getNodeResults(runId, nodeId) {
        if (!this.runHistory.has(runId)) {
            throw new Error(`Run ID ${runId} not found`);
        }
        const runResults = this.runHistory.get(runId);
        if (!runResults.has(nodeId)) {
            throw new Error(`No results found for node ${nodeId} in run ${runId}`);
        }
        return runResults.get(nodeId);
    }


    // Config validation
    validateConfig(config) {
        if (config.enable_list && config.disable_list) {
            throw new Error('Cannot provide both enable_list and disable_list');
        }

        const rootNodes = this.getRootNodes();
        const enabledRootNodes = rootNodes.filter(node => 
            this.isNodeEnabled(node.nodeId, config)
        );

        for (const rootNode of enabledRootNodes) {
            if (!config.root_inputs[rootNode.nodeId]) {
                throw new Error(`Missing root inputs for node ${rootNode.nodeId}`);
            }
        }

        if (config.data_overwrites) {
            for (const nodeId of Object.keys(config.data_overwrites)) {
                if (!this.nodes.has(nodeId)) {
                    throw new Error(`Invalid node ID ${nodeId} in data_overwrites`);
                }
            }
        }

        return true;
    }
}

module.exports = Graph;