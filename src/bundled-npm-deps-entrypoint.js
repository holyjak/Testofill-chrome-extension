// Entrypoint for esbuild to create a bundle of npm dependencies we need for our
// service worker.

/* This import will run a fn that hooks it into the system so that when 
 * the user gives access permission for a domain, it will automatically inject
 * the content script (obtained from the manifest) into the page. */
import 'webext-dynamic-content-scripts';
import { isContentScriptRegistered } from 'webext-dynamic-content-scripts/utils.js';

/* A module to add an option to enable the extension for a domain into the
 * extension's own menu. */
import addPermissionToggle from 'webext-permission-toggle';
export { addPermissionToggle, isContentScriptRegistered }; // re-export for the service-worker & friends