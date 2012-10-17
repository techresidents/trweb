from django.conf import settings
from django.conf.urls.defaults import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),

    url(r'^home/', include('home.urls')),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^chat/', include('chat.urls')),
    url(r'^topic/', include('topic.urls')),
    url(r'^learn_more$', 'common.views.learn_more'),
    url(r'^about$', 'common.views.about'),
    url(r'^contact$', 'common.views.contact'),
    url(r'^version$', 'common.views.version'),
    url(r'^document/', include('document.urls')),
    url(r'^whiteboard/', include('whiteboard.urls')),
    url(r'^talent/.*', include('talent.urls')),
)

#Error handlers
handler404 = 'common.views.http404'
handler403 = 'common.views.http403'
handler500 = 'common.views.http500'

#Landing page
if settings.LANDING_PLACEHOLDER:
    urlpatterns += patterns('', url(r'^$', 'common.views.landing_placeholder'))
else:
    urlpatterns += patterns('', url(r'^$', 'common.views.landing'))

#This is for development purposes only.
#It will only work if DEBUG is set to true.
#urlpatterns += staticfiles_urlpatterns()
