import datetime
import fnmatch
import hashlib
import mimetypes
import optparse
import os
import re
import tarfile

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError, NoArgsCommand


from techresidents_web.cloudfiles_storage.storage import CloudfilesStaticStorage


class Command(NoArgsCommand):
    help = "Sync static files to Rackspace Cloudfiles."
    option_list = NoArgsCommand.option_list + (
        optparse.make_option("-i", "--include", action="append", default=[],
                             dest="includes", metavar="PATTERN",
                             help="Include file or directories matching this glob-style "
                                  "pattern. Use multiple times to include more."),
        optparse.make_option("-e", "--exclude", action="append", default=[],
                             dest="excludes", metavar="PATTERN",
                             help="Exclude files or directories matching this glob-style "
                                  "pattern. Use multiple times to exclude more."),
        optparse.make_option("-d", "--dry-run",
                             action="store_true", dest="dry_run", default=False,
                             help="Performs a dry run of the sync."),
        optparse.make_option("-c", "--container", dest="container_name",
                             help="Override CLOUDFILES_STATIC_CONTAINER_NAME."),
        optparse.make_option("-t", "--timeout", type="int", help="Override CLOUDFILES_TIMEOUT"),
        optparse.make_option("-r", "--retries",type="int", help="Override CLOUDFILES_RETRIES"),
        optparse.make_option("-D", "--debug", type="int", dest="debug_level", help="Set debug level")
    )

    def set_options(self, options):
        """Sets instance variables based on an options dict"""
        self.container_name = options.get("container_name") or \
                settings.CLOUDFILES_STATIC_CONTAINER_NAME
        self.timeout = options.get("timeout")
        self.retries = options.get("retries")
        self.debug_level = options.get("debug_level")

        self.dry_run = options.get("dry_run")
        self.includes = list(set(options.get("includes")))
        self.excludes = list(set(options.get("excludes")))
        self.static_root = os.path.abspath(settings.STATIC_ROOT)

        self.cloudfiles_storage = CloudfilesStaticStorage(
                container_name=self.container_name,
                timeout=self.timeout,
                retries=self.retries,
                debug_level=self.debug_level)

    def handle_noargs(self, *args, **options):
        self.set_options(options)

        # match local files
        absolute_paths = self.match_files(self.static_root, self.includes, self.excludes)
        paths = {}
        for absolute_path in absolute_paths:
            relative_path = absolute_path.split(self.static_root)[1]
            relative_path = 'static/' + relative_path.lstrip("/")
            md5 = hashlib.md5(open(absolute_path, "r").read()).hexdigest()
            paths[relative_path] = {
                "absolute_path": absolute_path,
                "relative_path": relative_path,
                "md5": md5,
                "etag": None
            }

        #add cloudfiles etag (md5) to paths
        print "Listing cloudfiles ..."
        for storage_object in self.cloudfiles_storage.container.list_all_objects():
            info = paths.get(storage_object["name"])
            if info:
                info["etag"] = storage_object["hash"]
        
        #only sync paths where file md5 does not match etag on cloudfiles
        sync_paths = {}
        for key, path in paths.items():
            if path["md5"] != path["etag"]:
                sync_paths[key] = path

        if self.dry_run:
            if sync_paths:
                for path in sync_paths.values():
                    print "Dry Run - needs sync: %s" % path["relative_path"]
            else:
                print "Already synced."
        else:
            if sync_paths:
                self.sync(sync_paths)
                #self.sync_archive(sync_paths)
                print "Sync complete."
            else:
                print "Already synced."

    def match_files(self, prefix, includes, excludes):
        """ Filters os.walk() with include and exclude patterns."""

        #translate glob patterns to regular expressions
        includes_pattern = r"|".join([fnmatch.translate(x) for x in includes])
        excludes_pattern = r"|".join([fnmatch.translate(x) for x in excludes]) or r"$."
        matches = []

        for root, dirs, files in os.walk(prefix, topdown=True):
            #exclude dirs which match by modifying 'dirs' in
            #place using the slice notattion. This is necessary
            #for os.walk() to pick up the changes.
            dirs[:] = [os.path.join(root, d) for d in dirs]
            dirs[:] = [d for d in dirs if not re.match(excludes_pattern,
                                                       d.split(root)[1])]
            # exclude/include files
            files = [os.path.join(root, f) for f in files]
            files = [f for f in files if not re.match(excludes_pattern, f)]
            files = [f for f in files if re.match(includes_pattern, f.split(prefix)[1])]

            for fname in files:
                matches.append(fname)
        return matches

    def sync(self, sync_paths):
        "Sync files in paths dict to Cloudfiles"
        for path in sync_paths.values():
            print 'Syncing %s' % path["relative_path"]
            with self.cloudfiles_storage.open(path["relative_path"], "w") as f:
                f.write(open(path["absolute_path"], "r"))
    
    def sync_archive(self, sync_paths, archive="sync_static.tar.gz"):
        """Sync files in paths dict to Cloudfiles using an archive

        Sync will create an archive using the passed in 'archive' name 
        which contains all of the files and send the entire archive
        to Cloudfiles to be extracted using the 'extract archive'
        API request.

        Note that currently there is an issue where the mime
        types for font files (.woff, .ttf) are not being
        set properly which causes issues in firefox.
        """
        with tarfile.open(archive, "w:gz") as tar:
            for path in sync_paths.values():
                print "Adding %s to %s" % (path["relative_path"], archive)
                tar.add(path["absolute_path"], path["relative_path"])
        print "Syncing %s with cloudfiles ..." % archive
        self.cloudfiles_storage.container.extract_archive(archive)
