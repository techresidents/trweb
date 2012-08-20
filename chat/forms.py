import datetime

from django import forms
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

import OpenTokSDK

from techresidents_web.common.forms import EmailListField
from techresidents_web.common.models import Quality, Topic
from techresidents_web.chat.models import Chat, ChatFeedback, ChatRegistration, ChatSession, ChatType, ChatUser

class CreateChatForm(forms.Form):
    TYPE_CHOICES = (
        ("RESTRICTED", "Restricted"),
        ("UNRESTRICTED", "Unrestricted"),
        ("PRIVATE", "Private"),
        ("ANONYMOUS", "Anonymous")
    )

    type = forms.ChoiceField(label="Type", choices=TYPE_CHOICES, required=True)
    start = forms.DateTimeField(label="Start", required=True)
    topic = forms.CharField(label="Topic", max_length=255, required=True)
    users = EmailListField(label="Usernames", max_length=1024, required=True)

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        super(CreateChatForm, self).__init__(*args, **kwargs)
    
    def clean_type(self):
        type = self.cleaned_data["type"]
        try:
            type = ChatType.objects.get(name=type)
        except:
            raise forms.ValidationError("Invalid type")
        return type

    def clean_topic(self):
        topic = self.cleaned_data["topic"]
        try:
            topic = Topic.objects.get(title__iexact=topic, parent__exact=None)
        except:
            raise forms.ValidationError("Invalid topic")
        return topic

    def clean_users(self):
        users = []

        type = self.cleaned_data["type"]
        usernames = self.cleaned_data["users"]

        if type.name == "RESTRICTED" and len(usernames) < 2:
            raise forms.ValidationError("Restricted chats require at least 2 usernames")

        for username in usernames:
            try:
                user = User.objects.get(username=username)
                users.append(user)
            except User.DoesNotExist:
                raise forms.ValidationError("One or more usernames does not exist")
        return users

    def save(self):
        type = self.cleaned_data["type"]
        start = self.cleaned_data["start"]
        topic = self.cleaned_data["topic"]
        users = self.cleaned_data["users"]
        
        chat = None
        chat_session = None
        
        if type.name == "RESTRICTED":
            #Restricted chats are restricted to the specified users only.
            #i.e. Chats with predetermined, site-registered, chat-registered users
            #So we need to create the ChatSession for this chat, as well as,
            #ChatRegistrations and ChatUser entries for each participant.
            
            #create chat
            chat = Chat.objects.create(
                    type=type,
                    topic=topic,
                    start=start,
                    end=start+datetime.timedelta(minutes=topic.duration)) 

            #Create the tokbox session
            opentok = OpenTokSDK.OpenTokSDK(
                    settings.TOKBOX_API_KEY,
                    settings.TOKBOX_API_SECRET, 
                    settings.TOKBOX_IS_STAGING) 
            
            #IP passed to tokbox when session is created will be used to determine
            #tokbox server location for chat session. Note that tokboxchat sessions
            #never expire. But tokbox user chat tokens can be set to expire.
            session = opentok.create_session(self.request.META['REMOTE_ADDR'])
            
            #create the chat session with associated tokbox session token.
            chat_session = ChatSession.objects.create(chat=chat, token=session.session_id, participants=len(users)) 
           
            #Create ChatRegistration / ChatUser entries for each participant
            #Note that ChatUser's are created with a tokbox token.
            #This token will be generated when the user joins the chat.
            for index, user in enumerate(users):
                ChatUser.objects.create(chat_session=chat_session, user=user, participant=index+1)
                ChatRegistration.objects.create(chat=chat, user=user, chat_session=chat_session, checked_in=True)

        elif type.name == "UNRESTRICTED":
            #Unrestricted chats are open and not restricted to specified users.
            #i.e. Chats with non-predetermined, site-registered, chat-registered users.
            #As a convenience, we will create ChatRegistrations for the specified
            #users. Note that ChatSession's will not be created for this chat, instead
            #they will be created on an as-needed basis when users arrive for this
            #chat.

            #create chat
            chat = Chat.objects.create(
                    type=type,
                    topic=topic,
                    start=start,
                    end=start+datetime.timedelta(minutes=topic.duration),
                    registration_start=timezone.now(),
                    #registration_end=start-datetime.timedelta(hours=1),
                    registration_end=start-datetime.timedelta(minutes=2),
                    checkin_start=start-datetime.timedelta(minutes=15),
                    checkin_end=start)

            for user in users:
                ChatRegistration.objects.create(chat=chat, user=user, checked_in=False)

        elif type.name == "PRIVATE" or type.name == "ANONYMOUS":
            #Private / Anonymous chats allow access to chats
            #as long as the chat session id is known. The first
            #n users to access the chat session will be granted
            #access. Anonymous chats do not require participants
            #to be site-registered, while private chats do.

            #create chat
            chat = Chat.objects.create(
                    type=type,
                    topic=topic,
                    start=start,
                    end=start+datetime.timedelta(minutes=topic.duration)) 

            #Create the tokbox session
            opentok = OpenTokSDK.OpenTokSDK(
                    settings.TOKBOX_API_KEY,
                    settings.TOKBOX_API_SECRET, 
                    settings.TOKBOX_IS_STAGING) 
            
            session = opentok.create_session(self.request.META['REMOTE_ADDR'])
            chat_session = ChatSession.objects.create(chat=chat, token=session.session_id) 



        return (chat, chat_session)
        

class ChatFeedbackForm(forms.Form):

    QUALITY_CHOICES = (
        ("EXCELLENT", "Excellent"),
        ("GOOD", "Good"),
        ("AVERAGE", "Average"),
        ("FAIR", "Fair"),
        ("POOR", "Poor"),
    )

    overall_quality = forms.ChoiceField(choices=QUALITY_CHOICES)
    technical_quality = forms.ChoiceField(choices=QUALITY_CHOICES)

    def __init__(self, request=None, chat_session_id=None, *args, **kwargs):
        self.request = request
        self.chat_session_id = chat_session_id

        super(ChatFeedbackForm, self).__init__(*args, **kwargs)
    
    def clean(self):
        try:
            ChatSession.objects.select_related("chat").get(
                    id=self.chat_session_id,
                    users=self.request.user,
                    chat__start__lte=timezone.now())

            if ChatFeedback.objects.filter(
                    user_id=self.request.user.id,
                    chat_session_id=self.chat_session_id).exists():
                raise forms.ValidationError("Chat feedback already exists")

            return self.cleaned_data

        except ChatSession.DoesNotExist:
            raise forms.ValidationError("Chat session invalid")

    def save(self, commit=True):
        #Map quality names to models
        quality_map = {}
        for quality in  Quality.objects.all():
            quality_map[quality.name] = quality
        
        overall_quality = quality_map[self.cleaned_data["overall_quality"]]
        technical_quality = quality_map[self.cleaned_data["technical_quality"]]

        feedback = ChatFeedback(
                chat_session_id=self.chat_session_id,
                user_id=self.request.user.id,
                overall_quality=overall_quality,
                technical_quality=technical_quality)
        
        if(commit):
            feedback.save()
        
        return feedback



