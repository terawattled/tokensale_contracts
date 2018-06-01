'use strict';

var kycController = require('./KycController');
var router              = express.Router();

module.exports = (function () {

    // router.get('/', [validatorClass.validatePaginationParams(), validatorClass.refercodeRouteValidate('index')], function (req, res, next) {
    //     refercodeController.index(req, res);
    // });

    router.post('/', [validatorClass.kycRouteValidate('store')], function (req, res, next) {
        kycController.store(req, res);
    });

    router.get('/:objectId', [validatorClass.kycRouteValidate('show')], function (req, res, next) {
        refercodeController.show(req, res);
    });

    return router;
})();