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
with open("partner.jpeg", "rb") as f:
    data = f.read()
    for i in range(0, 100):
        vals = {
            'street': u'Hoang Hoa Tham, Tan Binh',
            'city': u'Ho Chi Minh',
            'name': 'S1mple/%s' % str(i),
            'zip': u'False',
            'mobile': u'0909888888',
            'country_id': 233,
            'email': u'example@mail.com',
            'image': data.encode("base64")
        }
        partner_id = models.execute_kw(database, uid, password, 'res.partner', 'create', [vals])

        print ('partner id: %s' % partner_id)

        partner_id = models.execute_kw(database, uid, password, 'res.partner', 'write', [partner_id, {
            'name': 's1mple/navi/%s' % i
        }])

        print('partner id: %s' % partner_id)



