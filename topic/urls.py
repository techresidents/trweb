from django.conf.urls import patterns, url

urlpatterns = patterns('topic.views',
    url(r'^create/$', 'create'),
)
