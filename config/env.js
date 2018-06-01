module.exports = {

    'PORT' : 3000, //Port that Api will be hosted on

    'DB_HOST'     : 'localhost',
    'DB_NAME'     : 'tokenDB',
    'DB_PORT'     : '27017', //Default Mongo DB
    'DB_USERNAME' : 'tokenApi',
    'DB_PASSWORD' : 'abc123',


    'BASE_URL' : '',

    'algorithm' : 'HS256',
    'expiresIn' : '2h',

    //JWT Configuration
    'JWT_SECRET'     : 'XaA6JrXR1G0',
    'JWT_ALGORITHEM' : 'HS256',
    'TOKEN_EXPIRY'   : '2h',
    
    //JWT Static token
    STATIC_TOKEN     : '23oij32ofno234[fn3infij3nfewj',

    //Pagination
    SORT_BY          : 'CreatedAt',
    SORT_ORDER       : 'desc',
    PAGE_NUMBER      : 1,
    RECORDS_PER_PAGE : 10,

    //SwiftDil
    SWIFT_BASE_URL         : 'https://sandbox.swiftdil.com/v1/',
    SWIFT_CLIENT_ID        : 'terawatt-demo',
    SWIFT_CLIENT_KEY       : '051c5977-0634-444b-8337-b1a9c0de2846',
};
