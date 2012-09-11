import calendar
import datetime
import mimetypes
import os
import threading

import cloudfiles
from cloudfiles.errors import NoSuchObject, NoSuchContainer

from django.conf import settings
from django.core.files import File
from django.core.files.storage import Storage
from django.contrib.staticfiles.storage import CachedFilesMixin

from techresidents_web.cloudfiles_storage.auth import CloudfilesAuthenticator

class StorageFileMode(object):
    """Class representation for file modes.
    
    This class provides a mechanism for parsing file modes.

    File modes:
        r  : read-only mode. File pointer placed at beginning of file.
        r+ : read-write mode. File pointer placed at begninning of file.
        w  : write-only mode. Overwrite file if the file exists. If the file
             does not exist, create a new file for writing.
        w+ : read-write mode. Overwrite file if the file exists. If the file 
             does not exit, create a new file for reading and writing.
        a  : write-only mode. The file pointer is placed at the end of the file 
             if the file exists. If the file does not exist, create a new
             file for writing.
        a+ : read-write mode. The file pointer is placed at the end of the file
             if the file exists (append mode). If the file does not exist,
             create a new file for reading and writing.

    Option file mode qualifiers:
        b  : binary file
        t  : text file
    """

    def __init__(self, mode):
        """StorageFileMode constructor.
        
        Args:
            mode: file mode, i.e. 'r+'
        """
        self.mode = mode
        
        #modes
        self.readable = False
        self.writable = False
        self.append = False
        self.plus = False
        self.binary = False
        self.text = False

        #flags
        self.create = False
        self.truncate = False

        self._parse(mode)
    
    def _parse(self, mode):
        mode_set = False

        for c in mode:
            if c == "r":
                if mode_set:
                    raise ValueError("invalid mode")
                self.readable = True
                mode_set = True
            elif c == "w":
                if mode_set:
                    raise ValueError("invalid mode")
                self.writable = self.create = self.truncate = True
                mode_set = True
            elif c == "a":
                if mode_set:
                    raise ValueError("invalid mode")
                self.writable = self.append = self.create = True
                mode_set = True
            elif c == "b":
                self.binary = True
            elif c == "t":
                self.text = True
            elif c == "+":
                self.readable = self.writable = True
            else:
                raise ValueError("invalid mode")

