const crypto = require('crypto');

const log = require('@basaas/node-logger').getLogger('env', {
    level: process.env['LOG_LEVEL'] || 'error',
});

module.exports.getPassword = (envVarName) => {
    if (process.env[envVarName]) { return process.env[envVarName]; }

    const password = crypto.randomBytes(12).toString('base64');
    log.warn(`Missing ${envVarName}. This password will be auto-generated only displayed once via stdout!\n
    ===============================================\n
    || Auto generated password: ${password} ||\n
    ===============================================\n`);

    return password;
};

module.exports.required = (env) => {
    if (process.env[env]) { return process.env[env]; }
    log.error(`Missing required ${env}`);
    process.exit(1);
};

module.exports.optional = (env, defaultValue) => {
    if (process.env[env]) { return process.env[env]; }
    return defaultValue;
};
