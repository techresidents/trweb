from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('topic.views',
    url(r'^create/$', 'create'),
    url(r'^(?P<encoded_topic_id>\w+)/$', 'details'),
)