class CloudfilesStorageFile(File):
    """Rackspace cloudfiles storage file.

    StorageFile objects should not typically be instantiated directly. Instead
    the Storage object backend should be used in order to obtain a StorageFile
    object.
    
    All StorageFile names are relative. For example,
    'me.jpeg', or 'photos/me.jpeg' are okay, but not '/mypath/photos/me.jpeg'.
    This is intentional so that the names can be persisted if needed,
    and still allow for Storage backends to be switched without too
    much trouble.
    """
    
    def __init__(self, container, location_base, name, mode, content_type=None):
        """CloudfilesStorageFile constructor.

        Args:
            container: cloudfiles.Container object
            location_base: location within container where name
                is located. location will not be exposed
                to the end application, for example,
                in the name().
            name: relative filename
            mode: file mode, i.e. 'rb'
            content_type: optional mime content type. If
                not provided the mime type will be
                guessed.
        """
        super(CloudfilesStorageFile, self).__init__(name, mode)
        self._name = name
        self._mode = mode
        self.location_base = location_base or ""
        self.container = container
        self.content_type = content_type or mimetypes.guess_type(self._name)[0]
        
        self.location = "%s%s" % (self.location_base, name)
        self.file_mode = None
        self.object = None
        self.offset = 0
        
        self.open(mode)
    
    def _validate_file_mode(self, mode):
        """Validate file mode.
        
        Currently we only support read or write mode, not
        both at the same time.

        Args:
            mode: file mode, i.e. 'rb'
        Returns:
            StorageFileMode object.
        """
        file_mode = StorageFileMode(mode)
        if file_mode.append:
            raise ValueError("append mode unsupported")
        elif file_mode.readable and file_mode.writable:
            raise ValueError("read-write mode unsupported")
        return file_mode

    def name(self):
        """Get relative file name.

        Returns:
            relative filename, i.e. 'photos/me.jpeg'
        """
        return self._name

    def mode(self):
        """Get file mode.

        Returns:
            file mode, i.e. 'rb'
        """
        return self._mode
    
    @property
    def size(self):
        """Get file size.

        Returns:
            file size in bytes.
        """
        return self.object.size

    def open(self, mode=None):
        """Open/reopen file in the given mode.
        
        Args:
            mode: optional file mode, i.e. 'rb'

        Reopens the file in the specified mode if provided.
        Otherwise the file is reopened using the same mode.
        Reopening the file will reset the file pointer to
        the begining of the file.
        """
        if mode is not None:
            self.file_mode = self._validate_file_mode(mode)
            self._mode = mode

        try:
            self.object = self.container.get_object(self.location)
            self.offset = 0
        except NoSuchObject:
            if self.file_mode.create:
                self.object = self.container.create_object(self.location)
            else:
                raise IOError("'%s' does not exist" % self._name)

    def read(self, size=None):
        """Read size bytes from file.
        
        Args:
            size: optional number of bytes to read.
                  If not provided the entire file
                  will be read.
        Returns:
            file data as a string.
        """
        if self.object is None:
            raise IOError("file not open")
        elif not self.file_mode.readable:
            raise IOError("file not opened in read mode")
        
        try:
            if self.offset >= self.size:
                result = ""
            else:
                result = self.object.read(
                        size=size or self.size - self.offset,
                        offset=self.offset)
                self.offset += size or len(result)
        except Exception as error:
            raise IOError(str(error))
        return result

    def write(self, data):
        """Write data to file.

        Args:
            data: string of file like object containing
                  a read(n) method.
        """
        if self.object is None:
            raise IOError("file not open")
        elif not self.file_mode.writable:
            raise IOError("file not opened in write mode")
        elif self.offset != 0:
            raise IOError("writes with non-zero offset not permitted")

        try:
            if self.content_type:
                self.object.content_type = self.content_type
            self.object.write(data)
            self.offset = self.object.size
        except Exception as error:
            raise IOError(str(error))
    
    def seek(self, offset, whence=0):
        """Move file pointer to specified offset.

        Args:
            offset: integer offset in bytes relative to whence
            whence: os.SEEK_SET (0) - relative to beginning of file
                    os.SEEK_CUR (1) - relative to current position
                    os.SEEK_END (2) - relative to end of file
        """
        if self.file_mode.writable:
            raise IOError("seek not permitted on files opened in write mode")

        if whence == os.SEEK_SET:
            self.offset = offset
        elif whence == os.SEEK_CUR:
            self.offset += offset
        elif whence == os.SEEK_END:
            self.offset += offset
        else:
            raise ValueError("invalid whence value")
    
    def tell(self):
        """Return file pointer offset.

        Returns:
            file pointer offset.
        """
        return self.offset

    def close(self):
        """Close the file."""
        self.object = None
        self.offset = 0


