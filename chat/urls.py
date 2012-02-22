from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('chat.views',
    url(r'^$', 'list'),
    url(r'^(?P<chat_session_id>\d+)$', 'chat'),
    url(r'^create/$', 'create'),
)
