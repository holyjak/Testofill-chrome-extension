// node_modules/webext-patterns/index.js
var patternValidationRegex = /^(https?|wss?|file|ftp|\*):\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^file:\/\/\/.*$|^resource:\/\/(\*|\*\.[^*/]+|[^*/]+)\/.*$|^about:/;
var isFirefox = globalThis.navigator?.userAgent.includes("Firefox/");
var allStarsRegex = isFirefox ? /^(https?|wss?):[/][/][^/]+([/].*)?$/ : /^https?:[/][/][^/]+([/].*)?$/;
var allUrlsRegex = /^(https?|file|ftp):[/]+/;
function assertValidPattern(matchPattern) {
  if (!isValidPattern(matchPattern)) {
    throw new Error(matchPattern + " is an invalid pattern, it must match " + String(patternValidationRegex));
  }
}
function isValidPattern(matchPattern) {
  return matchPattern === "<all_urls>" || patternValidationRegex.test(matchPattern);
}
function getRawPatternRegex(matchPattern) {
  assertValidPattern(matchPattern);
  let [, protocol, host = "", pathname] = matchPattern.split(/(^[^:]+:[/][/])([^/]+)?/);
  protocol = protocol.replace("*", isFirefox ? "(https?|wss?)" : "https?").replaceAll(/[/]/g, "[/]");
  if (host === "*") {
    host = "[^/]+";
  } else if (host) {
    host = host.replace(/^[*][.]/, "([^/]+.)*").replaceAll(/[.]/g, "[.]").replace(/[*]$/, "[^.]+");
  }
  pathname = pathname.replaceAll(/[/]/g, "[/]").replaceAll(/[.]/g, "[.]").replaceAll(/[*]/g, ".*");
  return "^" + protocol + host + "(" + pathname + ")?$";
}
function patternToRegex(...matchPatterns) {
  if (matchPatterns.length === 0) {
    return /$./;
  }
  if (matchPatterns.includes("<all_urls>")) {
    return allUrlsRegex;
  }
  if (matchPatterns.includes("*://*/*")) {
    return allStarsRegex;
  }
  return new RegExp(matchPatterns.map((x) => getRawPatternRegex(x)).join("|"));
}
function excludeDuplicatePatterns(matchPatterns) {
  if (matchPatterns.includes("<all_urls>")) {
    return ["<all_urls>"];
  }
  if (matchPatterns.includes("*://*/*")) {
    return ["*://*/*"];
  }
  return matchPatterns.filter((possibleSubset) => !matchPatterns.some((possibleSuperset) => possibleSubset !== possibleSuperset && patternToRegex(possibleSuperset).test(possibleSubset)));
}

// node_modules/webext-additional-permissions/index.js
function getManifestPermissionsSync() {
  return _getManifestPermissionsSync(chrome.runtime.getManifest());
}
function _getManifestPermissionsSync(manifest) {
  var _a, _b, _c;
  const manifestPermissions = {
    origins: [],
    permissions: []
  };
  const list = /* @__PURE__ */ new Set([
    ...(_a = manifest.permissions) !== null && _a !== void 0 ? _a : [],
    ...((_b = manifest.content_scripts) !== null && _b !== void 0 ? _b : []).flatMap((config) => {
      var _a2;
      return (_a2 = config.matches) !== null && _a2 !== void 0 ? _a2 : [];
    })
  ]);
  if (manifest.devtools_page && !((_c = manifest.optional_permissions) === null || _c === void 0 ? void 0 : _c.includes("devtools"))) {
    list.add("devtools");
  }
  for (const permission of list) {
    if (permission.includes("://")) {
      manifestPermissions.origins.push(permission);
    } else {
      manifestPermissions.permissions.push(permission);
    }
  }
  return manifestPermissions;
}
var hostRegex = /:[/][/][*.]*([^/]+)/;
function parseDomain(origin) {
  return origin.split(hostRegex)[1];
}
async function getAdditionalPermissions(options) {
  return new Promise((resolve) => {
    chrome.permissions.getAll((currentPermissions) => {
      const manifestPermissions = getManifestPermissionsSync();
      resolve(_getAdditionalPermissions(manifestPermissions, currentPermissions, options));
    });
  });
}
function _getAdditionalPermissions(manifestPermissions, currentPermissions, { strictOrigins = true } = {}) {
  var _a, _b;
  const additionalPermissions = {
    origins: [],
    permissions: []
  };
  for (const origin of (_a = currentPermissions.origins) !== null && _a !== void 0 ? _a : []) {
    if (manifestPermissions.origins.includes(origin)) {
      continue;
    }
    if (!strictOrigins) {
      const domain = parseDomain(origin);
      const isDomainInManifest = manifestPermissions.origins.some((manifestOrigin) => parseDomain(manifestOrigin) === domain);
      if (isDomainInManifest) {
        continue;
      }
    }
    additionalPermissions.origins.push(origin);
  }
  for (const permission of (_b = currentPermissions.permissions) !== null && _b !== void 0 ? _b : []) {
    if (!manifestPermissions.permissions.includes(permission)) {
      additionalPermissions.permissions.push(permission);
    }
  }
  return additionalPermissions;
}

