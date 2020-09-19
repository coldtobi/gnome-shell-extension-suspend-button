SHELL := /bin/bash

JS_FILES = {extension,convenience,intellihide,panelVisibilityManager,prefs}.js

.PHONY: clean all

all: hidetopbar.zip

schemas/gschemas.compiled:
	glib-compile-schemas --strict ./schemas/

hidetopbar.zip: schemas/gschemas.compiled locale/hidetopbar.pot
	zip hidetopbar.zip -r COPYING.txt $(JS_FILES) metadata.json locale/*/*/*.mo schemas

clean:
	rm -rf hidetopbar.zip schemas/gschemas.compiled

locale/hidetopbar.pot: prefs.js
	xgettext -o locale/hidetopbar.pot -j prefs.js
