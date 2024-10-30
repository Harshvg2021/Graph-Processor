
class Edge {
    constructor(srcNode, dstNode, srcToDstDataKeys = {}) {
        this.srcNode = srcNode;
        this.dstNode = dstNode;
        this.srcToDstDataKeys = srcToDstDataKeys; // maps data_out keys of src to data_in keys of dst
    }


}

module.exports = Edge;