const { BaseDriver } = require('@openintegrationhub/component-orchestrator');
const uuid = require('uuid/v4');
const _ = require('lodash');
const KubernetesRunningComponent = require('./KubernetesRunningComponent');
const Secret = require('./Secret');

const ENV_PREFIX = 'ELASTICIO_'

const GLOBAL = 'global'
const GLOBAL_PREFIX = `${GLOBAL}-`
const LOCAL = 'local'
const LOCAL_PREFIX = `${LOCAL}-`

const KUBERNETES_NAME_CONVENTION = /[^0-9a-z\-\.]/gi // eslint-disable-line no-useless-escape

class KubernetesDriver extends BaseDriver {
    constructor({ config, logger, k8s }) {
        super();
        this._config = config;
        this._logger = logger;
        this._coreClient = k8s.getCoreClient();
        this._appsClient = k8s.getAppsClient()
    }

    async createApp({ flow, node, envVars, component, options }) {
        if (component.isGlobal) {
            this._logger.info({ component: component.id }, 'Going to apply global deployment to k8s');
            try {
                const env = this._prepareGlobalEnvVars(component, envVars);
                const secret = await this._ensureSecret(`${GLOBAL_PREFIX}${component.id}`, env);
                await this._createRunningComponent({ secret, component, options });
            } catch (e) {
                this._logger.error(e, 'Failed to apply global deployment');
            }
        } else {
            this._logger.info({ flow: flow.id }, 'Going to apply local deployment to k8s');
            try {
                const env = this._prepareLocalEnvVars(flow, node, envVars);
                const secret = await this._ensureSecret(`${LOCAL_PREFIX}${flow.id}${node.id}`, env);
                await this._createRunningComponent({ flow, node, secret, component, options });
            } catch (e) {
                this._logger.error(e, 'Failed to apply local deployment');
            }
        }
    }

    async _createRunningComponent({ flow, node, secret, component, options }) {
        const descriptor = await this._generateDefinition({ flow, node, secret, component, options });
        this._logger.trace(descriptor);
        const result = await this._appsClient.deployments.post({ body: descriptor });
        return new KubernetesRunningComponent(result.body);
    }

    async _ensureSecret(name, secretEnvVars) {
        const flowSecret = await this._getSecret(name);
        if (!flowSecret) {
            return this._createSecret(name, secretEnvVars);
        }

        flowSecret.data = secretEnvVars;
        return this._updateSecret(flowSecret);
    }

    async _updateSecret(secret) {
        const secretName = secret.name;
        this._logger.debug({ secretName }, 'About to update the secret');
        const response = await this._coreClient.secrets(secretName).put({
            body: secret.toDescriptor()
        });
        return new Secret(response.body);
    }

    async _getSecret(name) {
        try {
            const secretName = this._getSecretName(name);
            const result = await this._coreClient.secrets(secretName).get();
            return Secret.fromDescriptor(result.body);
        } catch (e) {
            if (e.statusCode === 404) {
                return null;
            }
            throw e;
        }
    }

    _getSecretName(name) {
        return name.toLowerCase().replace(KUBERNETES_NAME_CONVENTION, '');
    }

    async _createSecret(name, data) {
        const secretName = this._getSecretName(name);
        this._logger.debug({ secretName }, 'About to create a secret');

        const secret = new Secret({
            metadata: {
                name: secretName,
                namespace: this._config.get('NAMESPACE')
            },
            data
        });

        const response = await this._coreClient.secrets.post({
            body: secret.toDescriptor()
        });
        this._logger.debug('Secret has been created');

        return new Secret(response.body);
    }

    async destroyApp(app) {
        //TODO wait until job really will be deleted
        this._logger.info({ name: app.name }, 'Going to delete deployment from k8s');

        try {
            await this._appsClient.deployments(app.name).delete({
                body: {
                    kind: 'DeleteOptions',
                    apiVersion: 'apps/v1',
                    propagationPolicy: 'Foreground'
                }
            });
        } catch (e) {
            if (e.statusCode !== 404) {
                this._logger.error(e, 'Failed to delete deployment');
            }
        }

        if (app.type === GLOBAL) {
            await this._deleteSecret(`${GLOBAL_PREFIX}${app.componentId}`);
        } else {
            await this._deleteSecret(`${LOCAL_PREFIX}${app.flowId}${app.nodeId}`);
        }

    }

    async _deleteSecret(name) {
        try {
            const secretName = this._getSecretName(name);
            this._logger.trace({ secretName }, 'Deleting flow secret');
            await this._coreClient.secrets(secretName).delete();
        } catch (e) {
            if (e.statusCode !== 404) {
                this._logger.error(e, 'failed to delete secret');
            }
        }
    }

    async getAppList() {
        return ((await this._appsClient.deployments.get()).body.items || []).map(i => new KubernetesRunningComponent(i));
    }

