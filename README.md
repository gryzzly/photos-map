# Free Time Managers

This is a statically generated website using [metalsmith](http://metalsmith
.io/), [preact](https://preactjs.com/) and [htm](https://github.com/developit/htm).

Folders with images are processed, considering each folder to be a "trip". The
photos’ location data is parsed from images to build a geographical path for
each of the trips.

Prerendered files have all the content and images, but no maps. Maps are
 initiated on the client.

Content is stored in the following way:

```
/content
    /dd-mm-yyyy
        /IMG_0123.jpg
        /Fun Ride Around Lake.gpx (optional)
        /index.md (optional)
    /index.md (optional)
```

Two types of pages are generated:

- index page with a map containing all trips
- index page for each trip, with a map of individual trip and photos for this
 trip

Processing of files is done via metalsmith and corresponding plugins:
:
1. `metalsmith-media-metadata.js` that adds EXIF data to metalsmith JSON file
representation
2. `photo-locations.js` that:

    - processes folders with images, markdown files and GPX routes
    - creates thumnails for images, gets image metadata from EXIF and
     provides it as more comfortable JSON properties
    - simplifies GPX data to contain much less nodes (no need for high
     precision)
    - adds/updates index files for each directory (representing a tour) with
metadata containing locations of all images for the tour, coordinates parsed
out of GPX track file, if present, and processed markdown content, if present
, as string:

```
path: '/20-02-2020/index.html'
contents: '<h1>Processed markdown content as string</h1>',
images: {
    [collectionName]: [
        {lat,lng,thumbnail,fileName,date,width,height,collection},
        …
    ]
},
gpx: [{lat,lng},…]
 ```
3. metalsmith-html.js that uses htm and preact to statically render files. It
 uses `document.js` template for building HTML files. In this template, file
 data is provided as `window.state`. The app is bootstrapped on the client side
 with the same data as statically rendered files and so app components are
  reused for static and client-side rendering.

# Editing content

To add a new trip, add a folder with its name matching this date format:
dd-mm-yyyy. Export images with location data into this folder.

If you’d like to add a text description, add an `index.md` file in this folder.

# Development

This project DOES NOT use compilers or bundlers. This means that the source
is deployed to Node and browser as is. The only compatibility layer used is
 `esm` package, that enables ES6-modules syntax in nodeJS.

To enable requiring NPM modules in browser and node environment, [snowpack
](https://www.snowpack.dev/) is used. It makes ES6 exports available as
 `/web_modules/${package}` in the project.

This project uses component approach (via Preact) to build the UI tree. It is
using the same modules in Node (when prerendering) and on the client (after
 hydration).

When prerendering, we render `<App />` component in the context of currently
processed file: see node.js entry point `main.js`.

On client, the data required for component’s lifecycle is included on page as
`window.state`, see client side entry point, `script.js`.

# Start up

Install dependencies:

```
npm install
```

Develop:
```
npm run start
```

Build:
```
npm run build
```

