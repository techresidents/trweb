from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import render_to_response
from django.template import RequestContext


from trpycore.encode.basic import basic_encode
from techresidents_web.common.decorators import developer_required, employer_required
from techresidents_web.common.models import Skill, Topic
from techresidents_web.job.models import JobPositionTypePref, JobTechnologyPref, JobLocationPref, \
    JobRequisition



class BaseUserAction(object):
    """Base user action class.

    This class is used to encapsulate
    all the data that is required to
    display a recommended action to
    the user.
    """
    def __init__(self, category=None, link=None):
        self.category = category
        self.link = link

class ChatUserAction(BaseUserAction):
    """ Chat user action.

    This class encapsulates all the data
    that is required to display a recommended
    action for the user to participate in a
    chat.
    """
    def __init__(self, chat_name=None, link=None):
        super(ChatUserAction, self).__init__(category="chat", link=link)
        self.chat_name = chat_name

def compute_recommended_employer_actions(request):
    """Helper function to compute recommended next actions for employers

    Returns a list of UserAction objects.
    """
    user_actions = []

    # create a requisition
    requisition_count = JobRequisition.objects. \
        filter(tenant=request.user.tenant). \
        count()
    if requisition_count > 0:
        relative_link = reverse("employer.views.employer")
        absolute_link = request.build_absolute_uri(relative_link)
        action = BaseUserAction(category="requisition", link=absolute_link)
        user_actions.append(action)

    # search for talent
    relative_link = reverse("employer.views.employer")
    absolute_link = request.build_absolute_uri(relative_link)
    action = BaseUserAction(category="talent", link=absolute_link)
    user_actions.append(action)

    return user_actions

def compute_recommended_actions(request, profile_completion_percentage, completed_topics_dict, incomplete_topics_dict):
    """Helper function to compute recommended
    next actions for developers.

    Returns a list of UserAction objects.
    """
    user_actions = []

    # Have user add info to their profile
    # if it's not 100% complete
    if profile_completion_percentage != 100:
        relative_link = reverse("accounts.views.profile_account")
        absolute_link = request.build_absolute_uri(relative_link)
        action = BaseUserAction(category='profile', link=absolute_link)
        user_actions.append(action)

    # Check to see if user completed the
    # Tutorial and Bio chats
    tutorial_title = 'Tutorial'
    tutorial_completed = False
    bio_title = 'Bio'
    bio_completed = False
    if tutorial_title in completed_topics_dict:
        tutorial_completed = True
    if bio_title in completed_topics_dict:
        bio_completed = True

    # Only recommend one of these chats to
    # complete, not both.
    if not tutorial_completed:
        tutorial_topic = incomplete_topics_dict.get(tutorial_title)
        if tutorial_topic is not None:
            relative_link = reverse("topic.views.details", args=[basic_encode(tutorial_topic.id)])
            absolute_link = request.build_absolute_uri(relative_link)
            action = ChatUserAction(chat_name=tutorial_topic.title, link=absolute_link)
            user_actions.append(action)

    elif not bio_completed:
        bio_topic = incomplete_topics_dict.get(bio_title)
        if bio_topic is not None:
            relative_link = reverse("topic.views.details", args=[basic_encode(bio_topic.id)])
            absolute_link = request.build_absolute_uri(relative_link)
            action = ChatUserAction(chat_name=bio_topic.title, link=absolute_link)
            user_actions.append(action)

    return user_actions


def compute_profile_completion(request):
    """ Helper function to compute what percentage
     of a developer's profile has been completed.
    """
    profile_percent_complete = 0

    # 10% for basic user profile info
    user_profile = request.user.get_profile()
    if user_profile.developer_since is not None:
        profile_percent_complete += 10

    # 15% for each category of Skill (language, framework, peristence)
    # Query for all user's skills, group by technology type
    technology_type_counts = Skill.objects.\
        filter(user=request.user).\
        values('technology__type__name').\
        annotate(count=Count('technology__type__name'))
    # Place results of query into simpler data structure,
    # a map of {'technology_type' : 'count'}
    technology_type_count_map = {}
    for t in technology_type_counts:
        technology_type_count_map[t['technology__type__name']] = t['count']
    # Give user points for each type of technology type
    # they've listed their skills for.
    if len(technology_type_counts):
        for type in ['Language', 'Framework', 'Persistence']:
            if type in technology_type_count_map:
                profile_percent_complete += 15

    #15% for each job preference they've added
    position_prefs_count = JobPositionTypePref.objects.filter(user=request.user).count()
    if position_prefs_count > 0:
        profile_percent_complete += 15
    technology_prefs_count = JobTechnologyPref.objects.filter(user=request.user).count()
    if technology_prefs_count > 0:
        profile_percent_complete += 15
    location_prefs_count = JobLocationPref.objects.filter(user=request.user).count()
    if location_prefs_count > 0:
        profile_percent_complete += 15

    return profile_percent_complete


@login_required
def home(request):
    if request.user.is_employer:
        return home_employer(request)
    else:
        return home_developer(request)

@developer_required
def home_developer(request):
    """Developer home"""
    context = {
        "chat_topics": [],
        "full_name": request.user.get_full_name(),
        "profile_completed": 0,
        "recommended_actions": []
    }

    return render_to_response('home/home.html', context, context_instance=RequestContext(request))

@employer_required
def home_employer(request):
    """Employer home"""

    recommended_actions = compute_recommended_employer_actions(request)
    context = {
        "full_name": request.user.get_full_name(),
        "employer_name": request.user.tenant.name,
        "recommended_actions": recommended_actions,
        "announcements": [
            ("March 26, 2013",
             "Now you can create requisitions to track, score, "
             "and extend interview offers to candidates. Click "
             "the Requisitions link at the top of the screen to "
             "create your first requisition."),
            ("March 15, 2013",
             "Our first hiring event has been postponed to Q2. Stay"
             " tuned for more details.")
        ]
    }

    return render_to_response('home/home_employer.html', context, context_instance=RequestContext(request))
