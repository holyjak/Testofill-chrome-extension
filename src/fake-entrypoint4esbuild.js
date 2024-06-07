// Dummy entrypoint for esbuild to create the bundle we need for our
// service worker. I'm sure there are better ways to do this...

/* This import will run a fn that hooks it into the system so that when 
 * the user gives access permission for a domain, it will automatically inject
 * the content script (obtained from the manifest) into the page. */
import 'webext-dynamic-content-scripts';
/* A module to add an option to enable the extension for a domain into the
 * extension's own menu. */
import addPermissionToggle from 'webext-permission-toggle';
export { addPermissionToggle }; // re-export for the service-worker