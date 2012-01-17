#Integration settings
from techresidents_web.settings import *

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',     # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': 'localdev_techresidents',                       # Or path to database file if using sqlite3.
        'USER': 'techresidents',                                # Not used with sqlite3.
        'PASSWORD': 'techresidents',                            # Not used with sqlite3.
        'HOST': 'localdev',                                     # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '5432',                                         # Set to empty string for default. Not used with sqlite3.
    }
}
