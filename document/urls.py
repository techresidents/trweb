from django.conf.urls import patterns, url

urlpatterns = patterns('document.views',
    url(r'^upload/$', 'upload'),
    url(r'^(?P<document_id>\d+)$', 'view'),
    url(r'^embed/(?P<document_id>\d+)$', 'embed'),
    url(r'^download/(?P<document_id>\d+)$', 'download'),
)
