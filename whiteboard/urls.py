from django.conf.urls import patterns, include, url

urlpatterns = patterns('whiteboard.views',
    url(r'^$', 'whiteboard'),
)
