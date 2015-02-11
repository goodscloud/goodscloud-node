var Client = require('../goodscloud');

describe('URL builder', function () {
  var client = null;

  beforeEach(function () {
    client = new Client('http://127.0.0.1:5000');
    spyOn(client, 'build_url');
    client.auth = {
      buckets: {
        image: 'image',
        document: 'document',
        shipping_label: 'shipping'
      }
    };
  });

  it('should raise Error when run w/o AWS credentials', function () {
    client.auth.buckets = null;

    expect(function () {
      client.build_product_image_url('product-foo.jpg');
    }).toThrowError();
  });

  it('should build product image url', function () {
    client.build_product_image_url('product-foo.jpg')
    expect(client.build_url).toHaveBeenCalledWith('image', 'product-foo.jpg');
  });

  it('should build document url', function () {
    client.build_document_url('invoice.pdf');
    expect(client.build_url).toHaveBeenCalledWith('document', 'invoice.pdf');
  });

  it('should build shipping label url', function () {
    client.build_shipping_label_url('1DX72V086890482193');
    expect(client.build_url).toHaveBeenCalledWith('shipping', '1DX72V086890482193');
  });
});


// login()
// should set email, company and auth fields on success

// sign()
// should do signing according to http://docs.goodscloud.net/src/gcapi/user-auth.html
