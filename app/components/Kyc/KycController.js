'use strict';

// var Refercode      = require('./RefercodeSchema');
// var RefercodeModel = require('./RefercodeModel');
var User           = require(BASE_PATH + '/app/components/User/UserSchema');
var UserModel      = require(BASE_PATH + '/app/components/User/UserModel');


module.exports = {

    /**
     * store() stores a new resource
     * based on passed query parameters
     *
     * @url {{URL}}/referrals
     * @param <String> email, ethereumAddress
     * @return <String> Success or Error message
     */

    store: function (req, res) {
        
        helpers.getSwiftAccessToken().then(response => {
            var customer = {
                type: req.body.type,
                // telephone: req.body.telephone,
                email: req.body.email
            };
            if (req.body.type == 'INDIVIDUAL') {
                customer.first_name = req.body.first_name;
                customer.last_name = req.body.last_name;
            } else if (req.body.type == 'COMPANY') {
                customer.company_name = req.body.company_name;
            }
            
            return helpers.createSwiftCustomer(response.access_token, customer);
        }).then(customer=>{
            return helpers.updateUserDetails(req, res, {switfdilCustomerID: customer.id})
        }).then(updatedCustomer=>{
            
            helpers.createResponse(res, constants.SUCCESS,
                messages.KYC_SUCCESS,
                {'data': updatedCustomer}
            );
        }).catch ((err) => {
            log('Error in kyc => store API : ', err);
                helpers.createResponse(res, constants.SERVER_ERROR,
                messages.SERVER_ERROR_MESSAGE,
                {'error': messages.SERVER_ERROR_MESSAGE}
            );
        });
    }, // store function close

    /*/!**
     * show() get details of particular resource
     * based on passed resource id
     *
     * @url {{URL}}/transaction/resourceId
     * @param <ObjectId> resourceId
     * @return <Element> Resource Details
     *!/

    show: function (req, res) {
        helpers.findOne(res, Transaction, constants.TRANSACTION_MODEL_NAME,
            {'_id': req.params.objectId}, {},
            function (transaction) {
                if (!transaction || typeof transaction === 'undefined') {
                    log("Refer does not exist for " + req.params.objectId + " in show method :");
                    helpers.createResponse(res, constants.UNPROCESSED,
                        messages.MODULE_NOT_FOUND(constants.TRANSACTION_MODEL_NAME),
                        {'error': messages.MODULE_NOT_FOUND(constants.TRANSACTION_MODEL_NAME)});
                } else {
                    log('Transaction show API Success!');
                    helpers.createResponse(res, constants.SUCCESS,
                        messages.MODULE_SHOW_SUCCESS(constants.TRANSACTION_MODEL_NAME),
                        { 'data' : transaction }
                    );
                }
            }
        );
    }, //show function close*/
};