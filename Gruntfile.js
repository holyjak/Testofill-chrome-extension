module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      src: ['Gruntfile.js', 'src/content/*.js','src/extension/*.js'],
      options: {
        //maxlen: 80,
        //quotmark: 'single'
      }
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'tap'
      },
      all: { src: ['test/*.js'] }
    },
    concat: {
       content: {
          src: ['lib/shared/*.js','lib/content/*.js','src/content/*.js'],
          dest: 'src/extension/generated/testofill-content-packed.js'
       }
//        ,extension: {
//           src: ['lib/shared/*.js','lib/extension/**/*.js'],
//           dest: 'src/extension/generated/extension-lib-packed.js'
//        }
    },
    compress: {
      main: {
        options: {
          archive: 'Testofill-dist.zip'
        },
        expand: true,
        cwd: 'src/extension/',
        src: ['**'],
      }
    },
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'src/**/*.js', '!src/extension/generated/**/*', 'test/**/*.js'],
        tasks: ['development']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('development', ['jshint', 'simplemocha','concat']);
  grunt.registerTask('default', ['jshint', 'simplemocha','concat','compress']);

};
