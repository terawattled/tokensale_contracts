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

    /**
     * get() get details of particular resource
     * based on passed resource id
     *
     * @url {{URL}}/transaction/resourceId
     * @param <ObjectId> resourceId
     * @return <Element> Resource Details
     */

    get: function (req, res) {
        
        helpers.getSwiftAccessToken().then(response => {
            
            return helpers.getSwiftCustomer(response.access_token, req.params.objectId);
        }).then(customer=>{
            helpers.createResponse(res, constants.SUCCESS,
                messages.KYC_SUCCESS,
                {'data': customer}
            );
        }).catch ((err) => {
            log('Error in kyc => get API : ', err);
                helpers.createResponse(res, constants.SERVER_ERROR,
                messages.SERVER_ERROR_MESSAGE,
                {'error': messages.SERVER_ERROR_MESSAGE}
            );
        });
    }, //show function close

    put: function (req, res) {
        
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
            
            return helpers.updateSwiftCustomer(response.access_token, customer, req.params.objectId);
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

    
    getDocuments: function (req, res) {
        
        helpers.getSwiftAccessToken().then(response => {
            return helpers.getSwiftDocuments(response.access_token, req.params.objectId);
        }).then(documents=>{
            
            helpers.createResponse(res, constants.SUCCESS,
                messages.KYC_SUCCESS,
                {'data': documents}
            );
        }).catch ((err) => {
            log('Error in kyc => store API : ', err);
                helpers.createResponse(res, constants.SERVER_ERROR,
                messages.SERVER_ERROR_MESSAGE,
                {'error': messages.SERVER_ERROR_MESSAGE}
            );
        });
    }, // store function close

    createDocuments: function (req, res) {
        
        helpers.getSwiftAccessToken().then(response => {
            var document = {
                type: req.body.type
            };
            return helpers.createSwiftDocument(response.access_token, req.params.objectId, document);
        }).then(document=>{
            
            helpers.createResponse(res, constants.SUCCESS,
                messages.KYC_SUCCESS,
                {'data': document}
            );
        }).catch ((err) => {
            log('Error in kyc => store API : ', err);
                helpers.createResponse(res, constants.SERVER_ERROR,
                messages.SERVER_ERROR_MESSAGE,
                {'error': messages.SERVER_ERROR_MESSAGE}
            );
        });
    }, // store function close

};