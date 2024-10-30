// tests/simple/basic.test.js

const { DataTypeUtils, DATA_TYPES } = require('../src/utils/dataTypeUtils');
const Edge = require('../src/models/Edge');
const Node = require('../src/models/Node');
const Graph = require('../src/models/Graph');
const GraphRunConfig = require('../src/models/GraphRunConfig');

describe('DataType Validation Tests', () => {
    test('Basic type detection', () => {
        expect(DataTypeUtils.getType(42)).toBe(DATA_TYPES.INT);
        expect(DataTypeUtils.getType(3.14)).toBe(DATA_TYPES.FLOAT);
        expect(DataTypeUtils.getType("hello")).toBe(DATA_TYPES.STRING);
        expect(DataTypeUtils.getType(true)).toBe(DATA_TYPES.BOOLEAN);
        expect(DataTypeUtils.getType([])).toBe(DATA_TYPES.LIST);
        expect(DataTypeUtils.getType({})).toBe(DATA_TYPES.DICT);
    });

    test('Type compatibility', () => {
        // Basic compatibility
        expect(DataTypeUtils.validateCompatibility(42, 43)).toBe(true);
        expect(DataTypeUtils.validateCompatibility(3.14, 2.718)).toBe(true);
        expect(DataTypeUtils.validateCompatibility("hello", "world")).toBe(true);
        
        // Int-Float compatibility
        expect(DataTypeUtils.validateCompatibility(42, 3.14)).toBe(true);
        expect(DataTypeUtils.validateCompatibility(3.14, 42)).toBe(true);
        
        // List compatibility
        expect(DataTypeUtils.validateCompatibility([1,2,3], [4,5,6])).toBe(true);
        expect(DataTypeUtils.validateCompatibility([1,2,3], ["a","b","c"])).toBe(false);
        
    });
});

describe('Graph Component Tests', () => {
    test('Node Creation and Edge Management', () => {
        const node1 = new Node('node1', {input: 42}, {output: 84});
        const node2 = new Node('node2', {input: 0}, {output: 0});
        
        expect(node1.nodeId).toBe('node1');
        expect(node1.dataIn.input).toBe(42);
        expect(node1.isRoot()).toBe(true);
        expect(node1.isLeaf()).toBe(true);

        const edge = new Edge(node1, node2, {output: 'input'});
        node1.addOutgoingEdge(edge);
        node2.addIncomingEdge(edge);

        expect(node1.isLeaf()).toBe(false);
        expect(node2.isRoot()).toBe(false);
    });

    test('Graph Creation and Validation', () => {
        const graph = new Graph();
        
        // Create nodes
        const node1 = new Node('node1', {input: 42}, {output: 84});
        const node2 = new Node('node2', {input: 0}, {output: 0});
        const node3 = new Node('node3', {input: 0}, {output: 0});

        // Add nodes to graph
        graph.addNode(node1);
        graph.addNode(node2);
        graph.addNode(node3);

        // Create edges
        graph.addEdge('node1', 'node2', {output: 'input'});
        graph.addEdge('node2', 'node3', {output: 'input'});

        // Test graph properties
        expect(graph.getRootNodes().length).toBe(1);
        expect(graph.getLeafNodes().length).toBe(1);
        expect(graph.getRootNodes()[0].nodeId).toBe('node1');
        expect(graph.getLeafNodes()[0].nodeId).toBe('node3');
    });

    test('Graph Cycle Detection', () => {
        const graph = new Graph();
        
        const node1 = new Node('node1');
        const node2 = new Node('node2');
        const node3 = new Node('node3');
        
        graph.addNode(node1);
        graph.addNode(node2);
        graph.addNode(node3);
        
        graph.addEdge('node1', 'node2');
        graph.addEdge('node2', 'node3');
        
        // This should throw an error due to cycle creation
        expect(() => {
            graph.addEdge('node3', 'node1');
        }).toThrow();
    });

    test('Graph Run Configuration', () => {
        const config = new GraphRunConfig({
            root_inputs: {
                'node1': { input: 42 }
            },
            data_overwrites: {
                'node2': { extra: 10 }
            },
            enable_list: ['node1', 'node2', 'node3']
        });

        expect(config.isNodeEnabled('node1')).toBe(true);
        expect(config.isNodeEnabled('node4')).toBe(false);
        
        // Test invalid config
        expect(() => {
            new GraphRunConfig({
                enable_list: ['node1'],
                disable_list: ['node2']
            });
        }).toThrow();
    });

    test('Graph Execution', () => {
        const graph = new Graph();
        
        // Create a simple processing pipeline
        const inputNode = new Node('input', 
            { value: 0 }, 
            { value: 0 }
        );
        const processingNode = new Node('processing',
            { input: 0 },
            { output: 0 }
        );
        const outputNode = new Node('output',
            { value: 0 },
            { result: 0 }
        );

        graph.addNode(inputNode);
        graph.addNode(processingNode);
        graph.addNode(outputNode);

        graph.addEdge('input', 'processing', { value: 'input' });
        graph.addEdge('processing', 'output', { output: 'value' });

        const config = new GraphRunConfig({
            root_inputs: {
                'input': { value: 42 }
            },
            data_overwrites: {},
            enable_list: ['input', 'processing', 'output']
        });

        const runId = graph.run(config);
        const results = graph.getLeafOutputs(runId);
        
        expect(results).toBeDefined();
        expect(results.output).toBeDefined();
    });
});