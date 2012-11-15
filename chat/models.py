from django.db import connection, models, transaction
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone

from techresidents_web.common.models import MimeType, Quality, Tag, Topic

class ChatSessionManager(models.Manager):
    """Chat session manager.

    Chat session manager extends models.Manager in order to provide
    helper methods for managing chat sessions.
    """

    def increment_participants(self, chat_session, max_participants=2):
        """Atomically increment chat sessions' number of participants.

        Helper method to atomically increment the ChatSession model's number
        of participant if it is currently less than max_participants.

        Args:
            chat_session: persisted ChatSession model object.
            max_participants: maximum number of participants allowed
                in the chat session.
        Returns:
            The updated number of participants upon success.
        Raises:
            RuntimerError if the maximum number of participants
            would be exceeded.
        """
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
        """Get or create a ChatUser model for the given user and session.

        Helper method to get the ChatUser model for the given
        user and chat session, or create a new one if required.
        This method respects the chat type, and the maximum number
        of allowed participants when creating a new ChatUser model.

        Args:
            user: User object
            chat_session: ChatSession model object.
        Returns:
            New ChatUser model object upon success, None otherewise.
        """
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
    """Chat type data model.

    Represents the various chat types:

    Fields:
        name: chat type name
        description: chat type description

    RESTRICTED:   Predetermined, site-registered, chat-registered participants.
    UNRESTRICTED: Non-predetermined, site-registered, chat-registered participants.
    PRIVATE:      Non-predetermined, site-registered, non-chat-registered participants.
    ANONYMOUS:    Non-predetermined, non-site-registered, non-chat-registered participants.
    """
    class Meta:
        db_table = "chat_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class Chat(models.Model):
    """Chat data model.

    Represents a chat on a specific topic, scheduled for a 
    specific time. Note that ChatSession models, not Chat models,
    are used to represent an instance of a chat. There can exist
    multiple ChatSession models for each Chat model.

    Fields:
        type: ChatType object
        topic: Topic object
        start: start datetime object
        end: end datetime object
        registration_start: datetime object containing the
            starting time when users will be allowed to
            register for this chat.
        registration_end: datetime object containing the
            ending time, after which, users will not be allowed
            to register for this chat.
        checkin_start: datetime object containing the starting
            time when users will be allowed to checkin for
            this chat.
        checkin_end: datetime object containing the ending
            time, after which, users will not be allowed
            to checkin for this chat.
    """
    class Meta:
        db_table = "chat"
    
    type = models.ForeignKey(ChatType, related_name="+")
    topic = models.ForeignKey(Topic, related_name="chats")
    start = models.DateTimeField()
    end = models.DateTimeField()
    registration_start = models.DateTimeField(null=True)
    registration_end = models.DateTimeField(null=True)
    checkin_start = models.DateTimeField(null=True)
    checkin_end = models.DateTimeField(null=True)
    record = models.BooleanField(default=False)
    
    @property
    def registration_open(self):
        """Helper method for determining if registration is currently open.

        Returns:
            True if registration is currently open, False othewise.
        """
        result = False
        if self.registration_start and self.registration_end:
            now = timezone.now()
            result = (now > self.registration_start) and (now < self.registration_end)
        return result

    @property
    def registration_closed(self):
        """Helper method for determining if registration is currently closed.

        Returns:
            True if registration is currently closed, False othewise.
        """
        result = False
        if self.registration_end:
            now = timezone.now()
            result = now > self.registration_end
        return result
    
    @property
    def checkin_open(self):
        """Helper method for determining if checkin is currently open.

        Returns:
            True if checkin is currently open, False othewise.
        """
        result = False
        if self.checkin_start and self.checkin_end:
            now = timezone.now()
            result = (now > self.checkin_start) and (now < self.checkin_end)
        return result

    @property
    def checkin_closed(self):
        """Helper method for determining if checkin is currently closed.

        Returns:
            True if checkin is currently closed, False othewise.
        """
        result = False
        if self.checkin_end:
            now = timezone.now()
            result = now > self.checkin_end
        return result

    @property
    def open(self):
        """Helper method for determining if chat is currently open.
        
        A chat is considered open if it is currently taking place.
        In other words, a chat is open if the Chat.start < now
        and chat.end > now.

        Returns:
            True if chat is currently open, False othewise.
        """
        result = False
        now = timezone.now()
        if self.start < now and self.end > now:
            result = True
        return result
    
    @property
    def pending(self):
        """Helper method for determining if chat is currently pending.
        
        A chat is considered pending if it is yet to start.

        Returns:
            True if chat is currently pending, False othewise.
        """
        result = False
        if self.start > timezone.now():
            result = True
        return result

    @property
    def expired(self):
        """Helper method for determining if chat is currently expired.
        
        Returns:
            True if chat is currently pending, False othewise.
        """
        result = False
        if self.end < timezone.now():
            result = True
        return result


