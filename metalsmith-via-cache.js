import {getCache} from './cache';

const cache = getCache('photo-map');

const pluginToPromiseForContext = (context, metalsmith) => (plugin, files) => {
  return new Promise(resolve => {
    plugin.call(context, files, metalsmith, resolve);
  });
}

function sequence(tasks, fn) {
  return tasks.reduce((promise, task) => {
    return promise.then(() => fn(task))
  }, Promise.resolve());
}


export default function viaCachePlugin ({plugins, exclude}) {

  return async function viaCacheJob (files, metalsmith, done) {
    const originalFiles = Object.keys(files);
    let cached = {};

    await Promise.all(Object.keys(files).map(async (filename) => {
      if (exclude && exclude.test(filename)) return;
      const cachedFile = await cache.get(filename);
      if (cachedFile) {
        cached[filename] = cachedFile;
        delete files[filename];
      }
    }));

    const toPromise = pluginToPromiseForContext(this, metalsmith);

    await sequence(plugins, async plugin => {
      console.log(`Applying ${plugin.name}`);
      await toPromise(plugin, files);
    });

    await Promise.all(Object.keys(files).map(async (filename) => {
      if (exclude && exclude.test(filename)) return;
      await cache.set(filename, files[filename]);
    }));

    originalFiles.forEach(filename => {
      if (cached[filename]) {
        files[filename] = cached[filename];
      }
    });

    done();
  }
}
