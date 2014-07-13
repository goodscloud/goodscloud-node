var Client = require('./goodscloud');

var c = new Client('http://sandbox.goodscloud.com');
c.login('me@mycompany.com', 'PASSWORD',
    function () {
        console.info("Logged in as", c.email);
        c.get('/api/internal/company', {flat: true}, function (data) {
            console.info(data);
        });
    }
);
