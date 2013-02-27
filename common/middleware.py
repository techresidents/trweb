import pytz
import threading

from django.conf import settings
from django.contrib import auth
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.utils import timezone

User = get_user_model()

class TimezoneMiddleware(object):
    def process_request(self, request):
        tz = request.session.get('timezone')
        if tz:
            timezone.activate(pytz.timezone(tz))


class TLSRequestMiddleware(object):
    """
        Middleware used to capture the Request object.

        This middleware utilizes thread local storage (TLS) to store the Request
        object for easy reference elsewhere in the code.  One place that leverages
        this middleware is the Logging.
    """

    threadlocal = threading.local()

    def __init__(self):
        self.threadlocal = TLSRequestMiddleware.threadlocal

    @staticmethod
    def get_threadlocal_storage():
        return TLSRequestMiddleware.threadlocal

    def process_request(self, request):
        self.threadlocal.request = request
        return None

    def process_response(self, request, response):
        try:
            self.threadlocal.request = None
        except Exception:
            pass
        finally:
            return response

class DemoMiddleware(object):
    """Demo middleware

    This middleware allows us to easily demo our app as the demo user
    with a url like techresidents.com?demo=<guid>. This middleware will
    intercept all url's with a demo url parameter and login() the user
    with the demo account associated with the guid.
    """
    
    def __init__(self):
        self.demo_users = settings.DEMO_USERS

    def process_request(self, request):
        try:
            if request.method == "GET" and "demo" in request.GET:
                key = request.GET["demo"]
                if key in self.demo_users:
                    username = self.demo_users[key]
                    user = User.objects.get(username=username)
                    
                    #if valid username/password and user is active
                    if user and user.is_active:
                        user.backend = 'django.contrib.auth.backends.ModelBackend'
                        auth.login(request, user)
                        return HttpResponseRedirect(request.path)
        except:
            pass
        return None
