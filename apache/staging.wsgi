import os
import sys
import site

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))

#Add virtualenv site-packages to the path
#Note we also need to set WSGIPythonHome to a baseline python installation
#with no modules to ensure that allpython  modules will be picked up from 
#our virtualenv. This is best accomplished by making another virtualenv
#for the baseline install and using this for WGSIPythonHome.
#Also note that this is equivalent to setting python-path on WSGIDaemonProcess.

site_packages = os.path.join(PROJECT_ROOT, 'env/lib/python2.7/site-packages')
site.addsitedir(site_packages)

#Add PROJECT_ROOT to path to pick up app specific module (setting, etc...)
#And also add back a directory from PROJECT_ROOT so modules can be
#picked up using 'project.module'.
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.abspath(os.path.join(PROJECT_ROOT, "../")))
#print sys.path

#Configure settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'staging_settings'

import django.core.handlers.wsgi
application = django.core.handlers.wsgi.WSGIHandler()
