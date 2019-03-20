import xmlrpclib
import time
import logging

__logger = logging.getLogger(__name__)

start_time = time.time()

database = 'v12_pos_retail'
login = 'admin'
password = '1'
url = 'http://localhost:8012'

common = xmlrpclib.ServerProxy('{}/xmlrpc/2/common'.format(url))
uid = common.authenticate(database, login, password, {})

models = xmlrpclib.ServerProxy(url + '/xmlrpc/object')

with open("img.png", "rb") as f:
    data = f.read()
    for i in range(10, 20):
        vals = {
            'list_price': i,
            'description': u'description',
            'display_name': 'Test/seq/%s' % str(i),
            'name': 'Test/seq/%s' % str(i),
            'pos_categ_id': 1,
            'to_weight': u'True',
            'image': data.encode("base64")
        }
        product_id = models.execute_kw(database, uid, password, 'product.product', 'create', [vals])
        print ('created: %s' % i)

        result = models.execute_kw(database, uid, password, 'product.product', 'write', [product_id, {
            'list_price': 1000
        }])

        print ('write result: %s' % result)
