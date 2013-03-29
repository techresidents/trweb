from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

from techresidents_web.accounts.models import Tenant
from techresidents_web.common.models import Location, Organization, Technology


class JobPositionType(models.Model):
    """Job position type such as developer, manager, or architect"""
    class Meta:
        db_table = "job_position_type"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobRequisitionStatus(models.Model):
    """Job requisition status such as open, closed, etc..."""
    class Meta:
        db_table = "job_requisition_status"
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobRequisition(models.Model):
    """Job requisition model"""
    class Meta:
        db_table = "job_requisition"
    
    tenant = models.ForeignKey(Tenant, related_name="job_requisitions")
    user = models.ForeignKey(User, related_name="job_requisitions")
    position_type = models.ForeignKey(JobPositionType, related_name="+")
    location = models.ForeignKey(Location, related_name="+")
    status = models.ForeignKey(JobRequisitionStatus, related_name="+")
    technologies = models.ManyToManyField(Technology, through="JobRequisitionTechnology")
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=4096)
    salary_start = models.IntegerField()
    salary_end   = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)
    telecommute = models.BooleanField()
    relocation = models.BooleanField()
    employer_requisition_identifier = models.CharField(max_length=100, null=True)
    deleted = models.BooleanField(default=False)

class JobRequisitionTechnology(models.Model):
    """Job requisition technology model"""
    class Meta:
        db_table = "job_requisition_technology"
        unique_together = ("requisition", "technology")

    requisition = models.ForeignKey(JobRequisition, related_name="requisition_technologies")
    technology = models.ForeignKey(Technology, related_name="+")
    yrs_experience = models.IntegerField()

class JobLocationPref(models.Model):
    """Job location preference model"""
    class Meta:
        db_table = "job_location_pref"
        unique_together = ("user", "location")

    user = models.ForeignKey(User, related_name="job_location_prefs")
    location = models.ForeignKey(Location, related_name="+")

class JobOrganizationPref(models.Model):
    """Job organization preference model"""
    class Meta:
        db_table = "job_organization_pref"
        unique_together = ("user", "organization")

    user = models.ForeignKey(User, related_name="job_organization_prefs")
    organization = models.ForeignKey(Organization, related_name="+")

class JobPositionTypePref(models.Model):
    """Job position type preference model"""
    class Meta:
        db_table = "job_position_type_pref"
        unique_together = ("user", "position_type")

    user = models.ForeignKey(User, related_name="job_position_type_prefs")
    position_type = models.ForeignKey(JobPositionType, related_name="+")
    salary_start = models.IntegerField(null=True)
    salary_end   = models.IntegerField(null=True)

class JobTechnologyPref(models.Model):
    """Job technology preference model"""
    class Meta:
        db_table = "job_technology_pref"
        unique_together = ("user", "technology")

    user = models.ForeignKey(User, related_name="job_technology_prefs")
    technology = models.ForeignKey(Technology, related_name="+")

class JobApplicationType(models.Model):
    """Job application type model"""
    class Meta:
        db_table = "job_application_type"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobApplicationStatus(models.Model):
    """Job application status model"""
    class Meta:
        db_table = "job_application_status"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobApplication(models.Model):
    """Job application model"""
    class Meta:
        db_table = "job_application"
        unique_together = ("tenant", "user", "requisition")
    
    tenant = models.ForeignKey(Tenant, related_name="job_applications")
    user = models.ForeignKey(User, related_name="job_applications")
    creator = models.ForeignKey(User, related_name="+")
    requisition = models.ForeignKey(JobRequisition, related_name="job_applications")
    created = models.DateTimeField(auto_now_add=True)
    type = models.ForeignKey(JobApplicationType, related_name="+")
    status = models.ForeignKey(JobApplicationStatus, related_name="+")

class JobApplicationLog(models.Model):
    """Job application log model"""
    class Meta:
        db_table = "job_application_log"

    tenant = models.ForeignKey(Tenant, related_name="+")
    user = models.ForeignKey(User, related_name="+")
    application = models.ForeignKey(JobApplication, related_name="job_application_logs")
    note = models.TextField(max_length=4096)

class JobApplicationScore(models.Model):
    """Job application score model"""
    class Meta:
        db_table = "job_application_score"
        unique_together = ("tenant", "user", "application")

    tenant = models.ForeignKey(Tenant, related_name="+")
    user = models.ForeignKey(User, related_name="+")
    application = models.ForeignKey(JobApplication, related_name="job_application_scores")
    technical_score = models.IntegerField(null=True)
    communication_score = models.IntegerField(null=True)
    cultural_fit_score = models.IntegerField(null=True)

class JobApplicationVote(models.Model):
    """Job application vote model"""
    class Meta:
        db_table = "job_application_vote"
        unique_together = ("tenant", "user", "application")

    tenant = models.ForeignKey(Tenant, related_name="+")
    user = models.ForeignKey(User, related_name="+")
    application = models.ForeignKey(JobApplication, related_name="job_application_votes")
    yes = models.NullBooleanField()

class JobInterviewOfferType(models.Model):
    """Job interview type model"""
    class Meta:
        db_table = "job_interview_offer_type"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobInterviewOfferStatus(models.Model):
    """Job interview offer status model"""
    class Meta:
        db_table = "job_interview_offer_status"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)
    
class JobInterviewOffer(models.Model):
    """Job interview offer model"""
    class Meta:
        db_table = "job_interview_offer"
    
    tenant = models.ForeignKey(Tenant, related_name="job_interview_offers")
    employee = models.ForeignKey(User, related_name="+")
    candidate = models.ForeignKey(User, related_name="job_interview_offers")
    application = models.ForeignKey(JobApplication, related_name="job_interview_offers")
    type = models.ForeignKey(JobInterviewOfferType, related_name="+")
    status = models.ForeignKey(JobInterviewOfferStatus, related_name="+")
    created = models.DateTimeField(auto_now_add=True)
    expires = models.DateTimeField()

class JobOfferStatus(models.Model):
    """Job offer status model"""
    class Meta:
        db_table = "job_offer_status"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=1024)

class JobOffer(models.Model):
    """Job application model"""
    class Meta:
        db_table = "job_offer"
    
    tenant = models.ForeignKey(Tenant, related_name="job_offers")
    employee = models.ForeignKey(User, related_name="+")
    candidate = models.ForeignKey(User, related_name="job_offers")
    application = models.ForeignKey(JobApplication, related_name="job_offers")
    salary = models.IntegerField()
    created = models.DateTimeField(auto_now_add=True)
    status = models.ForeignKey(JobOfferStatus, related_name="+")

class JobNote(models.Model):
    """Job note model"""
    class Meta:
        db_table = "job_note"

    tenant = models.ForeignKey(Tenant, related_name="+")
    employee = models.ForeignKey(User, related_name="+")
    candidate = models.ForeignKey(User, related_name="+")
    note = models.TextField(max_length=4096)

class JobEvent(models.Model):
    """Job event model"""
    class Meta:
        db_table = "job_event"
    
    title = models.CharField(max_length=255)
    start = models.DateTimeField()
    end = models.DateTimeField()
    description = models.TextField(max_length=4096)
    candidates = models.ManyToManyField(User, db_table="job_event_candidate")
