const find = require('lodash/find');
const logger = require('@basaas/node-logger');
const moment = require('moment');
const AuthClientDAO = require('../../dao/auth-client');
const AuthFlowDAO = require('../../dao/auth-flow');
const SecretDAO = require('../../dao/secret');
const authFlowManager = require('../../auth-flow-manager');
const conf = require('../../conf');
const { getKey } = require('../../middleware/key');


const log = logger.getLogger(`${conf.log.namespace}/callback/handle-oauth2`, {
    level: conf.log.level
});

module.exports = async function handleOAuth({
    queryObject,
    req,
}) {
    const flow = await AuthFlowDAO.findByRequestToken(queryObject.oauth_token);

    const authClient = await AuthClientDAO.findById(flow.authClientId);
    let modifiedSecret = null;
    // fetch key
    req.keyParameter = flow.keyParameter;
    const key = await getKey(req);

    // request tokens
    const tokens = await authFlowManager.continue({
        authClient,
        flow,
        queryObject,
    });

    //
    log.debug('NEW TOKENS');
    log.debug(tokens);

    const scope = flow.scope;

    const expires = (tokens.expires_in !== undefined && !Number.isNaN(tokens.expires_in))
        ? moment().add(tokens.expires_in, 'seconds').format() : moment(1e15).format();

    let secret = {
        owners: [{
            id: flow.creator,
            type: flow.creatorType,
        }],
        type: authClient.type,
        value: {
            authClientId: authClient._id,
            // refreshToken: tokens.refresh_token,
            accessToken: tokens.accessToken,
            accessTokenSecret: tokens.accessTokenSecret,
            scope,
            expires,
        },
    };

    // preprocess secret

    secret = await authFlowManager.preprocessSecret({
        flow,
        authClient,
        secret,
        tokenResponse: tokens,
        localMiddleware: req.app.locals.middleware,
    });

    secret.name = flow.secretName
        || secret.name
        || secret.value.externalId
        || authClient.name;

    // try to find secret by external id to prevent duplication
    const _secret = await SecretDAO.findByExternalId(
        secret.value.externalId,
        flow.authClientId,
    );

    if (_secret) {
        const updateValues = {
            id: _secret._id,
            data: {
                value: {
                    scope,
                    expires,
                    accessToken: tokens.access_token,
                },
            },
        };

        if (!find(_secret.owners, { id: flow.creator })) {
            updateValues.data.owners = _secret.owners;
            updateValues.data.owners.push({
                id: flow.creator,
                type: flow.creatorType,
            });
        }

        modifiedSecret = await SecretDAO.update(updateValues, key);
    } else {
        // create new secret
        modifiedSecret = await SecretDAO.create(secret, key);
    }
    // clean up flow data
    await AuthFlowDAO.delete(flow._id);

    return {
        data: {
            successUrl: flow.successUrl,
            secretId: modifiedSecret._id,
        },
    };
};
