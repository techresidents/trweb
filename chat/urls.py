from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('chat.views',
    url(r'^$', 'list'),
    url(r'^(?P<encoded_chat_session_id>\w+)$', 'chat'),
    url(r'^(?P<encoded_chat_session_id>\w+)/feedback$', 'feedback'),
    url(r'^create/$', 'create'),
)
