from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('chat.views',
    url(r'^$', 'list'),
    url(r'^create$', 'create'),
    url(r'^(?P<encoded_chat_session_id>\w+)$', 'chat'),
    url(r'^(?P<encoded_chat_session_id>\w+)/feedback$', 'feedback'),
)