    async _generateDefinition({ flow, node, secret, component, options = {} }) {

        // default options
        const {
            replicas = 1,
            imagePullPolicy = 'Always'
        } = options

        let appId, matchLabels, labels, annotations

        if (component.isGlobal) {
            appId = `${GLOBAL_PREFIX}${component.id}`;

            labels = {
                componentId: component.id,
            }

            matchLabels = {
                componentId: component.id,
            }

            annotations = {
                componentId: component.id,
                type: GLOBAL
            }
        } else {
            appId = `${LOCAL_PREFIX}${flow.id}.${node.id}`;

            labels = {
                flowId: flow.id,
                stepId: node.id,
            }

            matchLabels = {
                flowId: flow.id,
                stepId: node.id,
            }

            annotations = {
                flowId: flow.id,
                stepId: node.id,
                nodeId: node.id,
                type: LOCAL
            }
        }

        appId = appId.toLowerCase().replace(KUBERNETES_NAME_CONVENTION, '');

        const image = _.get(component, 'distribution.image');

        return {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: appId,
                namespace: this._config.get('NAMESPACE'),
                annotations
            },
            spec: {
                replicas,
                selector: {
                    matchLabels
                },
                template: {
                    metadata: {
                        labels,
                        annotations
                    },
                    spec: {
                        containers: [{
                            image,
                            name: 'apprunner',
                            imagePullPolicy,
                            envFrom: [{
                                secretRef: {
                                    name: secret.metadata.name
                                }
                            }],
                            resources: this._prepareResourcesDefinition({ flow, node, component })
                        }]
                    }
                }
            }
        };
    }

    _prepareResourcesDefinition({ flow, node, component }) {
        const lc = 'resources.limits.cpu';
        const lm = 'resources.limits.memory';
        const rc = 'resources.requests.cpu';
        const rm = 'resources.requests.memory';

        const cpuLimit = component.isGlobal && _.get(component, lc) || _.get(node, lc) || _.get(flow, lc) || this._config.get('DEFAULT_CPU_LIMIT');
        const memLimit = component.isGlobal && _.get(component, lm) || _.get(node, lm) || _.get(flow, lm) || this._config.get('DEFAULT_MEM_LIMIT');
        const cpuRequest = component.isGlobal && _.get(component, rc) || _.get(node, rc) || _.get(flow, rc) || this._config.get('DEFAULT_CPU_REQUEST');
        const memRequest = component.isGlobal && _.get(component, rm) || _.get(node, rm) || _.get(flow, rm) || this._config.get('DEFAULT_MEM_REQUEST');

        return {
            limits: {
                cpu: cpuLimit,
                memory: memLimit
            },
            requests: {
                cpu: cpuRequest,
                memory: memRequest
            }
        };
    }

    _prepareLocalEnvVars(flow, node, vars) {
        let envVars = this._addEnvVars(vars);

        envVars.API_USERNAME = 'iam_token';
        envVars.API_KEY = vars.IAM_TOKEN;

        envVars.STEP_ID = node.id;
        envVars.FLOW_ID = flow.id;
        envVars.USER_ID = flow.startedBy;
        envVars.COMP_ID = node.componentId;
        envVars.FUNCTION = node.function;

        envVars = Object.entries(envVars).reduce((env, [k, v]) => {
            env[`${ENV_PREFIX}${k}`] = v;
            return env;
        }, {});

        envVars.LOG_LEVEL = 'trace'
        return Object.assign(envVars, node.env);
    }

    _prepareGlobalEnvVars(component, vars) {
        let envVars = this._addEnvVars(vars);
        envVars.USER_ID = component.startedBy;
        envVars.COMP_ID = component.id;
        envVars.FUNCTION = component.function;

        envVars = Object.entries(envVars).reduce((env, [k, v]) => {
            env[`${ENV_PREFIX}${k}`] = v;
            return env;
        }, {});

        envVars.LOG_LEVEL = 'trace'
        return Object.assign(envVars, component.env);
    }

    _addEnvVars(vars) {
        let envVars = Object.assign({}, vars);

        // if running from host use cluster internal references instead
        if (this._config.get('RUNNING_ON_HOST') === 'true') {
            envVars.SNAPSHOTS_SERVICE_BASE_URL = 'http://snapshots-service.oih-dev-ns.svc.cluster.local:1234';
        }
        // envVars.SNAPSHOTS_SERVICE_BASE_URL = this._config.get('SNAPSHOTS_SERVICE_BASE_URL').replace(/\/$/, '');
        envVars.EXEC_ID = uuid().replace(/-/g, '');

        envVars.API_URI = this._config.get('SELF_API_URI').replace(/\/$/, '');

        // envVars.CONTAINER_ID = 'does not matter';
        // envVars.WORKSPACE_ID = 'does not matter';

        return envVars
    }

}

module.exports = KubernetesDriver