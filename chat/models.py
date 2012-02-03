from django.db import models
from django.contrib.auth.models import User

from common.models import Tag, Topic

class Chat(models.Model):
    class Meta:
        db_table = "chat"

    #users = models.ManyToManyField(User, db_table="chat_user")
    users = models.ManyToManyField(User, through="ChatUser")
    topic = models.ForeignKey(Topic)
    chat_session_id = models.CharField(max_length=100, null=True)
    start = models.DateTimeField()
    end = models.DateTimeField()

class ChatUser(models.Model):
    class Meta:
        db_table = "chat_user"
    
    chat = models.ForeignKey(Chat)
    user = models.ForeignKey(User)
    token = models.CharField(max_length=1024, null=True)

class Minute(models.Model):
    chat = models.ForeignKey(Chat)
    start = models.IntegerField(),
    end = models.IntegerField(),

class MinuteTag(models.Model):
    minute = models.ForeignKey(Minute)
    tag = models.ForeignKey(Tag)
