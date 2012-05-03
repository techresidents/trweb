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
    
    url(r'^$', 'common.views.landing'),
    url(r'^learn_more$', 'common.views.learn_more'),
    url(r'^about$', 'common.views.about'),
    url(r'^contact$', 'common.views.contact'),
    url(r'^version$', 'common.views.version'),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^chat/', include('chat.urls')),
    url(r'^document/', include('document.urls')),
    url(r'^topic/', include('topic.urls')),
    url(r'^whiteboard/', include('whiteboard.urls')),

)

#This is for development purposes only.
#It will only work if DEBUG is set to true.
urlpatterns += staticfiles_urlpatterns()
