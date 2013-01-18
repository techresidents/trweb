from django.conf.urls import patterns, url

urlpatterns = patterns('compat.views',
    url(r'^$', 'compat'),
)
