// src/utils/helpers.js

function detectCycle(node, visited, stack, graph) {
    if (stack.has(node.nodeId)) return true; // Cycle detected
    if (visited.has(node.nodeId)) return false;
  
    visited.add(node.nodeId);
    stack.add(node.nodeId);
  
    for (const edge of node.pathsOut) {
      const nextNode = graph.getNode(edge.dstNode);
      if (detectCycle(nextNode, visited, stack, graph)) {
        return true;
      }
    }
  
    stack.delete(node.nodeId);
    return false;
  }
  
  function checkTypeCompatibility(dataType1, dataType2) {
    return dataType1 === dataType2;
  }
  
  function findIslands(graph) {
    const nodes = graph.getNodes();
    const visited = new Set();
    const islands = [];
  
    for (const node of nodes) {
      if (!visited.has(node.nodeId)) {
        const island = [];
        dfs(node, visited, island, graph);
        islands.push(island);
      }
    }
  
    return islands;
  }
  
  function dfs(node, visited, island, graph) {
    visited.add(node.nodeId);
    island.push(node.nodeId);
  
    for (const edge of node.pathsOut) {
      const nextNode = graph.getNode(edge.dstNode);
      if (!visited.has(nextNode.nodeId)) {
        dfs(nextNode, visited, island, graph);
      }
    }
  }
  
  module.exports = {
    detectCycle,
    checkTypeCompatibility,
    findIslands,
  };
  