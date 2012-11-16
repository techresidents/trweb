# Django settings for techresidents_web project.
import os
import django.conf.global_settings as GLOBAL_SETTINGS

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        #'ENGINE': 'sqlite3', # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'localdev_techresidents',                   # Or path to database file if using sqlite3.
        'USER': 'techresidents',                            # Not used with sqlite3.
        'PASSWORD': 'techresidents',                        # Not used with sqlite3.
        'HOST': 'localdev',                                 # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '5432',                                     # Set to empty string for default. Not used with sqlite3.
    }
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'US/Eastern'
USE_TZ = True

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = '/tmp/media/'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = 'http://localhost:8000/'

# The file storage engine to use with staticfiles static template tag.
# Additionally the post_process method will be called during
# the collectstatic process, so static files can be properly 
# distributed (filesystem, cloud, etc...)
#STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.CachedStaticFilesStorage'

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/home/media/media.lawrence.com/static/"
STATIC_ROOT = os.path.join(os.path.dirname(__file__), 'static_collected')

# URL prefix for static files.
# Example: "http://media.lawrence.com/static/"
STATIC_URL = '/static/'

# URL prefix for admin static files -- CSS, JavaScript and images.
# Make sure to use a trailing slash.
# Examples: "http://foo.com/static/admin/", "/static/admin/".
ADMIN_MEDIA_PREFIX = '/static/admin/'

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(os.path.dirname(__file__), 'static'),
)

# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = '9fm2xbrkfogfjmpmjpaq_ul=)$7-0gez(!dz*h@@3=exc^o26*'

# Custom context processors used to make custom data available
# to the template context.
TEMPLATE_CONTEXT_PROCESSORS = GLOBAL_SETTINGS.TEMPLATE_CONTEXT_PROCESSORS + (
    'techresidents_web.common.context_processors.tr_processors',
)

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

AUTH_PROFILE_MODULE = 'accounts.UserProfile'
LOGIN_REDIRECT_URL = '/home'
LOGIN_URL = '/accounts/login/'
LOGOUT_URL = '/accounts/logout/'

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.transaction.TransactionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'techresidents_web.common.middleware.TimezoneMiddleware',
    'techresidents_web.common.middleware.TLSRequestMiddleware',
)

ROOT_URLCONF = 'techresidents_web.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(os.path.dirname(__file__), 'templates'),
)

INSTALLED_APPS = (
    #Patches must be applied before any other apps are loaded
    'techresidents_web.patch',

    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    # Uncomment the next line to enable the admin:
    # 'django.contrib.admin',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    
    'techresidents_web.common',
    'techresidents_web.accounts',
    'techresidents_web.chat',
    'techresidents_web.codeboard',
    'techresidents_web.document',
    'techresidents_web.feedback',
    'techresidents_web.home',
    'techresidents_web.job',
    'techresidents_web.topic',
    'techresidents_web.whiteboard',
    'techresidents_web.talent',
    'techresidents_web.cloudfiles_storage',
    'techresidents_web.notification',
)


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
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'stream': 'ext://sys.stdout'
        },
        'tr_web_file_handler': {
            'level': 'DEBUG',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'verbose',
            'filename': 'techresidents_web.default.log',
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
            'level':'DEBUG'
        },
        'django.request': {
            'handlers': ['tr_web_file_handler'],
            'propagate': False,
            'level': 'DEBUG'
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
        'level':'DEBUG'
    }
}


#Session settings
SESSION_COOKIE_AGE = 1209600  #2 weeks

#Riak Session Cache
import riak
SESSION_ENGINE = 'riak_sessions.backends.cache'
RIAK_HOST = 'localdev'
RIAK_PORT = 8087
RIAK_TRANSPORT_CLASS = riak.RiakPbcTransport
RIAK_SESSION_BUCKET = 'tr_sessions'
RIAK_SESSION_KEY = '%(session_key)s'

#Cloudfiles 
DEFAULT_FILE_STORAGE = 'techresidents_web.cloudfiles_storage.storage.CloudfilesStorage'
CLOUDFILES_USERNAME = 'trdev'
CLOUDFILES_PASSWORD = 'B88mMJqh'
CLOUDFILES_CONTAINER_NAME = "trdev_public"
CLOUDFILES_SERVICENET = False
CLOUDFILES_TIMEOUT = 5
CLOUDFILES_CREATE_CONTAINER = False

#Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
#EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'localhost'
EMAIL_PORT = 25
#EMAIL_HOST_USER = 'user'
#EMAIL_HOST_PASSWORD = 'password'
DEFAULT_FROM_EMAIL = 'Tech Residents Support <support@techresidents.com>'
DEFAULT_SUPPORT_EMAIL = 'Tech Residents Support <support@techresidents.com>'
DEFAULT_FEEDBACK_EMAIL = 'Tech Residents Feedback <feedback@techresidents.com>'

#Landing settings
LANDING_PLACEHOLDER = False

#Registration settings
REGISTRATION_REQUIRES_CODE = False

#Tech Residents specific settings
#Login using HTTPS. This is should only be used by the landing page which is http,
#but POSTS to the login page using https in non-development environments.
TR_LOGIN_USING_HTTPS = False

#Set the location of the cross domain (XD) server for use with easyXDM.
TR_XD_REMOTE = 'http://localhost:6767/static/js/easyXDM/cors/index.html'
#TR_XD_REMOTE = 'http://iville.local:6767/static/js/easyXDM/cors/index.html'

#Google Analytics
GA_ID = 'UA-36319157-2'

#Tokbox settings
TOKBOX_API_KEY = '15889991'
TOKBOX_API_SECRET = '19a6fb225790a2cf3e048c58ef2fdcc425e7b599'
TOKBOX_JS_URL = 'http://static.opentok.com/v0.91/js/TB.min.js'

#Django message settings
#MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'
MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

#Anonymous Usernames
ANONYMOUS_USERNAMES = [
    'anonymous1@techresidents.com',
    'anonymous2@techresidents.com',
    'anonymous3@techresidents.com',
    'anonymous4@techresidents.com',
    'anonymous5@techresidents.com',
    'anonymous6@techresidents.com',
    'anonymous7@techresidents.com',
    'anonymous8@techresidents.com',
    'anonymous9@techresidents.com',
    'anonymous10@techresidents.com',
]
