module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
       content: {
          src: ['lib/shared/*.js','lib/content/*.js','src/content/testofill-run.js'],
	        dest: 'src/extension/generated/testofill-content-packed.js'
       }
//        ,extension: {
//           src: ['lib/shared/*.js','lib/extension/**/*.js'],
// 	        dest: 'src/extension/generated/extension-lib-packed.js'
//        }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['concat']);

};

