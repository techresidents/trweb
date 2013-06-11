clean:
	rm -r build

developer:
	@echo "Building developer app..."
	r.js -o static/js/apps/developer/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/developer/apps/developer/src
	@cp static/js/apps/developer/build/dist/apps/developer/src/main.js build/static/js/dist/apps/developer/apps/developer/src/main.js
	@cp -r static/js/apps/developer/build/dist/packages build/static/js/dist/apps/developer

employer:
	@echo "Building employer app..."
	r.js -o static/js/apps/employer/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/employer/apps/employer/src
	@cp static/js/apps/employer/build/dist/apps/employer/src/main.js build/static/js/dist/apps/employer/apps/employer/src/main.js
	@cp -r static/js/apps/employer/build/dist/packages build/static/js/dist/apps/employer

profile:
	@echo "Building profile app..."
	r.js -o static/js/apps/profile/build/app.build.js skipDirOptimize=true
	@mkdir -p build/static/js/dist/apps/profile/apps/profile/src
	@cp static/js/apps/profile/build/dist/apps/profile/src/main.js build/static/js/dist/apps/profile/apps/profile/src/main.js
	@cp -r static/js/apps/profile/build/dist/packages build/static/js/dist/apps/profile

static: developer employer profile
	@cp -r static static.old
	@mkdir -p build/static/js/dist/3ps
	@cp -r static/js/3ps build/static/js/dist
	@cp static/js/text.js build/static/js/dist
	@rm -rf static/js
	@cp -r build/static/js/dist static/js
	python manage.py collectstatic --noinput

web: static


.PHONY: clean developer employer profile static web
