import {getCache} from './cache';

const cache = getCache('photo-map');

const APPLIED_PLUGINS_KEY = '__metalsmithViaCacheAppliedPlugins';

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
  // FIXME: validate plugins to have `name` property and throw
  // error if any of them don’t have it
  return async function viaCacheJob (files, metalsmith, done) {
    const originalFiles = Object.keys(files);
    let cached = {};

    const appliedPluginsKey = plugins.map(fn => fn.name).join('-');

    await Promise.all(Object.keys(files).map(async (filename) => {
      if (exclude && exclude.test(filename)) return;
      const cachedFile = await cache.get(filename);
      if (
        cachedFile &&
        // allow to apply this plugin to various sets of plugins
        (cachedFile[APPLIED_PLUGINS_KEY].indexOf(appliedPluginsKey) !== -1)
      ) {
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
      files[filename][APPLIED_PLUGINS_KEY] =
        files[filename][APPLIED_PLUGINS_KEY] || [];
      files[filename][APPLIED_PLUGINS_KEY].push(appliedPluginsKey);
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
