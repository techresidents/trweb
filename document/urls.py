from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('document.views',
    url(r'^upload/$', 'upload'),
    url(r'^viewer/(?P<document_id>\d+)$', 'viewer'),
)
