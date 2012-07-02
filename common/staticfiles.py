import time

from django.contrib.staticfiles.storage import StaticFilesStorage

class CacheBustingStaticFilesStorage(StaticFilesStorage):
    """Simple extension to StaticFilesStorage with support for cache busting.

    This file storage is intended for development usage ONLY, NOT PRODUCTION.
    It will append the current epoch timestamp url paramter to each static
    file url in order to prevent browser caching.

    To enable, add the following line to settings.py:
    STATICFILES_STORAGE = 'common.staticfiles.CacheBustingStaticFilesStorage'
    """
    def url(self, name):
        result = super(CacheBustingStaticFilesStorage, self).url(name)
        try:
            now = int(time.time())
            if result.find('?') == -1:
                result += '?%s' % now
            else:
                result += '&%s' % now
        except Exception:
            pass
        return result
