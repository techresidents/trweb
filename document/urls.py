from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('document.views',
    url(r'^(?P<document_id>\d+)$', 'download'),
    url(r'^upload/$', 'upload'),
    url(r'^viewer/(?P<document_id>\d+)$', 'viewer'),
)
