from django.db import connection, models, transaction
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

from techresidents_web.common.models import Quality, Tag, Topic

class ChatSessionManager(models.Manager):
    
    def increment_participants(self, chat_session, max_participants=4):
        cursor = connection.cursor()
        cursor.execute("""UPDATE chat_session SET participants = participants+1
                    WHERE id = %s and participants < %s
                    RETURNING participants""", [chat_session.id, max_participants])
        transaction.commit_unless_managed()
        participants = cursor.fetchone()
        if participants is None:
            raise RuntimeError("max participants exceeded")

        return participants[0]

    def get_or_create_chat_user(self, user, chat_session):
        for chat_user in chat_session.chat_users.select_related("user").all():
            if chat_user.user.id == user.id:
                return chat_user

        result = None
        chat_type = chat_session.chat.type
        if chat_type.name == "PRIVATE":
            try:
                participants = self.increment_participants(chat_session)
                result = chat_session.chat_users.create(user=user, participant=participants)
            except:
                pass
        elif chat_type.name == "ANONYMOUS":
            try:
                participants = self.increment_participants(chat_session)
                if not user.is_anonymous():
                    result = chat_session.chat_users.create(user=user, participant=participants)
                else:
                    #Even if the user is anonymous, we still want to associated the ChatUser record
                    #with a proper User record. Additionally, the user id should be unique for
                    #this chat. To accomplish we take the nth anonymous user account from the
                    #settings, where n is the participant number.
                    anonymous_user = User.objects.get(username=settings.ANONYMOUS_USERNAMES[participants - 1])
                    result = chat_session.chat_users.create(user=anonymous_user, participant=participants)
            except:
                pass

        return result;

class ChatType(models.Model):
    class Meta:
        db_table = "chat_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class Chat(models.Model):
    class Meta:
        db_table = "chat"
    
    type = models.ForeignKey(ChatType)
    topic = models.ForeignKey(Topic, related_name="chats")
    start = models.DateTimeField()
    end = models.DateTimeField()
    registration_start = models.DateTimeField(null=True)
    registration_end = models.DateTimeField(null=True)
    checkin_start = models.DateTimeField(null=True)
    checkin_end = models.DateTimeField(null=True)
    
    @property
    def registration_open(self):
        result = False
        if self.registration_start and self.registration_end:
            now = timezone.now()
            result = (now > self.registration_start) and (now < self.registration_end)
        return result

    @property
    def registration_closed(self):
        result = False
        if self.registration_end:
            now = timezone.now()
            result = now > self.registration_end
        return result
    
    @property
    def checkin_open(self):
        result = False
        if self.checkin_start and self.checkin_end:
            now = timezone.now()
            result = (now > self.checkin_start) and (now < self.checkin_end)
        return result

    @property
    def checkin_closed(self):
        result = False
        if self.checkin_end:
            now = timezone.now()
            result = now > self.checkin_end
        return result

    @property
    def open(self):
        result = False
        now = timezone.now()
        if self.start < now and self.end > now:
            result = True
        return result
    
    @property
    def pending(self):
        result = False
        if self.start > timezone.now():
            result = True
        return result

    @property
    def expired(self):
        result = False
        if self.end < timezone.now():
            result = True
        return result

class ChatRole(models.Model):
    class Meta:
        db_table = "chat_role"

    role = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class ChatSession(models.Model):
    class Meta:
        db_table = "chat_session"
    
    chat = models.ForeignKey(Chat, related_name="chat_sessions")
    users = models.ManyToManyField(User, through="ChatUser")
    token = models.CharField(max_length=1024, null=True, unique=True)
    participants = models.IntegerField(default=0)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)

    objects = ChatSessionManager()

class ChatRegistration(models.Model):
    class Meta:
        db_table = "chat_registration"
    
    chat = models.ForeignKey(Chat, related_name="chat_registrations")
    user = models.ForeignKey(User)
    chat_session = models.ForeignKey(ChatSession, null=True, related_name="chat_registrations")
    checked_in = models.BooleanField(default=False)

