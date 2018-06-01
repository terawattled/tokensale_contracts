'use strict';

var kycController = require('./KycController');
var router              = express.Router();

module.exports = (function () {

    // router.get('/', [validatorClass.validatePaginationParams(), validatorClass.refercodeRouteValidate('index')], function (req, res, next) {
    //     refercodeController.index(req, res);
    // });


    router.get('/:objectId/documents',  function (req, res, next) {
        kycController.getDocuments(req, res);
    });

    router.post('/:objectId/documents',  function (req, res, next) {
        kycController.createDocuments(req, res);
    });

    router.post('/', [validatorClass.kycRouteValidate('store')], function (req, res, next) {
        kycController.store(req, res);
    });

    router.get('/:objectId',  function (req, res, next) {
        kycController.get(req, res);
    });

    router.put('/:objectId',  function (req, res, next) {
        kycController.put(req, res);
    });
    return router;
})();