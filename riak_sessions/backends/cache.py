#!/usr/bin/env python

import datetime

import riak

from django.conf import settings
from django.contrib.sessions.backends.base import SessionBase, CreateError


#Riak configuration options and defaults
RIAK_HOST = getattr(settings, "RIAK_HOST", "127.0.0.1")
RIAK_PORT = getattr(settings, "RIAK_PORT", 8087)
RIAK_SESSION_BUCKET = getattr(settings, "RIAK_SESSION_BUCKET", "django_riak_sessions")
RIAK_TRANSPORT_CLASS = getattr(settings, "RIAK_TRANSPORT_CLASS", riak.RiakPbcTransport)
RIAK_SESSION_KEY = getattr(settings, "RIAK_SESSION_KEY", "%(session_key)s")


class SessionStore(SessionBase):
    """ Riak session store for django """
    
    #Store the Riak client and bucket outside of the SessionStore instance,
    #since SessionStore objects are created frequently.
    #It looks like the RiakClient handles disconnections, which is a plus,
    #but it does not support load balancing across multiple hosts.
    client = riak.RiakClient(
             host=RIAK_HOST,
             port=RIAK_PORT,
             transport_class = RIAK_TRANSPORT_CLASS)
    
    bucket = client.bucket(RIAK_SESSION_BUCKET)


    def __init__(self, session_key=None):
        super(SessionStore, self).__init__(session_key)

        self.client = SessionStore.client
        self.bucket = SessionStore.bucket

    
    def _get_riak_session(self, session_key=None):
        """ Return the session object from Riak bucket """
        session_key = session_key or self._session_key
        riak_session_key = RIAK_SESSION_KEY % dict(session_key=session_key)
        return self.bucket.get(riak_session_key)

    def exists(self, session_key):
        """
        Returns True if the given session_key already exists.
        """
        session = self._get_riak_session(session_key)
        return session.exists()

    def create(self):
        """
        Creates a new session instance. Guaranteed to create a new object with
        a unique key and will have saved the result once (with empty data)
        before the method returns.
        """
        
        #Continue to create new session keys while we get collisions
        while True:
            self.session_key = self._get_new_session_key()
            try:
                self.save(must_create=True)
            except CreateError:
                continue
            
            #Found unused session key
            self.modified = True
            self._session_cache = {}
            return

    def save(self, must_create=False):
        """
        Saves the session data. If 'must_create' is True, a new session object
        is created (otherwise a CreateError exception is raised). Otherwise,
        save() can update an existing object with the same key.
        """
        session = None
        
        #Check to see if the session exists first to avoid any uncessary work
        if must_create:
            session = self._get_riak_session()
            if session.exists():
                raise CreateError
        
        session_data = self._get_session(no_load=must_create)
        encoded_session_data = self.encode(session_data)
        
        #Riak bucket data
        #expire_date is stored in seconds, since datetime() objects are not JSON serializable.
        
        #Only store the user id and session expiry unencoded for consumption
        #in non-django applications.
        unencoded_session_data = {}
        for key in ["_auth_user_id", "_session_expiry"]:
            if key in session_data:
                unencoded_session_data[key] = session_data[key]

        data = {
            "session_data": unencoded_session_data,
            "encoded_session_data": encoded_session_data,
            "expire_time": float(self.get_expiry_date().strftime("%s"))
        }
        
        #Update the data and store the session
        try:
            #Get the session if we have not already (must_create is False)
            session = session or self._get_riak_session()
            session.set_data(data)
            session.store(if_none_match=must_create)
        except Exception:
            #Riak will riase an Exception if if_none_match is True and object already exists.
            #If this happens raise CreateError, otherwise re-raise the original exception.
            if must_create:
                raise CreateError
            else:
                raise

    def delete(self, session_key=None):
        """
        Deletes the session data under this key. If the key is None, the
        current session key value is used.
        """
        session_key = session_key or self._session_key
        if session_key is None:
            return
        
        session = self._get_riak_session(session_key)
        if session.exists():
            session.delete()

    def load(self):
        """
        Loads the session data and returns a dictionary.
        """

        session = self._get_riak_session()

        #If the session exists and is not expired return the session data,
        #otherwise create a new session.
        if session.exists():
            session_data = session.get_data()
            expire_date = datetime.datetime.fromtimestamp(session_data["expire_time"])
            if datetime.datetime.now() < expire_date:
                encoded_session_data = session_data["encoded_session_data"]
                return self.decode(encoded_session_data)
        
        #Create new session
        self.create()
        return {}
