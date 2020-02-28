const _ = require('lodash');

const toBase64 = str => Buffer.from(str).toString('base64');
const fromBase64 = str => Buffer.from(str, 'base64').toString();

/**
 * Represents a Flow's K8s Secret
 */
class FlowSecret {
    constructor({ metadata = {}, data = {} } = {}) {
        Object.assign(this, {
            metadata,
            data
        });
    }

    get id() {
        return this.name;
    }

    get name() {
        return _.get(this, 'metadata.name');
    }

    setMetadataValue(key, value) {
        this.metadata[key] = value;
    }

    getMetadataValue(key) {
        return _.get(this, `metadata.${key}`);
    }

    /**
     * Return K8s descriptor representation.
     * @returns K8s descriptor
     */
    toDescriptor(logger) {
        return {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: this.metadata,
            data: Object.entries(this.data).reduce((hash, entry) => {
                const [ key, value ] = entry;
                try {
                    hash[key] = toBase64(value);
                } catch (e) {
                    if (logger) {
                        logger.error(e, `Failed to convert to base64 key: ${key}, value: ${value}, type: ${typeof value}`);
                    }
                    throw e;
                }
                return hash;
            }, {})
        };
    }

    /**
     * Create a FlowSecret from a K8s descriptor.
     * @param {Object} descriptor
     * @returns {FlowSecret}
     */
    static fromDescriptor(descriptor = {}) {
        return new this({
            metadata: descriptor.metadata,
            data: Object.entries(descriptor.data || {}).reduce((hash, entry) => {
                const [ key, value ] = entry;
                hash[key] = fromBase64(value);
                return hash;
            }, {})
        });
    }
}

module.exports = FlowSecret;