class ChatUser(models.Model):
    class Meta:
        db_table = "chat_user"
    
    chat_session = models.ForeignKey(ChatSession, related_name="chat_users")
    user = models.ForeignKey(User)
    token = models.CharField(max_length=1024, null=True)
    participant = models.IntegerField()

class ChatMinute(models.Model):
    class Meta:
        db_table = "chat_minute"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_minutes")
    topic = models.ForeignKey(Topic, related_name="chat_minutes")
    start = models.DateTimeField()
    end = models.DateTimeField(null=True)

class ChatTag(models.Model):
    class Meta:
        db_table = "chat_tag"
        unique_together = ("user", "chat_minute", "name")

    user = models.ForeignKey(User)
    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_tags")
    tag = models.ForeignKey(Tag, null=True)
    name = models.CharField(max_length=1024)
    deleted = models.BooleanField(default=False)

class ChatArchive(models.Model):
    class Meta:
        db_table = "chat_archive"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_archives")

class ChatFeedback(models.Model):
    class Meta:
        db_table = "chat_feedback"
        unique_together = ("chat_session", "user")

    chat_session = models.ForeignKey(ChatSession, related_name="chat_feedbacks")
    user = models.ForeignKey(User)
    overall_quality = models.ForeignKey(Quality, related_name="+")
    technical_quality = models.ForeignKey(Quality, related_name="+")

class ChatScheduleJob(models.Model):
    class Meta:
        db_table = "chat_schedule_job"

    chat = models.ForeignKey(Chat, related_name="+", unique=True)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(null=True)

class ChatPersistJob(models.Model):
    """ Represents a job queue for work to be completed by the
        chat persistence service.
    """
    class Meta:
        db_table = "chat_persist_job"

    chat_session = models.ForeignKey(ChatSession, related_name="+", unique=True)
    created = models.DateTimeField(auto_now_add=True)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    owner = models.CharField(null=True, max_length=1024)
    successful = models.NullBooleanField(null=True)

class ChatSpeakingMarker(models.Model):
    """ Represents a record of which user was speaking during
        a chat minute.
    """
    class Meta:
        db_table = "chat_speaking_marker"

    user = models.ForeignKey(User)
    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_speaking_markers")
    start = models.DateTimeField()
    end = models.DateTimeField()

class ChatMessageType(models.Model):
    """ Represents a chat message type.
    """
    class Meta:
        db_table = "chat_message_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class ChatMessageFormatType(models.Model):
    """ Represents a chat message format.

        Chat message binary blobs are persisted within
        the ChatMessage model.  This entity identifies
        the format of the persisted binary data.
    """
    class Meta:
        db_table = "chat_message_format_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class ChatMessageManager(models.Manager):
    """ Custom Chat Message Manager.

        Clients reading chat messages from the db
        will most likely only need chat message data
        in one format.  This manager provides methods
        to make accessing the supported formats easier.
    """
    def json(self):
        return self.get_query_set().filter(type__name='JSON')

    def thrift(self):
        return self.get_query_set().filter(type__name='THRIFT')

class ChatMessage(models.Model):
    """ Represents a chat message.

        Chat messages have associated types and formats.
        The type is used to determine what purpose the
        message had; the format is used to determine how
        the binary message is stored within the data TextField.

        The timestamp is stored as a DecimalField to facilitate
        ordering and debugging, as this attribute is used in the
        js layer.
    """
    class Meta:
        db_table = "chat_message"

    objects = ChatMessageManager()
    message_id = models.CharField(max_length=1024, unique=True)
    chat_session = models.ForeignKey(ChatSession, related_name="chat_messages")
    type = models.ForeignKey(ChatMessageType)
    format_type = models.ForeignKey(ChatMessageFormatType)
    timestamp = models.FloatField()
    time = models.DateTimeField()
    data = models.TextField()
