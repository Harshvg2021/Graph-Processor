// src/models/Node.js
const Edge = require('./Edge');
class Node {
    constructor(nodeId, dataIn = {}, dataOut = {}) {
        this.nodeId = nodeId;
        this.dataIn = dataIn;
        this.dataOut = dataOut;
        this.pathsIn = [];
        this.pathsOut = [];
    }

    addIncomingEdge(edge) {
        if (!this.pathsIn.includes(edge)) {
            this.pathsIn.push(edge);
        }
    }

    addOutgoingEdge(edge) {
        if (!this.pathsOut.includes(edge)) {
            this.pathsOut.push(edge);
        }
    }

    isRoot() {
        return this.pathsIn.length === 0;
    }

    isLeaf() {
        return this.pathsOut.length === 0;
    }

    getPredecessors() {
        return this.pathsIn.map(edge => edge.srcNode);
    }

    getSuccessors() {
        return this.pathsOut.map(edge => edge.dstNode);
    }

    reset() {
        this.dataIn = {};
        this.dataOut = {};
    }

    hasRequiredInputs() {
        const requiredKeys = new Set();
        this.pathsIn.forEach(edge => {
            Object.values(edge.srcToDstDataKeys).forEach(key => {
                requiredKeys.add(key);
            });
        });

        return Array.from(requiredKeys).every(key => key in this.dataIn);
    }


}

module.exports = Node;