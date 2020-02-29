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
        /index.md (optional)
    /index.md (optional)
```

Two types of pages are generated:

- index page with a map containing all trips
- index page for each trip, with a map of individual trip and photos for this
 trip
 
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

