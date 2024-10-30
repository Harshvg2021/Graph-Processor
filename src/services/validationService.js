// src/services/validationService.js

const Node = require('../models/Node');
const Edge = require('../models/Edge');
const Graph = require('../models/Graph');
const { detectCycle, checkTypeCompatibility, findIslands, toposort } = require('../utils/helpers');

class ValidationService {
  static validateEdgeDataTypes(edge, graph) {
    const srcNode = graph.getNode(edge.srcNode);
    const dstNode = graph.getNode(edge.dstNode);
    
    // Check if data types between src's data_out and dst's data_in match as specified in `src_to_dst_data_keys`
    for (const [srcKey, dstKey] of Object.entries(edge.srcToDstDataKeys)) {
      const srcDataType = typeof srcNode.dataOut[srcKey];
      const dstDataType = typeof dstNode.dataIn[dstKey];
      if (srcDataType !== dstDataType) {
        throw new Error(`Data type mismatch: ${srcKey} (from ${edge.srcNode}) to ${dstKey} (in ${edge.dstNode})`);
      }
    }
    return true;
  }

  static validateGraph(graph) {
    const nodes = graph.getNodes();
    const visited = new Set();
    const stack = new Set();

    // Cycle detection
    for (const node of nodes) {
      if (detectCycle(node, visited, stack, graph)) {
        throw new Error('Cycle detected in the graph');
      }
    }

    // Validate edges for duplicates and type compatibility
    for (const node of nodes) {
      const seenEdges = new Set();
      for (const edge of node.pathsOut) {
        const edgeKey = `${edge.srcNode}-${edge.dstNode}`;
        if (seenEdges.has(edgeKey)) {
          throw new Error(`Duplicate edge detected from ${edge.srcNode} to ${edge.dstNode}`);
        }
        seenEdges.add(edgeKey);
        
        // Edge parity and type compatibility check
        this.validateEdgeDataTypes(edge, graph);
      }
    }

    // Island detection
    const islands = findIslands(graph);
    if (islands.length > 1) {
      throw new Error('Graph contains isolated islands');
    }

    return true;
  }

  static validateNodeIds(graph) {
    const nodeIds = new Set();
    for (const node of graph.getNodes()) {
      if (nodeIds.has(node.nodeId)) {
        throw new Error(`Duplicate node ID found: ${node.nodeId}`);
      }
      nodeIds.add(node.nodeId);
    }
    return true;
  }
}

module.exports = ValidationService;
