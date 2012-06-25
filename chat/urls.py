from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('chat.views',
    url(r'^$', 'home'),
    url(r'^create$', 'create'),
    url(r'^(?P<encoded_chat_id>\w+)/register$', 'register'),
    url(r'^(?P<encoded_chat_id>\w+)/checkin$', 'checkin'),
    url(r'^(?P<encoded_chat_id>\w+)/wait$', 'wait'),
    url(r'^session/(?P<encoded_chat_session_id>\w+)$', 'session'),
    url(r'^session/(?P<encoded_chat_session_id>\w+)/wait$', 'session_wait'),
    url(r'^session/(?P<encoded_chat_session_id>\w+)/feedback$', 'session_feedback'),
)
