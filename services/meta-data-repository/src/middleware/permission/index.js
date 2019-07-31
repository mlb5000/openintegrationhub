const logger = require('@basaas/node-logger');
const { hasAll, isOwnerOf } = require('@openintegrationhub/iam-utils');
const DomainDAO = require('../../dao/domain');
const conf = require('../../conf');

const log = logger.getLogger(`${conf.logging.namespace}/permission`);

module.exports = {
    domainOwnerOrAllowed: ({ permissions }) => async (req, res, next) => {
        try {
            req.hasAll = hasAll({
                user: req.user,
                requiredPermissions: permissions,
            });

            const domain = await DomainDAO.findOne({
                _id: req.params.id || req.domainId,
            });

            if (!domain) {
                if (req.hasAll) {
                    return next({ status: 404 });
                }
                return next({ status: 403 });
            }

            req.ownsDomain = isOwnerOf({
                entity: domain,
                user: req.user,
            });

            if (req.ownsDomain || req.hasAll) {
                return next();
            }

            return next({ status: 403 });
        } catch (err) {
            log.error(err);
            if (req.hasAll) {
                return next({ status: 404 });
            }

            return next({ status: 403 });
        }
    },
};