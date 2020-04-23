export default function(file, body) {
  return `<!DOCTYPE html>
<html>
  <head>
  <title>Free Time Managers</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">

  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

  <link rel="preload" href="/components/App.js" as="script" crossorigin>
  <link rel="preload" href="/web_modules/preact.js" as="script" crossorigin>

  <link href="/main.css" rel="stylesheet" />
  <link rel="stylesheet" href="/leaflet.css" />

  <link href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans&display=swap" rel="stylesheet">
  </head>
  <body>

  <style>
    .svg-defs {
      display: block;
      width: 0;
      height: 0;
    }
  </style>
  <svg xmlns="w3.org/2000/svg" version="1.1" class="svg-defs">
    <defs>
      <!-- Reference this filter in the code using the id -->
      <filter
          id="blur"
          x="-150%"
          y="-150%"
          width="300%"
          height="300%"
      >
        <feGaussianBlur
          stdDeviation="2"
        />
      </filter>
    </defs>

    <linearGradient id="fadein">
      <stop class="stop1" offset="15%"/>
      <stop class="stop2" offset="100%"/>
    </svg>

  <div class="root">
  ${body}
  </div><!-- root -->
  <script src="/leaflet.js"></script>
  <script>
    window.state = ${JSON.stringify(file)};
  </script>
  <script type="module" src="/script.js"></script>

  <script>
  if (window.location.hash === '#skipgc') {
    localStorage.setItem('skipgc', 't');
  }
  if (localStorage.getItem('skipgc') === 't') {
    window.goatcounter = {
      no_onload: true
    };
  }
  </script>
  <script
    data-goatcounter="https://freetimemanagers.goatcounter.com/count"
    async
    src="//gc.zgo.at/count.js"
  ></script>
</body>
</html>
`
}
