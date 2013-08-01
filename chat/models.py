from django.db import connection, models, transaction
from django.contrib.auth import get_user_model

from techresidents_web.common.models import MimeType, Topic

User = get_user_model()

class ChatManager(models.Manager):
    """Chat session manager.

    Chat manager extends models.Manager in order to provide
    helper methods for managing chats.
    """

    def increment_participants(self, chat):
        """Atomically increment chat's number of participants.

        Helper method to atomically increment the Chat model's number
        of participants if it is currently less than max_participants.

        Args:
            chat: persisted Chat model object.
        Returns:
            The updated number of participants upon success.
        Raises:
            RuntimerError if the maximum number of participants
            would be exceeded.
        """
        cursor = connection.cursor()
        cursor.execute("""UPDATE chat SET no_participants = no_participants+1
                    WHERE id = %s and no_participants < %s
                    RETURNING no_participants""", [chat.id, chat.max_participants])
        transaction.commit_unless_managed()
        no_participants = cursor.fetchone()
        if no_participants is None:
            raise RuntimeError("max participants exceeded")

        return no_participants[0]

    def get_or_create_chat_user(self, user, chat):
        """Get or create a ChatParticipant model for the given user and session.

        Helper method to get the ChatParticipant model for the given
        user and chat, or create a new one if required.
        This method respects the chat type, and the maximum number
        of allowed participants when creating a new ChatParticipant model.

        Args:
            user: User object
            chat: Chat model object.
        Returns:
            New ChatParticipant model object upon success, None otherewise.
        """
        for chat_participant in chat.chat_participants.select_related("user").all():
            if chat_participant.user.id == user.id:
                return chat_participant
        result = None
        try:
            no_participants = self.increment_participants(chat)
            result = chat.chat_participants.create(user=user, no_participant=no_participants)
        except:
            pass
        return result;


class Chat(models.Model):
    """Chat data model.

    Fields:
        token: unique chat used for auth.
        topic: Topic object
        start: start datetime object
        end: end datetime object
        max_duration: Max chat duration in seconds
        max_participants: Maximum number of participants
        no_participants: Number of users participating in the chat.
            Note that this a slight denormalization since this information
            can be derived from "users". This is necessary in order to
            allow atomic assignmet of users' to chat sessions.
    """
    class Meta:
        db_table = "chat"
    
    token = models.CharField(max_length=1024, null=True, unique=True)
    topic = models.ForeignKey(Topic, related_name="chats")
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    max_duration = models.IntegerField()
    max_participants = models.IntegerField(default=1)
    no_participants = models.IntegerField(default=0)
    record = models.BooleanField(default=False)
    users = models.ManyToManyField(User, related_name="chats", through="ChatParticipant")

    objects = ChatManager()
    

class ChatParticipant(models.Model):
    """Chat participant data model.

    Model links chats  to users, and also contains a few additional
    attributes such as the user's participant number.

    Fields:
        chat: Chat data model object
        user: User object
        participant: user's participant number which uniquely
            identifies the user within the chat.
            This is typically the order in which the user
            joined the chat.
    """
    class Meta:
        db_table = "chat_participant"
        unique_together = ("chat", "user")
    
    chat = models.ForeignKey(Chat, related_name="chat_participants")
    user = models.ForeignKey(User, related_name="+")
    participant = models.IntegerField()


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

    Represents a media archive file of a past chat.

    Fields:
        type: ChatArchiveType object
        chat: Chat data model object.
        mime_type: MimeType data model object.
        path: relative media archive file path
        public: boolean indicating if the stream is public.
            This should be set to true if the stream
            has been anonymized.
        waveform: json array of normalized waveform data
            suitable for rendering.
        waveform_path: path to transparent waveform image
        length: stream length in milliseconds
        offset: stream offset in milliseconds.
            This is only applicable for non-merged
            streams.
    """
    class Meta:
        db_table = "chat_archive"

    type = models.ForeignKey(ChatArchiveType, related_name="+")
    chat = models.ForeignKey(Chat, related_name="chat_archives")
    mime_type = models.ForeignKey(MimeType, related_name="+")
    path = models.FileField(upload_to="archives", max_length=1024)
    public = models.BooleanField(default=False)
    waveform = models.TextField(null=True)
    waveform_path = models.FileField(upload_to="archives", max_length=1024, null=True)
    length = models.IntegerField(null=True)
    offset = models.IntegerField(null=True)

class ChatArchiveJob(models.Model):
    """Chat archive job data model.
    
    Represents a job for archivesvc.

    Fields:
        chat: Chat data model object
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

    chat = models.ForeignKey(Chat, related_name="+")
    created = models.DateTimeField(auto_now_add=True)
    not_before = models.DateTimeField(auto_now_add=True)
    data = models.TextField(max_length=4096)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    owner = models.CharField(null=True, max_length=1024)
    successful = models.NullBooleanField(null=True)
    retries_remaining = models.IntegerField()

class ChatReel(models.Model):
    """Chat reel.

    Chats included by user in highlight reel.
    Fields:
    """
    class Meta:
        db_table = "chat_reel"
        unique_together = ("chat", "user")

    user = models.ForeignKey(User, related_name="chat_reels")
    chat = models.ForeignKey(Chat, related_name="+")
    rank = models.IntegerField()
