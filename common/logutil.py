import logging

from techresidents_web.common.middleware import TLSRequestMiddleware


class RequestFilter(logging.Filter):
    """
    This is a filter which injects request data into the log.

    This filter injects the request.user and request.session data into the log.
    """

    def filter(self, record):
        try:
            record.user = None
            record.session = None

            threadlocal = TLSRequestMiddleware.get_threadlocal_storage()
            request = getattr(threadlocal, "request", None)
            if request is not None:
                record.user = threadlocal.request.user.id
                record.session = threadlocal.request.session.session_key
        except:
            pass
        return True
