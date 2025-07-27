
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

To run the game you'll need data pack:
1. cd /path/to/hl/valve
2. `zip -r -9 data.zip .`
3. copy data.zip to `src/assets/module`
