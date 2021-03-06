from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()


class Notification(models.Model):
    """Notification data model.

    The 'token' and 'context' are considered
    together for a notification to be unique.

    Fields:
        created: datetime object containing the time
            the Notification was created.
        token: notification ID. Used to allow creators of
            Notification objects to specify an ID.
        context: the request context
        recipients: User data model objects
        subject: the notification subject
        html_text: html notification body
        plain_text: plain text notification body

    """
    class Meta:
        db_table = "notification"
        unique_together = ("token", "context")
    created = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=1024)
    context = models.CharField(max_length=1024)
    priority = models.IntegerField()
    recipients = models.ManyToManyField(User, through="NotificationUser", related_name="notifications+")
    subject = models.CharField(max_length=1024)
    html_text = models.TextField(null=True)
    plain_text = models.TextField(null=True)



class NotificationUser(models.Model):
    """Notification User data model.

    Linking table for notifications and users.
    """
    class Meta:
        db_table = "notification_user"
        unique_together = ("notification", "user")

    notification = models.ForeignKey(Notification, related_name="+")
    user = models.ForeignKey(User, related_name="+")



class NotificationJob(models.Model):
    """Notification job data model.

    Represents a job for the notification service.

    Fields:
        notification: Notification data model object
        priority: NotificationPriority data model object
        recipient: User data model object
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
        db_table = "notification_job"
    notification = models.ForeignKey(Notification, related_name="notification_jobs")
    recipient = models.ForeignKey(User, related_name="+")
    priority = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)
    not_before = models.DateTimeField(auto_now_add=True)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    owner = models.CharField(null=True, max_length=1024)
    successful = models.NullBooleanField(null=True)
    retries_remaining = models.IntegerField()

