#!/bin/bash

# Must be called from a Drupal 8 core git checkout.
#
# RESET by doing `git reset --hard HEAD^^^^^; git checkout -- core`
# UPDATE DRUPAL by doing `git pull --rebase`

wget http://drupal.org/files/drupal_wysiwyg-in-core-round-two-aloha-module-72.patch
wget http://drupal.org/files/drupal_wysiwyg-in-core-round-two-aloha-build-72-do-not-test.patch
git apply drupal_wysiwyg-in-core-round-two-aloha-module-72.patch
git add core/modules/aloha
git commit -am "#1809702: aloha.module"
git apply drupal_wysiwyg-in-core-round-two-aloha-build-72-do-not-test.patch
git add core/modules/aloha
git commit -am "#1809702: custom AE build"


wget http://drupal.org/files/drupal_wysiwyg-in-core-round-two-standard-installprofile.patch
git apply drupal_wysiwyg-in-core-round-two-standard-installprofile.patch
git add core
git commit -am "#1809702: update default text formats in install profile"

drush cc all
