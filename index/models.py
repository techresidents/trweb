from django.db import models

class IndexJob(models.Model):
    """Index job data model.

    Represents a job for the index service.

    Fields:
        data: JSON data which specifies info about the data to be indexed.
            This is not the data that is actually indexed.
        context: the request context
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
        db_table = "index_job"
    data = models.TextField(max_length=4096)
    context = models.CharField(max_length=1024)
    created = models.DateTimeField(auto_now_add=True)
    not_before = models.DateTimeField(auto_now_add=True)
    start = models.DateTimeField(null=True)
    end = models.DateTimeField(null=True)
    owner = models.CharField(null=True, max_length=1024)
    successful = models.NullBooleanField(null=True)
    retries_remaining = models.IntegerField()

