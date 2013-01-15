from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('compat.views',
    url(r'^$', 'compat'),
)