class ChatRole(models.Model):
    """Chat role data model.

    This model is not currently used, and is acting as a placeholder
    for the future.

    Fields:
        role: chat role name
        description: chat role description
    """
    class Meta:
        db_table = "chat_role"

    role = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class ChatSession(models.Model):
    """Chat session data model.

    A ChatSession model objects represents a single
    instance of a chat. A chat session consists
    of a concrete Chat model and users.

    Fields:
        chat: Chat model object
        users: User objects
        token: unique chat session token used for authentication (Tokbox).
        participants: Number of users participating in the chat. Note that
            this a slight denormalization since this information
            can be derived from "users". This is necessary in order to
            allow atomic assignmet of users' to chat sessions.
        connect: datetime objected containing the time that the first 
            participant connected their video stream.
        publish: datetime objected containing the time that the first 
            participant published their video stream.
        start: datetime object containing the time the chat session started.
        end: datetime object containing the time the chat session ended.
    """
    class Meta:
        db_table = "chat_session"
    
    chat = models.ForeignKey(Chat, related_name="chat_sessions")
    users = models.ManyToManyField(User, through="ChatUser")
    token = models.CharField(max_length=1024, null=True, unique=True)
    participants = models.IntegerField(default=0)
    connect = models.DateTimeField(null=True)
    publish = models.DateTimeField(null=True)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)

    objects = ChatSessionManager()


class ChatRegistration(models.Model):
    """Chat registration data model.
    
    Fields:
        chat: Chat data model object
        user: User object
        chat_session: ChatSession data model object
        checked_in: boolean indicating if the user has checked in
            for the chat.
    """
    class Meta:
        db_table = "chat_registration"
    
    chat = models.ForeignKey(Chat, related_name="chat_registrations")
    user = models.ForeignKey(User, related_name="+")
    chat_session = models.ForeignKey(ChatSession, null=True, related_name="chat_registrations")
    checked_in = models.BooleanField(default=False)

class ChatUser(models.Model):
    """Chat user data model.

    Model links chat sessions to users, and also contains a few additional
    attributes such as the user's participant
    number and token.

    Fields:
        chat_session: ChatSession data model object
        user: User object
        token: user's chat session token for authentication.
        participant: user's participant number which uniquely
            identifies the user within the chat session.
            This is typically the order in which the user
            joined the chat session.
    """
    class Meta:
        db_table = "chat_user"
        unique_together = ("chat_session", "user")
    
    chat_session = models.ForeignKey(ChatSession, related_name="chat_users")
    user = models.ForeignKey(User, related_name="+")
    token = models.CharField(max_length=1024, null=True)
    participant = models.IntegerField()


class ChatMinute(models.Model):
    """Chat minute data model.
    
    This model is analagous to a meeting minute. It represents
    the discussion of a specific leaf-topic within the chat.

    Fields:
        chat_session: ChatSession data model object.
        topic: leaf Topic object
        start: datetime object containing the start time for the topic
        end: datetime object containing the end time for the topic
    """
    class Meta:
        db_table = "chat_minute"

    chat_session = models.ForeignKey(ChatSession, related_name="chat_minutes")
    topic = models.ForeignKey(Topic, related_name="chat_minutes")
    start = models.DateTimeField()
    end = models.DateTimeField(null=True)