class CloudfilesStorage(Storage):
    """Rackspace cloudfiles storage backend.

    Storage backends provided an interface for accessing, file
    like, StorageFile objects. Each StorageFile object is
    identified by a relative name.
    
    Note that in order for Storage backends to remain swappable,
    it is critical that names be relative. For example, the names 
    'me.jpeg' or 'photos/me.jpeg' are okay, but '/fullpath/photos.jpeg'
    is not. The idea is to use logical, relative names throughout
    applications, so that this name can be safely persisted, while
    still allowing for the Storage backend to be swapped out without
    too much trouble.

    The following settings are required for use:

    CLOUDFILES_USERNAME: Rackspace username
    CLOUDFILES_API_KEY:  Rackspace api key (required if password not provided)
    CLOUDFILES_PASSWORD: Rackspace password (required if api_key not provided)
    CLOUDFILES_LOCATION_BASE: optional location within container to store files
    CLOUDFILES_SERVICENET: boolean to use internal Rackspace network
    CLOUDFILES_TIMEOUT: optional timeout in seconds
    CLOUDFILES_CREATE_CONTAINER: optional boolean indicating that the container
        should be created if it does not exist.
    """
    
    #Thread local storage for cloudfiles.Connection object.
    threadlocal = threading.local()

    def __init__(self,
            username=None,
            api_key=None,
            password=None,
            location_base=None,
            container_name=None,
            servicenet=None,
            timeout=None,
            create_container=None):
        """CloudfilesStorage constructor.

        Args:
            username: Rackspace username
            api_key: Rackspace api key (required if password not provided)
            password: Rackspace password (required if api_key not provided)
            container_name: cloud files container name
            location_base: location within the container to
                store all files, i.e. 'static/'.
                Note that the location will not be visible
                to the end application, for example in the
                relative name returned from save().
            servicenet: boolean indicating that the internal
                Rackspace network should be used. This should
                be set to True if the application is running
                on a Rackspace server, since it will prevent
                charges from being incurred.
            timeout: timeout in seconds.
        """
        self.username = username or settings.CLOUDFILES_USERNAME
        self.api_key = api_key or getattr(settings, "CLOUDFILES_API_KEY", None)
        self.password = password or getattr(settings, "CLOUDFILES_PASSWORD", None)
        self.location_base = location_base or getattr(settings, "CLOUDFILES_LOCATION_BASE", None)
        self.container_name = container_name or settings.CLOUDFILES_CONTAINER_NAME
        self.servicenet = servicenet or getattr(settings, "CLOUDFILES_SERVICENET")
        self.timeout = timeout or getattr(settings, "CLOUDFILES_TIMEOUT", 5)
        self.create_container = create_container or getattr(settings, "CLOUDFILES_CREATE_CONTAINER", False)
        
        #normalize location
        if self.location_base:
            if self.location_base.startswith("/"):
                self.location_base = self.location_base[1:]
            if not self.location_base.endswith("/"):
                self.location_base += "/"

        #cloudfiles api only support api-key base authentication.
        #Replace it with an authenticator that will do api-key
        #or password based authentication depending on which
        #is provided.
        self.authenticator = CloudfilesAuthenticator(
                username=self.username,
                api_key=self.api_key,
                password=self.password,
                timeout=self.timeout)
    
    def _name_to_location(self, name):
        """Convert relative filename to container location.
        
        Convert a relative filename the actual container location
        by prefixing it with self.location_base if not None.

        Returns:
            location of file within the container.
        """
        result = name
        if self.location_base is not None:
            result = "%s%s" % (self.location_base, name)
        return result

    @property
    def connection(self):
        """Get threadlocal cloudfiles Connection.

        Returns:
            threadlocal cloudfiles.Connection object.
        """
        if not getattr(self.threadlocal, "connection", None):
            connection = cloudfiles.Connection(
                    username=self.username,
                    api_key=self.api_key,
                    timeout=self.timeout,
                    servicenet=self.servicenet,
                    auth=self.authenticator)
            self.threadlocal.connection = connection
        return self.threadlocal.connection

    @property
    def container(self):
        """Get threadlocat cloudfiles Container.

        Returns:
            threadlocal cloudfiles.Connection object.
        """
        if not getattr(self.threadlocal, "container", None):
            try:
                container = self.connection.get_container(
                        container_name=self.container_name)
            except NoSuchContainer:
                if self.create_container:
                    container = self.connection.create_container(
                            container_name=self.container_name)
                    container.make_public()
                else:
                    raise
            self.threadlocal.container = container
        return self.threadlocal.container

    def listdir(self, path=None):
        """Get directory,file listing.

        Args:
            path: optional relative path to filter.
        Returns:
            (list_of_directories, list_of_files) tuple
        """
        directories = []
        files = []
        
        path = self._name_to_location(path or "")

        #path must end in / if provided
        if path and not path.endswith("/"):
            path += "/"
        elif not path:
            path = ""
        path_length = len(path)

        
        objects = self.container.list_objects(prefix=path, delimiter="/")

        for entry in objects:
            if entry.endswith("/"):
                directories.append(entry[path_length:-1])
            else:
                files.append(entry[path_length:])

        return directories, files

    def exists(self, name):
        """Check if storage file exists.

        Args:
            name: relative filename
        Returns:
            boolean indicating if storage file exists.
        """
        result = False
        try:
            location = self._name_to_location(name)
            self.container.get_object(location)
            result = True
        except NoSuchObject:
            pass
        
        return result
    
    def modified_time(self, name):
        """Get file modification datetime.

        Args:
            name: relative filename
        Returns:
            file modification datetime
        """
        try:
            location = self._name_to_location(name)
            last_modified = self.container.get_object(location).last_modified
            utc_datetime = datetime.datetime.strptime(last_modified, '%a, %d %b %Y %H:%M:%S %Z')
            timestamp = calendar.timegm(utc_datetime.timetuple())
            result = datetime.datetime.fromtimestamp(timestamp)
            return result
        except NoSuchObject:
            raise ValueError("'%s' does not exist" % name)

    def _open(self, name, mode='rb'):
        """Open storage file.

        Args:
            name: relative filename
            mode: optional file mode
        Returns:
            StorageFile object.
        """
        return CloudfilesStorageFile(
                self.container,
                self.location_base,
                name,
                mode)

    def _save(self, name, data, content_type=None):
        """Save and create new storage file.

        Args:
            name: relative filename
            data: string or file-like object with a
                  read(n) method.
            content_type: optional mime content type.
        """
        if self.exists(name):
            raise IOError("'%s' already exists" % name)

        with CloudfilesStorageFile(
                self.container,
                self.location_base,
                name,
                'w') as f:
            f.write(data)

        return name

    def size(self, name):
        """Get storage file size.

        Args:
            name: relative filename
        Returns:
            file size in bytes.
        """
        location = self._name_to_location(name)
        return self.container.get_object(location).size
    
    def path(self, name):
        """Get local filesystem path of storage file.

        Args:
            name: relative filename
        Returns:
            local filesystem path to file.
        """
        raise NotImplementedError()

    def url(self, name):
        """Get public url of storage file.

        Args:
            name: relative filename
        Returns:
            url to file.
        """

        result = None

        if self.container.is_public():
            location = self._name_to_location(name)
            container_uri = self.container.public_uri()
            result = "%s/%s" % (container_uri, location)

        return result

    def delete(self, name):
        """Delete storage file.
        Args:
            name: relative file name
        """
        location = self._name_to_location(name)
        self.container.delete_object(location)


class CloudfilesStaticStorage(CloudfilesStorage):
    """Rackspace cloudfiles static storage backend.

    Note that the location within the container to store static
    files will be set to settings.STATIC_URL. The value of 
    STATIC_URL will be normalized to remove the starting '/'
    if present and add a traling '/' if not present.

    The following settings are required:

    CLOUDFILES_STATIC_CONTAINER_NAME: Rackspace container name
    """
    
    def __init__(self, *args, **kwargs):
        """CloudfilesStorage constructor.

        Args:
            Same as CloudfilesStorage.
        """
        if "location_base" not in kwargs:
            kwargs["location_base"] = settings.STATIC_URL

        if "container_name" not in kwargs:
            kwargs["container_name"] = settings.CLOUDFILES_STATIC_CONTAINER_NAME

        super(CloudfilesStaticStorage, self).__init__(*args, **kwargs)


class CloudfilesCachedStaticStorage(CachedFilesMixin, CloudfilesStaticStorage):
    """Rackspace cloudfiles static cached storage backend.
    
    This is similar to django.contrib.staticfiles.storage.CachedStaticFilesStorage.

    The following settings are required:

    CLOUDFILES_STATIC_CONTAINER_NAME: Rackspace container name
    """
    pass
