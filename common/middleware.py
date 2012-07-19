import pytz
import threading

from django.utils import timezone

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