class ChatTag(models.Model):
    """Chat tag data model.
    
    Fields:
        user: User object
        chat_minute: ChatMinute data model object
        tag: optional link to Tag data model object
        name: tag name
        deleted: boolean indicating that tag was
            deleted by the user.
    """
    class Meta:
        db_table = "chat_tag"
        unique_together = ("user", "chat_minute", "name")

    user = models.ForeignKey(User, related_name="+")
    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_tags")
    tag = models.ForeignKey(Tag, null=True, related_name="+")
    time = models.DateTimeField()
    name = models.CharField(max_length=1024)
    deleted = models.BooleanField(default=False)


class ChatArchiveType(models.Model):
    """Chat archive type data model.
    
    Fields:
        name: chat archive type name
        description: chat archive type description
    """
    class Meta:
        db_table = "chat_archive_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class ChatArchive(models.Model):
    """Chat archive data model.

    Represents a media archive file of a past chat. The media
    archive may be the merged/anonymized audio stream,
    or one of the original raw video streams.

    Fields:
        type: ChatArchiveType object
        chat_session: ChatSession data model object.
        mime_type: MimeType data model object.
        path: relative media archive file path
        users: User objects for all users on the
            media archive file. This will be equivalent
            to the ChatSession.users for the merged
            media file, and a single user for the
            raw video stream files.
        public: boolean indicating if the stream is public.
            This should be set to true if the stream
            has been anonymized.
        length: stream length in milliseconds
        offset: stream offset in milliseconds.
            This is only applicable for non-merged
            streams.
    """
    class Meta:
        db_table = "chat_archive"

    type = models.ForeignKey(ChatArchiveType, related_name="+")
    chat_session = models.ForeignKey(ChatSession, related_name="chat_archives")
    mime_type = models.ForeignKey(MimeType, related_name="+")
    path = models.FileField(upload_to="archives", max_length=1024)
    users = models.ManyToManyField(User, through="ChatArchiveUser", related_name="archives+")
    public = models.BooleanField(default=False)
    length = models.IntegerField(null=True)
    offset = models.IntegerField(null=True)

class ChatArchiveUser(models.Model):
    """Chat archive user data model.

    Linking table for chat archives and users. Note
    that this model explicit in order to for the
    naming of the chat_archive_id column.
    """
    class Meta:
        db_table = "chat_archive_user"

    chat_archive = models.ForeignKey(ChatArchive, related_name="+")
    user = models.ForeignKey(User, related_name="+")

class ChatFeedback(models.Model):
    """Chat feedback data model.

    Fields:
        chat_session: Chat session data model object
        user: User object
        overall_quality: Quality object
        technical_quality: Quality object
    """
    class Meta:
        db_table = "chat_feedback"
        unique_together = ("chat_session", "user")

    chat_session = models.ForeignKey(ChatSession, related_name="chat_feedbacks")
    user = models.ForeignKey(User)
    overall_quality = models.ForeignKey(Quality, related_name="+")
    technical_quality = models.ForeignKey(Quality, related_name="+")


class ChatArchiveJob(models.Model):
    """Chat archive job data model.
    
    Represents a job for archivesvc.

    Fields:
        chat_session: ChatSession data model object
        created: datetime object containing the time
            the job was created.
        not_before: datetime object containing the 
            earliest time that the job should be
            started.
        start: datetime object containing the time
            the job started.
        end: datetime object containing the time
            the job ended.
        successful: boolean indicating that the job
            was successfully completed.
        retries_remaining: number of retries remaining
            for the job.
    """
    class Meta:
        db_table = "chat_archive_job"

    chat_session = models.ForeignKey(ChatSession, related_name="+")
    created = models.DateTimeField(auto_now_add=True)
    not_before = models.DateTimeField(auto_now_add=True)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    owner = models.CharField(null=True, max_length=1024)
    successful = models.NullBooleanField(null=True)
    retries_remaining = models.IntegerField()


