const mongoose = require('mongoose');

const schema = require('./schemas/flow').flow;

class Flow {
    get isStarting() {
        return this.status === 'starting';
    }

    get isStopping() {
        return this.status === 'stopping';
    }

    getFirstNode() {
        const nodes = this.getNodes();
        const edges = this.getEdges();

        if (nodes.length === 0) {
            return null;
        } else if (nodes.length === 1) {
            return nodes[0];
        }

        if (edges.length === 0) {
            return null;
        }

        return nodes.find(node => !edges.find(edge => edge.target === node.id));
    }

    getNodeById(id) {
        return this.getNodes().find(node => node.id === id);
    }

    getNodes() {
        return this.graph.nodes || [];
    }

    getEdges() {
        return this.graph.edges || [];
    }

    onStarted() {
        this.status = 'started';
        return this.save();
    }

    onStopped() {
        return this.remove();
    }
}

schema.loadClass(Flow);

module.exports = mongoose.model('Flow', schema);
