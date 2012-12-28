import json
import urllib

from django.conf import settings

from techresidents_web.api.http.rest.client import RestClient
from techresidents_web.api.http.rest.auth import RestAuthenticator

class ApisvcClient(RestClient, RestAuthenticator):
    def __init__(self,
            session_id,
            endpoint=None,
            connection_class=None,
            timeout=10):
        
        self.session_id = session_id

        if endpoint is None:
            endpoint = settings.TR_API_ENDPOINT

        super(ApisvcClient, self).__init__(
            endpoint=endpoint,
            connection_class=connection_class,
            timeout=timeout,
            authenticator=self)
    
    def authenticate(self):
        auth_headers = {
            "Cookie": "sessionid=%s" % self.session_id
        }
        return auth_headers

    def user(self, user_id, with_related=None):
        path = "/users/%s" % user_id
        if with_related:
            params = urllib.urlencode({"with": with_related})
            path += "?%s" % params
        response = self.send_request("GET", path, data=None, headers=None)
        result = json.loads(response.read())
        return result
