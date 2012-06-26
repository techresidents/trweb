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
    name = models.CharField(max_length=100)
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

    role = models.CharField(max_length=100)
    description = models.CharField(max_length=1024)

class ChatSession(models.Model):
    class Meta:
        db_table = "chat_session"
    
    chat = models.ForeignKey(Chat, related_name="chat_sessions")
    users = models.ManyToManyField(User, through="ChatUser")
    token = models.CharField(max_length=1024, null=True)
    participants = models.IntegerField(default=0)

    objects = ChatSessionManager()

class ChatRegistration(models.Model):
    class Meta:
        db_table = "chat_registration"
    
    chat = models.ForeignKey(Chat, related_name="chat_registrations")
    user = models.ForeignKey(User)
    chat_session = models.ForeignKey(ChatSession, null=True)
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
    start = models.IntegerField(),
    end = models.IntegerField(null=True),

class ChatTag(models.Model):
    class Meta:
        db_table = "chat_tag"
    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_tags")
    tag = models.ForeignKey(Tag, null=True)
    name = models.CharField(max_length=1024)

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

