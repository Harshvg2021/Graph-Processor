class GraphRunConfig {
    constructor({
        root_inputs = {},
        data_overwrites = {},
        enable_list = null,
        disable_list = null
    }) {
        this.root_inputs = root_inputs;
        this.data_overwrites = data_overwrites;
        this.enable_list = enable_list;
        this.disable_list = disable_list;

        this.validate();
    }

    validate() {
        if (this.enable_list && this.disable_list) {
            throw new Error('Cannot provide both enable_list and disable_list');
        }

        if (typeof this.root_inputs !== 'object' || this.root_inputs === null) {
            throw new Error('root_inputs must be an object');
        }

        if (typeof this.data_overwrites !== 'object' || this.data_overwrites === null) {
            throw new Error('data_overwrites must be an object');
        }

        if (this.enable_list && !Array.isArray(this.enable_list)) {
            throw new Error('enable_list must be an array');
        }
        if (this.disable_list && !Array.isArray(this.disable_list)) {
            throw new Error('disable_list must be an array');
        }

        return true;
    }

    isNodeEnabled(nodeId) {
        if (this.enable_list) {
            return this.enable_list.includes(nodeId);
        }
        if (this.disable_list) {
            return !this.disable_list.includes(nodeId);
        }
        return true;
    }

    clone() {
        return new GraphRunConfig({
            root_inputs: JSON.parse(JSON.stringify(this.root_inputs)),
            data_overwrites: JSON.parse(JSON.stringify(this.data_overwrites)),
            enable_list: this.enable_list ? [...this.enable_list] : null,
            disable_list: this.disable_list ? [...this.disable_list] : null
        });
    }
}

module.exports = GraphRunConfig;