#Prod settings
from techresidents_web.settings import *

DEBUG = False
TEMPLATE_DEBUG = False

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',     # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'techresidents',                                # Or path to database file if using sqlite3.
        'USER': 'techresidents',                                # Not used with sqlite3.
        'PASSWORD': 't3chResident$',                            # Not used with sqlite3.
        'HOST': 'localhost',                                    # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '5432',                                         # Set to empty string for default. Not used with sqlite3.
    }
}

#Session settings
SESSION_COOKIE_AGE = 1209600  #2 weeks
SESSION_COOKIE_DOMAIN = '.techresidents.com'

#Static files settings
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.CachedStaticFilesStorage'

#Django message settings
#MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

#Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'techresidents'
EMAIL_HOST_PASSWORD = '7H5xkuNc'
DEFAULT_FROM_EMAIL = 'Tech Residents Support <support@techresidents.com>'

#Riak Session Cache
RIAK_HOST = 'localhost'

#Cloudfiles 
DEFAULT_FILE_STORAGE = 'techresidents_web.cloudfiles_storage.storage.CloudfilesStorage'
CLOUDFILES_USERNAME = 'trprod'
CLOUDFILES_PASSWORD = 'tUtzm2wb'
CLOUDFILES_CONTAINER_NAME = "tr_public"
CLOUDFILES_SERVICENET = True
CLOUDFILES_TIMEOUT = 5
CLOUDFILES_CREATE_CONTAINER = False

#Landing settings
LANDING_PLACEHOLDER = False

#Registration settings
REGISTRATION_REQUIRES_CODE = False

#Login using HTTPS. This is should only be used by the landing page which is http,
#but POSTS to the login page using https in non-development environments.
TR_LOGIN_USING_HTTPS = True
TR_XD_REMOTE = 'http://api.techresidents.com/static/js/easyXDM/cors/index.html'

#Tokbox settings
TOKBOX_API_KEY = '20288731'
TOKBOX_API_SECRET = '8f8cd837895e064f56e506e952e09c63af396172'

#Logging settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(asctime)s %(levelname)s [session=%(session)s userId=%(user)s] %(name)s: %(message)s'
        }
    },

    'filters': {
        'request_filter': {
            '()': 'techresidents_web.common.logutil.RequestFilter'
        }
    },

    'handlers': {
        # The null handler has no formatting or output (a no-op).
        'null_handler': {
            'level':'DEBUG',
            'class':'django.utils.log.NullHandler'
        },
        # Note that outputting logs to stdout or stderr will result in log messages
        # showing up in the Apache logs because Apache is responsible for
        # starting the Django process.
        'console_handler': {
            'level': 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': 'ext://sys.stdout'
        },
        'tr_web_file_handler': {
            'level': 'WARNING',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'verbose',
            'filename': '/opt/tr/www/techresidents.com/prod/log/techresidents_web.prod.log',
            'when': 'midnight',
            'interval': 1,
            'backupCount': 7,
            'filters': ['request_filter'],
            }
    },

    'loggers': {
        # This is the Django catch-all logger; no messages are logged directly
        # with this logger.
        'django': {
            'handlers':['tr_web_file_handler'],
            'propagate': False,
            'level':'WARNING'
        },
        'django.request': {
            'handlers': ['tr_web_file_handler'],
            'propagate': False,
            'level': 'WARNING'
        },
        # The django.db.backends logger is only applied if the var DEBUG=True
        'django.db.backends': {
            'handlers': ['null_handler'],
            'propagate': False,
            'level': 'DEBUG'
        }
    },

    # Logger responsible for capturing all techresidents web log messages.
    'root': {
        'handlers': ['tr_web_file_handler'],
        'level':'WARNING'
    }
}
