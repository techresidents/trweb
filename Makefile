UNAME := $(shell uname)
ifeq ($(UNAME),Darwin)
	MD5 = /sbin/md5
else
	MD5 = /usr/bin/md5sum
endif

all: web

web: static

apps:
	@for app in "developer" "employer"; do \
		echo "Building $$app app..."; \
		r.js -o static/js/apps/$$app/build/app.build.js skipDirOptimize=true; \
		mkdir -p build/static/js/dist/apps/$$app/apps/$$app/src; \
		cp static/js/apps/$$app/build/dist/apps/$$app/src/main.js build/static/js/dist/apps/$$app/apps/$$app/src/main.js; \
		for package in static/js/apps/$$app/build/dist/packages/* ; do \
			p=$$(basename $$package); \
			mkdir -p build/static/js/dist/apps/$$app/packages/$$p;\
			cp $$package/main.js build/static/js/dist/apps/$$app/packages/$$p; \
		done; \
	done

static_collected: apps
	@echo "Building static..."
	@cp -r static static_orig
	@mkdir -p build/static/js/dist/3ps
	@cp -r static/js/3ps build/static/js/dist
	@cp static/js/text.js build/static/js/dist
	@rm -rf static/js
	@cp -r build/static/js/dist static/js
	python manage.py collectstatic --noinput

static: static_collected
	@for app in "developer" "employer"; do \
		application=static_collected/js/apps/$$app/apps/$$app; \
		for package in static_collected/js/apps/$$app/packages/* ; do \
			p=$$(basename $$package); \
			sum=$$(echo $$package/main.*.js | sed 's|.*main\.\(.*\)\.js|\1|'); \
			sed -i.tmp -e "s|\(\"packages/$$p\"\)|\1,main:\"main.$$sum\"|g" $$application/src/main*.js; \
			done; \
		newsum=$$($(MD5) $$application/src/main.js | sed 's|.*\([0-9a-f]\{12\}\)[0-9a-f]\{20\}.*|\1|'); \
		mv $$application/src/main.*.js $$application/src/main.$$newsum.js; \
		rm $$application/src/main*.tmp; \
	done

clean:
	rm -rf build
	rm -rf static_collected
	test ! -d static_orig || (rm -rf static && mv static_orig static)
	rm -rf static/js/apps/developer/build/dist
	rm -rf static/js/apps/employer/build/dist
	rm -rf static/js/apps/profile/build/dist

.PHONY: clean apps static_collected static web
