#!/bin/bash
set -e
cd "$(dirname "$0")"

ANDROID_JAR=/usr/lib/android-sdk/platforms/android-23/android.jar
R8=tools/r8lib.jar
KEYSTORE=tools/debug.keystore

rm -rf build
mkdir -p build/compiled_res build/gen build/classes build/dex

echo "==> aapt2 compile"
aapt2 compile --dir app/res -o build/compiled_res.zip

echo "==> aapt2 link"
aapt2 link -o build/base.apk \
  -I "$ANDROID_JAR" \
  --manifest app/AndroidManifest.xml \
  -R build/compiled_res.zip \
  --java build/gen \
  --auto-add-overlay \
  --min-sdk-version 21 --target-sdk-version 23

echo "==> javac"
find app/src build/gen -name "*.java" > build/sources.txt
javac -encoding UTF-8 -source 8 -target 8 -nowarn \
  -cp "$ANDROID_JAR" \
  -d build/classes @build/sources.txt

echo "==> d8"
find build/classes -name "*.class" > build/classlist.txt
java -cp "$R8" com.android.tools.r8.D8 \
  --lib "$ANDROID_JAR" --output build/dex --min-api 21 @build/classlist.txt

echo "==> package"
cp build/base.apk build/app-unsigned.apk
( cd build/dex && zip -q -X ../app-unsigned.apk classes.dex )

echo "==> zipalign"
zipalign -f -p 4 build/app-unsigned.apk build/app-aligned.apk

echo "==> sign"
apksigner sign --ks "$KEYSTORE" --ks-pass pass:android --key-pass pass:android \
  --out build/NOHAYO-ThePlan-debug.apk build/app-aligned.apk

echo "==> verify"
apksigner verify --print-certs build/NOHAYO-ThePlan-debug.apk

echo "==> done: build/NOHAYO-ThePlan-debug.apk"
ls -la build/NOHAYO-ThePlan-debug.apk