class ChatScheduleJob(models.Model):
    """Chat schedule job data model.

    Users checking in to an UNRESTRICTED or ANONYMOUS chat are
    dynamically assigned to chat sessions by schedulesvc.
    This model represents a schedulesvc job for the given
    chat.

    Jobs are created by schedulesvc when it detects that
    the checkin period for an UNRESTRICTED or ANONYMOUS
    chat has ended. The creation of the job record is
    for auditability and also to mark ownership of a 
    specific chat, and inform other schedulesvc instances
    that this chat is already being scheduled.

    Fields:
        chat: Chat data model object
        start: datetime object containing the time the scheduling
            job started.
        end: datetime object containing the time the scheduling
            job ended.
    """
    class Meta:
        db_table = "chat_schedule_job"

    chat = models.ForeignKey(Chat, related_name="+", unique=True)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(null=True)


class ChatPersistJob(models.Model):
    """Chat persist job data model.
    
    Represents a job for persistsvc.

    Fields:
        chat_session: ChatSession data model object
        created: datetime object containing the time
            the job was created.
        start: datetime object containing the time
            the job started.
        end: datetime object containing the time
            the job ended.
        successful: boolean indicating that the job
            was successfully completed.
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
    """ Chat speaking marker data model.

    Marker indicating an interval for which the specified user was speaking.

    Fields:
        user: User object.
        chat_minute: ChatMinute data model object
        start: datetime object containing the time the user started speaking
        end: datetime object containing the time the user stopped speaking
    """
    class Meta:
        db_table = "chat_speaking_marker"

    user = models.ForeignKey(User)
    chat_minute = models.ForeignKey(ChatMinute, related_name="chat_speaking_markers")
    start = models.DateTimeField()
    end = models.DateTimeField()


class ChatMessageType(models.Model):
    """Chat message type data model.

    Chat service messages are persisted in order to allow for
    post-chat analytics and rich chat playback. Each chat message
    is of a specific type. This model represents those types.

    Fields:
        name: chat message type name
        description: chat message type description
    """
    class Meta:
        db_table = "chat_message_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class ChatMessageFormatType(models.Model):
    """Chat message format type data model.
        
    Chat messages are persisted in various formats (THRIFT, JSON, etc...).
    This model represents the chat message's format type.

    Fields:
        name: chat message format type name
        description: chat message format type description
    """
    class Meta:
        db_table = "chat_message_format_type"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)


class ChatMessageManager(models.Manager):
    """Custom Chat Message Manager.

    Clients reading chat messages from the db will most likely only need
    chat message data in one format.  This manager provides methods
    to make accessing the supported formats easier.
    """
    def json(self):
        return self.get_query_set().filter(type__name='JSON')

    def thrift(self):
        return self.get_query_set().filter(type__name='THRIFT')


class ChatMessage(models.Model):
    """Chat message data model.

    Chat service messages are peristed in order to allow for
    post-chat analytics and rich chat playback.

    Fields:
        message_id: chatsvc unique message id
        chat_session: ChatSession data model object
        type: ChatMessageType data model object
        format_type: ChatMessageFormatType data model object.
        timestamp: chatsvc message epoch timestamp
        time: message datatime object
        data: message data
    """
    class Meta:
        db_table = "chat_message"

    objects = ChatMessageManager()
    message_id = models.CharField(max_length=1024, unique=True)
    chat_session = models.ForeignKey(ChatSession, related_name="chat_messages")
    type = models.ForeignKey(ChatMessageType, related_name="+")
    format_type = models.ForeignKey(ChatMessageFormatType)
    timestamp = models.FloatField()
    time = models.DateTimeField()
    data = models.TextField()
