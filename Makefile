
all: web

web: static

developer:
	@echo "Building developer app..."
	r.js -o static/js/apps/developer/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/developer/apps/developer/src
	@cp static/js/apps/developer/build/dist/apps/developer/src/main.js build/static/js/dist/apps/developer/apps/developer/src/main.js
	@#@cp -r static/js/apps/developer/build/dist/packages build/static/js/dist/apps/developer
	@for p in static/js/apps/developer/build/dist/packages/* ; do \
		mkdir -p build/static/js/dist/apps/developer/packages/`basename $$p`;\
		cp $$p/main.js build/static/js/dist/apps/developer/packages/`basename $$p`; \
	done

employer:
	@echo "Building employer app..."
	r.js -o static/js/apps/employer/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/employer/apps/employer/src
	@cp static/js/apps/employer/build/dist/apps/employer/src/main.js build/static/js/dist/apps/employer/apps/employer/src/main.js
	@#cp -r static/js/apps/employer/build/dist/packages build/static/js/dist/apps/employer
	@for p in static/js/apps/employer/build/dist/packages/* ; do \
		mkdir -p build/static/js/dist/apps/employer/packages/`basename $$p`;\
		cp $$p/main.js build/static/js/dist/apps/employer/packages/`basename $$p`; \
	done

profile:
	@echo "Building profile app..."
	r.js -o static/js/apps/profile/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/profile/apps/profile/src
	@cp static/js/apps/profile/build/dist/apps/profile/src/main.js build/static/js/dist/apps/profile/apps/profile/src/main.js

static: developer employer profile
	@echo "Building static..."
	@cp -r static static_orig
	@mkdir -p build/static/js/dist/3ps
	@cp -r static/js/3ps build/static/js/dist
	@cp static/js/text.js build/static/js/dist
	@rm -rf static/js
	@cp -r build/static/js/dist static/js
	python manage.py collectstatic --noinput

clean:
	rm -rf build
	rm -rf static_collected
	test ! -d static_orig || (rm -rf static && mv static_orig static)
	rm -rf static/js/apps/developer/build/dist
	rm -rf static/js/apps/employer/build/dist
	rm -rf static/js/apps/profile/build/dist

.PHONY: clean developer employer profile static web