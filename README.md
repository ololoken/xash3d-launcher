
build
xash3d with 
```
emconfigure ./waf configure --emscripten && emmake ./waf build && emmake ./waf install --destdir ./out
```

build hlsdk-portable
```
 emconfigure ./waf configure --emscripten -T release && emmake ./waf && emconfigure ./waf install --destdir out
```

copy output to `src/assets/module`


