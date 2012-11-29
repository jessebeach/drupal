#!/bin/bash

# Arg 1 ($1) should be the path to the Drupal 8 git repo.
# Arg 2 ($2) should be the comment number.
#
# Must be called from the aloha-8.x-2.x module's git repo.
#
# Sample usage:
#   $ pwd
#   ~/Work/aloha
#   $ sh corepatch.sh ~/Work/drupal 3

DRUPAL_DIR=$1
ALOHA_DIR=`pwd`
FILENAME=drupal_wysiwyg-in-core-round-two
COMMENTNR=$2

mkdir $DRUPAL_DIR/core/modules/aloha

# Generate the patch for the Aloha module.
cp -R aloha aloha.* css fonts includes js README.txt $DRUPAL_DIR/core/modules/aloha/
cd $DRUPAL_DIR
git add core/modules/aloha
git diff --staged --binary --patch-with-stat > $ALOHA_DIR/$FILENAME-aloha-module-$COMMENTNR.patch
git commit -m "aloha module"
cd $ALOHA_DIR

# Generate the patch for the Aloha build.
cp -R build $DRUPAL_DIR/core/modules/aloha/
cd $DRUPAL_DIR
git add core/modules/aloha
git diff --staged --binary --patch-with-stat > $ALOHA_DIR/$FILENAME-aloha-build-$COMMENTNR-do-not-test.patch
git ci -m "aloha build"
cd $ALOHA_DIR

# Undo these last two commits.
cd $DRUPAL_DIR
git reset --hard HEAD^^
rm -rf $DRUPAL_DIR/core/modules/aloha
cd $ALOHA_DIR
