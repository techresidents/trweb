from django.db import models
from django.contrib.auth.models import User

from techresidents_web.common.models import Resource, Tag, Topic

class Chat(models.Model):
    class Meta:
        db_table = "chat"

    topic = models.ForeignKey(Topic, related_name="chats")
    start = models.DateTimeField()
    end = models.DateTimeField()

class ChatRole(models.Model):
    class Meta:
        db_table = "chat_role"

    role = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class ChatSession(models.Model):
    class Meta:
        db_table = "chat_session"
    
    chat = models.ForeignKey(Chat, related_name="chat_sessions")
    users = models.ManyToManyField(User, through="ChatUser")
    token = models.CharField(max_length=1024, null=True)
    participants = models.IntegerField(default=0)
    resources = models.ManyToManyField(Resource)

class ChatRegistration(models.Model):
    class Meta:
        db_table = "chat_registration"
    
    chat = models.ForeignKey(Chat, related_name="chat_registrations")
    user = models.ForeignKey(User)
    chat_session = models.ForeignKey(ChatSession, null=True)

class ChatUser(models.Model):
    class Meta:
        db_table = "chat_user"
    
    chat_session = models.ForeignKey(ChatSession, related_name="chat_users")
    user = models.ForeignKey(User)
    token = models.CharField(max_length=1024, null=True)

class ChatMinute(models.Model):
    class Meta:
        db_table = "chat_minute"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_minutes")
    start = models.IntegerField(),
    end = models.IntegerField(null=True),

class ChatTag(models.Model):
    class Meta:
        db_table = "chat_tag"

    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_tags")
    tag = models.ForeignKey(Tag)

class ChatArchive(models.Model):
    class Meta:
        db_table = "chat_archive"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_archives")

class ChatFeedback(models.Model):
    class Meta:
        db_table = "chat_feedback"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_feedbacks")
    user = models.ForeignKey(User)