// node_modules/webext-dynamic-content-scripts/distribution/deduplicator.js
function getDifferentiators(c) {
  return JSON.stringify([c.all_frames, c.exclude_matches, c.run_at]);
}
function excludeDuplicateFiles(contentScripts, { warn = true } = {}) {
  const uniques = /* @__PURE__ */ new Map();
  const filterWarnAndAdd = (files, context) => {
    if (!files) {
      return [];
    }
    return files.filter((file) => {
      const differentiators = getDifferentiators(context);
      if (uniques.has(file)) {
        if (warn && differentiators !== uniques.get(file)) {
          console.warn(`Duplicate file in the manifest content_scripts: ${file} 
More info: https://github.com/fregante/webext-dynamic-content-scripts/issues/62`);
        }
        return false;
      }
      uniques.set(file, differentiators);
      return true;
    });
  };
  return contentScripts.flatMap((contentScript) => {
    const { matches, ...cleanContentScript } = contentScript;
    const result = {
      ...cleanContentScript,
      js: filterWarnAndAdd(contentScript.js, contentScript),
      css: filterWarnAndAdd(contentScript.css, contentScript)
    };
    return result.css.length + result.js.length === 0 ? [] : result;
  });
}

// node_modules/webext-polyfill-kinda/index.js
function NestedProxy(target) {
  return new Proxy(target, {
    get(target2, prop) {
      if (!target2[prop]) {
        return;
      }
      if (typeof target2[prop] !== "function") {
        return new NestedProxy(target2[prop]);
      }
      return (...arguments_) => new Promise((resolve, reject) => {
        target2[prop](...arguments_, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    }
  });
}
var chromeP = globalThis.chrome && new NestedProxy(globalThis.chrome);
var webext_polyfill_kinda_default = chromeP;

// node_modules/webext-content-scripts/index.js
var gotScripting = Boolean(globalThis.chrome?.scripting);
function castTarget(target) {
  return typeof target === "object" ? target : {
    tabId: target,
    frameId: 0
  };
}
function castAllFramesTarget(target) {
  if (typeof target === "object") {
    return { ...target, allFrames: false };
  }
  return {
    tabId: target,
    frameId: void 0,
    allFrames: true
  };
}
function castArray(possibleArray) {
  if (Array.isArray(possibleArray)) {
    return possibleArray;
  }
  return [possibleArray];
}
var nativeFunction = /^function \w+\(\) {[\n\s]+\[native code][\n\s]+}/;
async function executeFunction(target, function_, ...args) {
  if (nativeFunction.test(String(function_))) {
    throw new TypeError("Native functions need to be wrapped first, like `executeFunction(1, () => alert(1))`");
  }
  const { frameId, tabId } = castTarget(target);
  if (gotScripting) {
    const [injection] = await chrome.scripting.executeScript({
      target: {
        tabId,
        frameIds: [frameId]
      },
      func: function_,
      args
    });
    return injection?.result;
  }
  const [result] = await webext_polyfill_kinda_default.tabs.executeScript(tabId, {
    code: `(${function_.toString()})(...${JSON.stringify(args)})`,
    matchAboutBlank: true,
    // Needed for `srcdoc` frames; doesn't hurt normal pages
    frameId
  });
  return result;
}
function arrayOrUndefined(value) {
  return value === void 0 ? void 0 : [value];
}
async function insertCSS({ tabId, frameId, files, allFrames, matchAboutBlank, runAt }, { ignoreTargetErrors } = {}) {
  const everyInsertion = Promise.all(files.map(async (content) => {
    if (typeof content === "string") {
      content = { file: content };
    }
    if (gotScripting) {
      return chrome.scripting.insertCSS({
        target: {
          tabId,
          frameIds: arrayOrUndefined(frameId),
          allFrames: frameId === void 0 ? allFrames : void 0
        },
        files: "file" in content ? [content.file] : void 0,
        css: "code" in content ? content.code : void 0
      });
    }
    return webext_polyfill_kinda_default.tabs.insertCSS(tabId, {
      ...content,
      matchAboutBlank,
      allFrames,
      frameId,
      runAt: runAt ?? "document_start"
      // CSS should prefer `document_start` when unspecified
    });
  }));
  if (ignoreTargetErrors) {
    await catchTargetInjectionErrors(everyInsertion);
  } else {
    await everyInsertion;
  }
}
function assertNoCode(files) {
  if (files.some((content) => "code" in content)) {
    throw new Error("chrome.scripting does not support injecting strings of `code`");
  }
}
async function executeScript({ tabId, frameId, files, allFrames, matchAboutBlank, runAt }, { ignoreTargetErrors } = {}) {
  const normalizedFiles = files.map((file) => typeof file === "string" ? { file } : file);
  if (gotScripting) {
    assertNoCode(normalizedFiles);
    const injection = chrome.scripting.executeScript({
      target: {
        tabId,
        frameIds: arrayOrUndefined(frameId),
        allFrames: frameId === void 0 ? allFrames : void 0
      },
      files: normalizedFiles.map(({ file }) => file)
    });
    if (ignoreTargetErrors) {
      await catchTargetInjectionErrors(injection);
    } else {
      await injection;
    }
    return;
  }
  const executions = [];
  for (const content of normalizedFiles) {
    if ("code" in content) {
      await executions.at(-1);
    }
    executions.push(webext_polyfill_kinda_default.tabs.executeScript(tabId, {
      ...content,
      matchAboutBlank,
      allFrames,
      frameId,
      runAt
    }));
  }
  if (ignoreTargetErrors) {
    await catchTargetInjectionErrors(Promise.all(executions));
  } else {
    await Promise.all(executions);
  }
}
async function getTabsByUrl(matches, excludeMatches) {
  if (matches.length === 0) {
    return [];
  }
  const exclude = excludeMatches ? patternToRegex(...excludeMatches) : void 0;
  const tabs = await webext_polyfill_kinda_default.tabs.query({ url: matches });
  return tabs.filter((tab) => tab.id && tab.url && (exclude ? !exclude.test(tab.url) : true)).map((tab) => tab.id);
}
async function injectContentScript(where, scripts, options = {}) {
  const targets = castArray(where);
  await Promise.all(targets.map(async (target) => injectContentScriptInSpecificTarget(castAllFramesTarget(target), scripts, options)));
}
async function injectContentScriptInSpecificTarget({ frameId, tabId, allFrames }, scripts, options = {}) {
  const injections = castArray(scripts).flatMap((script) => [
    insertCSS({
      tabId,
      frameId,
      allFrames,
      files: script.css ?? [],
      matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
      runAt: script.runAt ?? script.run_at
    }, options),
    executeScript({
      tabId,
      frameId,
      allFrames,
      files: script.js ?? [],
      matchAboutBlank: script.matchAboutBlank ?? script.match_about_blank,
      runAt: script.runAt ?? script.run_at
    }, options)
  ]);
  await Promise.all(injections);
}
var blockedPrefixes = [
  "chrome.google.com/webstore",
  // Host *and* pathname
  "chromewebstore.google.com",
  "accounts-static.cdn.mozilla.net",
  "accounts.firefox.com",
  "addons.cdn.mozilla.net",
  "addons.mozilla.org",
  "api.accounts.firefox.com",
  "content.cdn.mozilla.net",
  "discovery.addons.mozilla.org",
  "input.mozilla.org",
  "install.mozilla.org",
  "oauth.accounts.firefox.com",
  "profile.accounts.firefox.com",
  "support.mozilla.org",
  "sync.services.mozilla.com",
  "testpilot.firefox.com"
];
function isScriptableUrl(url) {
  if (!url?.startsWith("http")) {
    return false;
  }
  const cleanUrl = url.replace(/^https?:\/\//, "");
  return blockedPrefixes.every((blocked) => !cleanUrl.startsWith(blocked));
}
var targetErrors = /^No frame with id \d+ in tab \d+.$|^No tab with id: \d+.$|^The tab was closed.$|^The frame was removed.$/;
async function catchTargetInjectionErrors(promise) {
  try {
    await promise;
  } catch (error) {
    if (!targetErrors.test(error?.message)) {
      throw error;
    }
  }
}

// node_modules/webext-dynamic-content-scripts/distribution/inject-to-existing-tabs.js
async function injectToExistingTabs(origins, scripts) {
  const excludeMatches = scripts.flatMap((script) => script.matches ?? []);
  return injectContentScript(await getTabsByUrl(origins, excludeMatches), scripts, { ignoreTargetErrors: true });
}

// node_modules/content-scripts-register-polyfill/ponyfill.js
var noMatchesError = "Type error for parameter contentScriptOptions (Error processing matches: Array requires at least 1 items; you have 0) for contentScripts.register.";
var noPermissionError = "Permission denied to register a content script for ";
var gotNavigation = typeof chrome === "object" && "webNavigation" in chrome;
async function isOriginPermitted(url) {
  return webext_polyfill_kinda_default.permissions.contains({
    origins: [new URL(url).origin + "/*"]
  });
}
async function registerContentScript(contentScriptOptions, callback) {
  const { js = [], css: css2 = [], matchAboutBlank, matches = [], excludeMatches, runAt } = contentScriptOptions;
  let { allFrames } = contentScriptOptions;
  if (gotNavigation) {
    allFrames = false;
  } else if (allFrames) {
    console.warn("`allFrames: true` requires the `webNavigation` permission to work correctly: https://github.com/fregante/content-scripts-register-polyfill#permissions");
  }
  if (matches.length === 0) {
    throw new Error(noMatchesError);
  }
  await Promise.all(matches.map(async (pattern) => {
    if (!await webext_polyfill_kinda_default.permissions.contains({ origins: [pattern] })) {
      throw new Error(noPermissionError + pattern);
    }
  }));
  const matchesRegex = patternToRegex(...matches);
  const excludeMatchesRegex = patternToRegex(...excludeMatches !== null && excludeMatches !== void 0 ? excludeMatches : []);
  const inject = async (url, tabId, frameId = 0) => {
    if (!matchesRegex.test(url) || excludeMatchesRegex.test(url) || !await isOriginPermitted(url)) {
      return;
    }
    await injectContentScript({
      tabId,
      frameId
    }, {
      css: css2,
      js,
      matchAboutBlank,
      runAt
    }, {
      ignoreTargetErrors: true
    });
  };
  const tabListener = async (tabId, { status }, { url }) => {
    if (status === "loading" && url) {
      void inject(url, tabId);
    }
  };
  const navListener = async ({ tabId, frameId, url }) => {
    void inject(url, tabId, frameId);
  };
  if (gotNavigation) {
    chrome.webNavigation.onCommitted.addListener(navListener);
  } else {
    chrome.tabs.onUpdated.addListener(tabListener);
  }
  const registeredContentScript = {
    async unregister() {
      if (gotNavigation) {
        chrome.webNavigation.onCommitted.removeListener(navListener);
      } else {
        chrome.tabs.onUpdated.removeListener(tabListener);
      }
    }
  };
  if (typeof callback === "function") {
    callback(registeredContentScript);
  }
  return registeredContentScript;
}

// node_modules/webext-dynamic-content-scripts/distribution/register-content-script-shim.js
var chromeRegister = globalThis.chrome?.scripting?.registerContentScripts;
var firefoxRegister = globalThis.browser?.contentScripts?.register;
async function registerContentScript2(contentScript) {
  if (chromeRegister) {
    const id = "webext-dynamic-content-script-" + JSON.stringify(contentScript);
    try {
      await chromeRegister([{
        ...contentScript,
        id
      }]);
    } catch (error) {
      if (!error?.message.startsWith("Duplicate script ID")) {
        throw error;
      }
    }
    return {
      unregister: async () => chrome.scripting.unregisterContentScripts({ ids: [id] })
    };
  }
  const firefoxContentScript = {
    ...contentScript,
    js: contentScript.js?.map((file) => ({ file })),
    css: contentScript.css?.map((file) => ({ file }))
  };
  if (firefoxRegister) {
    return firefoxRegister(firefoxContentScript);
  }
  return registerContentScript(firefoxContentScript);
}

// node_modules/webext-dynamic-content-scripts/distribution/lib.js
var registeredScripts = /* @__PURE__ */ new Map();
function makePathRelative(file) {
  return new URL(file, location.origin).pathname;
}
async function registerOnOrigins({ origins: newOrigins }) {
  const { content_scripts: rawManifest, manifest_version: manifestVersion } = chrome.runtime.getManifest();
  if (!rawManifest) {
    throw new Error("webext-dynamic-content-scripts tried to register scripts on the new host permissions, but no content scripts were found in the manifest.");
  }
  const cleanManifest = excludeDuplicateFiles(rawManifest, { warn: manifestVersion === 2 });
  for (const origin of newOrigins || []) {
    for (const config of cleanManifest) {
      const registeredScript = registerContentScript2({
        // Always convert paths here because we don't know whether Firefox MV3 will accept full URLs
        js: config.js?.map((file) => makePathRelative(file)),
        css: config.css?.map((file) => makePathRelative(file)),
        allFrames: config.all_frames,
        matches: [origin],
        excludeMatches: config.matches,
        runAt: config.run_at
      });
      registeredScripts.set(origin, registeredScript);
    }
  }
  void injectToExistingTabs(newOrigins || [], cleanManifest);
}
function handleNewPermissions(permissions) {
  if (permissions.origins && permissions.origins.length > 0) {
    void registerOnOrigins(permissions);
  }
}
async function handledDroppedPermissions({ origins }) {
  if (!origins || origins.length === 0) {
    return;
  }
  for (const [origin, scriptPromise] of registeredScripts) {
    if (origins.includes(origin)) {
      const script = await scriptPromise;
      void script.unregister();
    }
  }
}
async function init() {
  chrome.permissions.onRemoved.addListener(handledDroppedPermissions);
  chrome.permissions.onAdded.addListener(handleNewPermissions);
  await registerOnOrigins(await getAdditionalPermissions({
    strictOrigins: false
  }));
}

// node_modules/webext-dynamic-content-scripts/distribution/index.js
void init();

// node_modules/webext-dynamic-content-scripts/distribution/utils.js
function isContentScriptStaticallyRegistered(url) {
  return Boolean(chrome.runtime.getManifest().content_scripts?.flatMap((script) => script.matches).some((pattern) => patternToRegex(pattern).test(url)));
}
async function isContentScriptDynamicallyRegistered(url) {
  const { origins } = await getAdditionalPermissions({
    strictOrigins: false
  });
  return patternToRegex(...origins).test(url);
}
async function isContentScriptRegistered(url) {
  if (isContentScriptStaticallyRegistered(url)) {
    return "static";
  }
  if (await isContentScriptDynamicallyRegistered(url)) {
    return "dynamic";
  }
  return false;
}

// node_modules/webext-permission-toggle/node_modules/webext-detect-page/index.js
var cache = true;
function isCurrentPathname(path) {
  if (!path) {
    return false;
  }
  try {
    const { pathname } = new URL(path, location.origin);
    return pathname === location.pathname;
  } catch {
    return false;
  }
}
function getManifest(_version) {
  return globalThis.chrome?.runtime?.getManifest?.();
}
function once(function_) {
  let result;
  return () => {
    if (!cache || result === void 0) {
      result = function_();
    }
    return result;
  };
}
var isWebPage = once(() => ["about:", "http:", "https:"].includes(location.protocol));
var isExtensionContext = once(() => typeof globalThis.chrome?.extension === "object");
var isContentScript = once(() => isExtensionContext() && isWebPage());
var isBackground = () => isBackgroundPage() || isBackgroundWorker();
var isBackgroundPage = once(() => {
  const manifest = getManifest(2);
  if (manifest && isCurrentPathname(manifest.background_page ?? manifest.background?.page)) {
    return true;
  }
  return Boolean(manifest?.background?.scripts && isCurrentPathname("/_generated_background_page.html"));
});
var isBackgroundWorker = once(() => isCurrentPathname(getManifest(3)?.background?.service_worker));
var isPersistentBackgroundPage = once(() => isBackgroundPage() && getManifest(2)?.manifest_version === 2 && getManifest(2)?.background?.persistent !== false);
var isOptionsPage = once(() => {
  const path = getManifest()?.options_ui?.page;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isSidePanel = once(() => {
  const path = getManifest(3)?.["side_panel"]?.default_path;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isDevToolsPage = once(() => {
  const devtoolsPage = isExtensionContext() && chrome.devtools && getManifest()?.devtools_page;
  if (typeof devtoolsPage !== "string") {
    return false;
  }
  const url = new URL(devtoolsPage, location.origin);
  return url.pathname === location.pathname;
});
var isDevTools = () => Boolean(globalThis.chrome?.devtools);
var isChrome = () => globalThis.navigator?.userAgent.includes("Chrome");
var contextChecks = {
  contentScript: isContentScript,
  background: isBackground,
  options: isOptionsPage,
  sidePanel: isSidePanel,
  devTools: isDevTools,
  devToolsPage: isDevToolsPage,
  extension: isExtensionContext,
  web: isWebPage
};
var contextNames = Object.keys(contextChecks);

// node_modules/webext-permissions/distribution/index.js
function normalizeManifestPermissions(manifest = chrome.runtime.getManifest()) {
  const manifestPermissions = {
    origins: [],
    permissions: []
  };
  const list = /* @__PURE__ */ new Set([
    ...manifest.permissions ?? [],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Not sure why it's being a PITA
    ...manifest.host_permissions ?? [],
    ...(manifest.content_scripts ?? []).flatMap((config) => config.matches ?? [])
  ]);
  if (manifest.devtools_page && !manifest.optional_permissions?.includes("devtools")) {
    list.add("devtools");
  }
  for (const permission of list) {
    if (permission.includes("://") || permission === "<all_urls>") {
      manifestPermissions.origins.push(permission);
    } else {
      manifestPermissions.permissions.push(permission);
    }
  }
  return dropOverlappingPermissions(manifestPermissions);
}
function isUrlPermittedByManifest(origin, manifest = chrome.runtime.getManifest()) {
  const manifestPermissions = normalizeManifestPermissions(manifest);
  const originsRegex = patternToRegex(...manifestPermissions.origins);
  return originsRegex.test(origin);
}
function dropOverlappingPermissions({ origins, permissions }) {
  return {
    origins: origins ? excludeDuplicatePatterns(origins) : [],
    permissions: permissions ? [...permissions] : []
  };
}

// node_modules/webext-tools/index.js
function castTarget2(target) {
  return typeof target === "object" ? target : {
    tabId: target,
    frameId: 0
  };
}
async function getTabUrl(target) {
  const { frameId, tabId } = castTarget2(target);
  try {
    if (frameId === 0 && "tabs" in globalThis.chrome) {
      const tab = await webext_polyfill_kinda_default.tabs.get(tabId);
      if (tab.url) {
        return tab.url;
      }
    }
    return await executeFunction(target, () => location.href);
  } catch {
    return void 0;
  }
}

// node_modules/webext-events/distribution/on-context-invalidated.js
var OnContextInvalidated = class {
  #timer;
  #controller = new AbortController();
  // Calling this will start the polling
  get signal() {
    if (this.#timer) {
      return this.#controller.signal;
    }
    this.#timer = setInterval(() => {
      if (wasContextInvalidated()) {
        this.#controller.abort();
        clearInterval(this.#timer);
      }
    }, 200);
    return this.#controller.signal;
  }
  get promise() {
    return new Promise((resolve) => {
      this.addListener(resolve);
    });
  }
  /**
   *
   * @param callback         The function to call when the context is invalidated
   * @param options.signal   The signal to remove the listener, like with the regular `addEventListener()`
   */
  addListener(callback, { signal } = {}) {
    if (this.signal.aborted && !signal?.aborted) {
      setTimeout(callback, 0);
      return;
    }
    this.signal.addEventListener("abort", callback, { once: true, signal });
  }
};
var onContextInvalidated = new OnContextInvalidated();
var wasContextInvalidated = () => !chrome.runtime?.id;

// node_modules/webext-events/node_modules/webext-detect-page/index.js
var cache2 = true;
function isCurrentPathname2(path) {
  if (!path) {
    return false;
  }
  try {
    const { pathname } = new URL(path, location.origin);
    return pathname === location.pathname;
  } catch {
    return false;
  }
}
function getManifest2(_version) {
  return globalThis.chrome?.runtime?.getManifest?.();
}
function once2(function_) {
  let result;
  return () => {
    if (!cache2 || result === void 0) {
      result = function_();
    }
    return result;
  };
}
var isWebPage2 = once2(() => ["about:", "http:", "https:"].includes(location.protocol));
var isExtensionContext2 = once2(() => typeof globalThis.chrome?.extension === "object");
var isContentScript2 = once2(() => isExtensionContext2() && isWebPage2());
var isBackground2 = () => isBackgroundPage2() || isBackgroundWorker2();
var isBackgroundPage2 = once2(() => {
  const manifest = getManifest2(2);
  if (manifest && isCurrentPathname2(manifest.background_page ?? manifest.background?.page)) {
    return true;
  }
  return Boolean(manifest?.background?.scripts && isCurrentPathname2("/_generated_background_page.html"));
});
var isBackgroundWorker2 = once2(() => isCurrentPathname2(getManifest2(3)?.background?.service_worker));
var isPersistentBackgroundPage2 = once2(() => isBackgroundPage2() && getManifest2(2)?.manifest_version === 2 && getManifest2(2)?.background?.persistent !== false);
var isOptionsPage2 = once2(() => {
  const path = getManifest2()?.options_ui?.page;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isSidePanel2 = once2(() => {
  const path = getManifest2(3)?.["side_panel"]?.default_path;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isDevToolsPage2 = once2(() => {
  const devtoolsPage = isExtensionContext2() && chrome.devtools && getManifest2()?.devtools_page;
  if (typeof devtoolsPage !== "string") {
    return false;
  }
  const url = new URL(devtoolsPage, location.origin);
  return url.pathname === location.pathname;
});
var isDevTools2 = () => Boolean(globalThis.chrome?.devtools);
var isChrome2 = () => globalThis.navigator?.userAgent.includes("Chrome");
var contextChecks2 = {
  contentScript: isContentScript2,
  background: isBackground2,
  options: isOptionsPage2,
  sidePanel: isSidePanel2,
  devTools: isDevTools2,
  devToolsPage: isDevToolsPage2,
  extension: isExtensionContext2,
  web: isWebPage2
};
var contextNames2 = Object.keys(contextChecks2);

// node_modules/webext-events/distribution/on-extension-start.js
var storageKey = "__webext-events__startup";
var event = new EventTarget();
var hasRun = false;
var hasListeners = false;
var browserStorage = globalThis.browser?.storage ?? globalThis.chrome?.storage;
async function runner() {
  hasRun = true;
  if (!hasListeners) {
    return;
  }
  if (isPersistentBackgroundPage2()) {
    event.dispatchEvent(new Event("extension-start"));
    return;
  }
  if (!browserStorage?.session) {
    if (isChrome2() && chrome.runtime.getManifest().manifest_version === 2) {
      console.warn("onExtensionStart is unable to determine whether it\u2019s being run for the first time on MV2 Event Pages in Chrome. It will run the listeners anyway.");
    } else {
      console.warn("onExtensionStart is unable to determine whether it\u2019s being run for the first time without the `storage` permission. It will run the listeners anyway");
    }
    event.dispatchEvent(new Event("extension-start"));
    return;
  }
  const storage = await browserStorage.session.get(storageKey);
  if (storageKey in storage) {
    return;
  }
  await browserStorage.session.set({ [storageKey]: true });
  event.dispatchEvent(new Event("extension-start"));
}
var onExtensionStart = Object.freeze({
  addListener(callback) {
    if (hasRun) {
      console.warn("onExtensionStart.addListener() was called after the extension started. The callback will not be called.");
    } else {
      hasListeners = true;
      event.addEventListener("extension-start", callback);
    }
  },
  removeListener(callback) {
    event.removeEventListener("extension-start", callback);
  }
});
setTimeout(runner, 100);

// node_modules/webext-events/distribution/one-event.js
async function oneEvent(event2, filter) {
  await new Promise((resolve) => {
    const listener = (...parameters) => {
      if (!filter || filter(...parameters)) {
        resolve();
        event2.removeListener(listener);
      }
    };
    event2.addListener(listener);
  });
}

// node_modules/webext-alert/node_modules/webext-detect-page/index.js
var cache3 = true;
function isCurrentPathname3(path) {
  if (!path) {
    return false;
  }
  try {
    const { pathname } = new URL(path, location.origin);
    return pathname === location.pathname;
  } catch {
    return false;
  }
}
function getManifest3(_version) {
  return globalThis.chrome?.runtime?.getManifest?.();
}
function once3(function_) {
  let result;
  return () => {
    if (!cache3 || result === void 0) {
      result = function_();
    }
    return result;
  };
}
var isWebPage3 = once3(() => ["about:", "http:", "https:"].includes(location.protocol));
var isExtensionContext3 = once3(() => typeof globalThis.chrome?.extension === "object");
var isContentScript3 = once3(() => isExtensionContext3() && isWebPage3());
var isBackground3 = () => isBackgroundPage3() || isBackgroundWorker3();
var isBackgroundPage3 = once3(() => {
  const manifest = getManifest3(2);
  if (manifest && isCurrentPathname3(manifest.background_page ?? manifest.background?.page)) {
    return true;
  }
  return Boolean(manifest?.background?.scripts && isCurrentPathname3("/_generated_background_page.html"));
});
var isBackgroundWorker3 = once3(() => isCurrentPathname3(getManifest3(3)?.background?.service_worker));
var isPersistentBackgroundPage3 = once3(() => isBackgroundPage3() && getManifest3(2)?.manifest_version === 2 && getManifest3(2)?.background?.persistent !== false);
var isOptionsPage3 = once3(() => {
  const path = getManifest3()?.options_ui?.page;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isSidePanel3 = once3(() => {
  const path = getManifest3(3)?.["side_panel"]?.default_path;
  if (typeof path !== "string") {
    return false;
  }
  const url = new URL(path, location.origin);
  return url.pathname === location.pathname;
});
var isDevToolsPage3 = once3(() => {
  const devtoolsPage = isExtensionContext3() && chrome.devtools && getManifest3()?.devtools_page;
  if (typeof devtoolsPage !== "string") {
    return false;
  }
  const url = new URL(devtoolsPage, location.origin);
  return url.pathname === location.pathname;
});
var isDevTools3 = () => Boolean(globalThis.chrome?.devtools);
var isChrome3 = () => globalThis.navigator?.userAgent.includes("Chrome");
var contextChecks3 = {
  contentScript: isContentScript3,
  background: isBackground3,
  options: isOptionsPage3,
  sidePanel: isSidePanel3,
  devTools: isDevTools3,
  devToolsPage: isDevToolsPage3,
  extension: isExtensionContext3,
  web: isWebPage3
};
var contextNames3 = Object.keys(contextChecks3);

// node_modules/webext-alert/index.js
async function onPopupClose(watchedWindowId) {
  await oneEvent(chrome.windows.onRemoved, (closedWindowId) => closedWindowId === watchedWindowId);
}
function pageScript() {
  const button = document.querySelector("button");
  button.addEventListener("click", (_) => {
    window.close();
  });
  window.addEventListener("blur", (_) => {
    window.close();
  });
  window.resizeBy(0, document.body.scrollHeight - window.innerHeight);
  window.moveTo((screen.width - window.outerWidth) / 2, (screen.height - window.outerHeight) / 2);
  button.focus();
}
var css = (
  /* css */
  `
	/*! https://npm.im/webext-base-css */

	/* Chrome only: -webkit-hyphens */
	/* Safari only: _::-webkit-full-page-media */

	/* webpackIgnore: true */
	@import url('chrome://global/skin/in-content/common.css') (min--moz-device-pixel-ratio:0); /* Firefox-only */

	:root {
		--background-color-for-chrome: #292a2d;
		max-width: 700px;
		margin: auto;
	}

	body {
		--body-margin-h: 8px;
		margin-left: var(--body-margin-h);
		margin-right: var(--body-margin-h);
	}

	/* Selector matches Firefox\u2019 */
	input[type='number'],
	input[type='password'],
	input[type='search'],
	input[type='text'],
	input[type='url'],
	input:not([type]),
	textarea {
		display: block;
		box-sizing: border-box;
		margin-left: 0;
		width: 100%;
		resize: vertical;
		-moz-tab-size: 4 !important;
		tab-size: 4 !important;
	}

	input[type='checkbox'] {
		vertical-align: -0.15em;
	}

	@supports (not (-webkit-hyphens:none)) and (not (-moz-appearance:none)) and (list-style-type:'*') {
		textarea:focus {
			/* Inexplicably missing from Chrome\u2019s input style https://github.com/chromium/chromium/blob/6bea0557fe/extensions/renderer/resources/extension.css#L287 */
			border-color: #4d90fe;
			transition: border-color 200ms;
		}
	}

	hr {
		margin-right: calc(-1 * var(--body-margin-h));
		margin-left: calc(-1 * var(--body-margin-h));
		border: none;
		border-bottom: 1px solid #aaa4;
	}

	img {
		vertical-align: middle;
	}

	_::-webkit-full-page-media,
	_:future,
	:root {
		font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Apple Color Emoji';
	}

	_::-webkit-full-page-media,
	_:future,
	input[type='number'],
	input[type='password'],
	input[type='search'],
	input[type='text'],
	input[type='url'],
	input:not([type]),
	textarea {
		border: solid 1px #888;
		padding: 0.4em;
		font: inherit;
		-webkit-appearance: none;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			color-scheme: dark;
			background-color: var(--background-color-for-chrome);
		}

		body,
		h3 { /* Chrome #3 */
			color: #e8eaed;
		}

		a {
			color: var(--link-color, #8ab4f8);
		}

		a:active {
			color: var(--link-color-active, #b6d3f9);
		}

		input[type='number'],
		input[type='password'],
		input[type='search'],
		input[type='text'],
		input[type='url'],
		input:not([type]),
		textarea {
			color: inherit;
			background-color: transparent;
		}
	}

	/* End webext-base-css */

	body {
		box-sizing: border-box;
		min-height: 100vh;
		margin: 0;
		padding: 1em;
		justify-content: center;
		display: flex;
		flex-direction: column;
		font-size: 14px;
		line-height: 1.5;
		font-family: system, system-ui, sans-serif;
	}

	button {
		margin-top: 1em;
		margin-left: auto;
	}
`
);
function getPage(message = "") {
  return (
    /* html */
    `
		<!doctype html>
		<meta charset="utf-8" />
		<title>${chrome.runtime.getManifest().name}</title>
		<style>${css}</style>
		<script defer src="alert.js"><\/script>
		<body>
			<main>${message}</main>
			<button>Ok</button>
		</body>
		<script>(${pageScript.toString()})()<\/script>
	`
  );
}
async function popupAlert(message) {
  const width = 420;
  const height = 150;
  const popup = await chrome.windows.create({
    type: "popup",
    url: "data:text/html," + encodeURIComponent(getPage(message)),
    focused: true,
    height,
    width
  });
  await onPopupClose(popup.id);
}
var webextAlert = isBackgroundWorker3() || !isChrome3() && isBackgroundPage3() ? popupAlert : alert;
var webext_alert_default = webextAlert;

// node_modules/webext-permission-toggle/index.js
var contextMenuId = "webext-permission-toggle:add-permission";
var globalOptions;
var chromeP2 = isChrome() && globalThis.chrome?.runtime?.getManifest().manifest_version < 3 ? webext_polyfill_kinda_default : chrome;
function assertTab(tab) {
  if (!tab?.id) {
    throw new Error("The browser didn't supply any information about the active tab.");
  }
}
function assertUrl(url) {
  if (!url) {
    throw new Error("The browser didn't supply the current page's URL.");
  }
}
function assertScriptableUrl(url) {
  if (!isScriptableUrl(url)) {
    throw new Error(chrome.runtime.getManifest().name + " can't be enabled on this page.");
  }
}
async function isOriginPermanentlyAllowed(origin) {
  return chromeP2.permissions.contains({
    origins: [origin + "/*"]
  });
}
function updateItemRaw({ checked, enabled }) {
  chrome.contextMenus.update(contextMenuId, {
    checked,
    enabled
  });
}
async function updateItem(url) {
  if (!url) {
    updateItemRaw({
      enabled: true,
      checked: false
    });
    return;
  }
  if (isScriptableUrl(url)) {
    const { origin } = new URL(url);
    const isDefault = isUrlPermittedByManifest(url);
    updateItemRaw({
      enabled: !isDefault,
      // We might have temporary permission as part of `activeTab`, so it needs to be properly checked
      checked: isDefault || await isOriginPermanentlyAllowed(origin)
    });
    return;
  }
  updateItemRaw({
    enabled: false,
    checked: false
  });
}
async function setPermission(url, request) {
  const permissionData = {
    origins: [
      new URL(url).origin + "/*"
    ]
  };
  await chromeP2.permissions[request ? "request" : "remove"](permissionData);
  return chromeP2.permissions.contains(permissionData);
}
async function handleTabActivated({ tabId }) {
  void updateItem(await getTabUrl(tabId) ?? "");
}
async function handleClick({ checked, menuItemId }, tab) {
  if (menuItemId !== contextMenuId) {
    return;
  }
  let url;
  try {
    assertTab(tab);
    url = tab.url ?? await getTabUrl(tab.id);
    assertUrl(url);
    assertScriptableUrl(url);
    const permissionExistsNow = await setPermission(url, checked);
    const settingWasSuccessful = permissionExistsNow === checked;
    if (!settingWasSuccessful) {
      updateItemRaw({
        checked: permissionExistsNow
      });
    }
    if (permissionExistsNow && globalOptions.reloadOnSuccess) {
      void executeFunction(tab.id, (message) => {
        if (confirm(message)) {
          location.reload();
        }
      }, globalOptions.reloadOnSuccess);
    }
  } catch (error) {
    setTimeout(updateItem, 500, url);
    if (tab?.id) {
      try {
        await executeFunction(tab.id, (text) => {
          window.alert(text);
        }, String(error));
      } catch {
        void webext_alert_default(String(error));
      }
    }
    throw error;
  }
}
function addPermissionToggle(options) {
  if (!isBackground()) {
    throw new Error("webext-permission-toggle can only be called from a background page");
  }
  if (globalOptions) {
    throw new Error("webext-permission-toggle can only be initialized once");
  }
  const manifest = chrome.runtime.getManifest();
  if (!manifest.permissions?.includes("contextMenus")) {
    throw new Error("webext-permission-toggle requires the `contextMenus` permission");
  }
  if (!chrome.contextMenus) {
    console.warn("chrome.contextMenus is not available");
    return;
  }
  globalOptions = {
    title: `Enable ${manifest.name} on this domain`,
    reloadOnSuccess: false,
    ...options
  };
  if (globalOptions.reloadOnSuccess === true) {
    globalOptions.reloadOnSuccess = `Do you want to reload this page to apply ${manifest.name}?`;
  }
  const optionalHosts = [
    ...manifest.optional_permissions ?? [],
    ...manifest.optional_host_permissions ?? []
  ].filter((permission) => permission === "<all_urls>" || permission.includes("*"));
  if (optionalHosts.length === 0) {
    throw new TypeError("webext-permission-toggle requires some wildcard hosts to be specified in `optional_permissions` (MV2) or `optional_host_permissions` (MV3)");
  }
  chrome.contextMenus.remove(contextMenuId, () => chrome.runtime.lastError);
  const contexts = manifest.manifest_version === 2 ? ["page_action", "browser_action"] : ["action"];
  chrome.contextMenus.create({
    id: contextMenuId,
    type: "checkbox",
    checked: false,
    title: globalOptions.title,
    contexts,
    // Note: This is completely ignored by Chrome and Safari. Great. #14
    documentUrlPatterns: optionalHosts
  });
  chrome.contextMenus.onClicked.addListener(handleClick);
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(async (tabId, { status }, { url, active }) => {
    if (active && status === "complete") {
      void updateItem(url ?? await getTabUrl(tabId) ?? "");
    }
  });
}
export {
  addPermissionToggle,
  isContentScriptRegistered
};
