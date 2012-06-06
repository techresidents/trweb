#Staging settings
from techresidents_web.settings import *

DEBUG = False
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',     # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'staging_techresidents',                        # Or path to database file if using sqlite3.
        'USER': 'techresidents',                                # Not used with sqlite3.
        'PASSWORD': 'techresidents',                            # Not used with sqlite3.
        'HOST': 'localhost',                                    # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '5432',                                         # Set to empty string for default. Not used with sqlite3.
    }
}

#Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 25
#EMAIL_HOST_USER = 'user'
#EMAIL_HOST_PASSWORD = 'password'
DEFAULT_FROM_EMAIL = 'Tech Residents Support <jmullins@techresidents.com>'

#Riak Session Cache
RIAK_HOST = 'localhost'

#Landing settings
LANDING_PLACEHOLDER = True

#Registration settings
REGISTRATION_REQUIRES_CODE = True

#Login using HTTPS. This is should only be used by the landing page which is http,
#but POSTS to the login page using https in non-development environments.
TR_LOGIN_USING_HTTPS = True
TR_XD_REMOTE = 'http://staging.techresidents.com:6767/static/js/easyXDM/cors/index.html'
