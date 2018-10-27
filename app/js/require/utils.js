/* jshint node:true */
/* global
    $, document, require, __dirname */

'use strict';

// global variables
const VERSION = 'v0.1.0-rc.2.0.25';


// pieces of electron
const electron = require('electron');
const { ipcRenderer, remote } = electron;
const { BrowserWindow } = remote;

// npm
const batteryLevel = require('battery-level');

const isCharging = require('is-charging');
const loudness = require('loudness');
const osxBattery = require('osx-battery');

const Store = require('electron-store');
const { spawn, exec, execSync } = require('child_process');
const path = require('path');

var store = new Store();

// my own shit
const ExternalModule = require( path.resolve(__dirname, 'ExternalModule.js')).ExternalModule;
const TaskMonitor = require(path.resolve(__dirname, 'TaskMonitor.js')).TaskMonitor;
const ModuleManager = require(path.resolve(__dirname, 'ModuleManager.js')).ModuleManager;

const console = remote.getGlobal('console');


module.exports = {
  moduleManager: new ModuleManager(),
  store: new Store(),

  openApp: function (appName) {
    var command = "open -a " + appName;
    execSync(command);
  },

  removeFromArray: function (array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
      array.splice(index, 1);
    }
  },

  isInArray: function (array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
      return true;
    } else {
      return false;
    }
  },

  fileExists: function (path) {
    var fs = require('fs');
    if (fs.existsSync(path)) {
      return (true);
    }
    return (false);
  },

  toggleClass: function (element, tclass) {
    if (element.classList.contains(tclass) == true) {
      element.classList.remove(tclass);
    } else {
      element.classList.add(tclass);
    }
  },

  initializePywalLink: function (fileref) {
    var filepath = path.resolve("./app/css/colors-wal.css");

    try {
      execSync("ln -s $HOME/.cache/wal/colors.css " + filepath);
    } catch (e) {
      // file exists.
    }
  },

  makePathFromRoot: function (relativePath) {
    var projectRoot = path.dirname(require.main.filename);
    return (path.join(projectRoot,relativePath));
  },

  initializeSettings: function () {
    console.log("Initialising preferences...");
    module.exports.initializePywalLink();

    store.set("version", VERSION);

    store.set("hideIcon", "showIcon");

    store.set("theme", module.exports.makePathFromRoot("/css/mono.css"));
    store.set("colorscheme", module.exports.makePathFromRoot("/css/colors.css"));
    store.set("player", module.exports.makePathFromRoot("/js/require/mpd.js"));

    store.set("commands", {
      "ssh":"ssh",
      "top":"top"
    });

    store.set("modules", [{
        "filename": "desktop",
        "enabled": true
      },
      {
        "filename": "date",
        "enabled": true
      },
      {
        "filename": "player",
        "enabled": true
      },
      {
        "filename": "launcher",
        "enabled": true
      },
      {
        "filename": "taskbar",
        "enabled": false
      },
      {
        "filename": "chunkwm",
        "enabled": true
      },
      {
        "filename": "battery",
        "enabled": true
      },
      {
        "filename": "volume",
        "enabled": true
      },
      {
        "filename": "wifi",
        "enabled": true
      },
      {
        "filename": "settings",
        "enabled": true
      },
      {
        "filename": "time",
        "enabled": true
      },
      {
        "filename": "window",
        "enabled": true
      },
    ]);
  },

  adaptToContent:function () {
    var topMargin = parseInt($("body").css('--top-margin'));
    var leftMargin = parseInt($("body").css('--left-margin'));
    var rightMargin = parseInt($("body").css('--right-margin'));
    var lineSize = parseInt($("body").css('--line-size'));

    //This gives the bar square corners. The window, which the system always draws with round corners, is actually a bit bigger than the bar – the bar doesn't fill it ocmpletely, so it can have WHATEVER FUCKING CORNERS IT WANTS

    var overflowCorrect = parseInt($("body").css('--overflow-correct') || 0);
    var shadowCorrect = parseInt($("body").css('--shadow-correct') || 0);

    var totalMargin = (leftMargin + rightMargin) - overflowCorrect * 2;

    // Since we'll be applying some of these to the window itself, we reset them in the .css

    var {
      width,
      height
    } = electron.screen.getPrimaryDisplay().workAreaSize;

    var barWidth = width - totalMargin;
    var barHeight = lineSize;

    ipcRenderer.send('resize', leftMargin - overflowCorrect, topMargin, barWidth, barHeight + shadowCorrect);
  },

  loadSettings:function (element, settings = ["theme", "colorscheme", "player"]) {
    console.log("Loading preferences...");

    // Check if settings have been updated since last version
    if (store.get("version") != VERSION) {
      console.log("*** WARNING: Updating settings to new version. This will delete your preferences. I feel bad, but it's the only way to make sure that you don't miss out on the new features.");
      module.exports.initializeSettings();
    }

    for (var i = 0; i < settings.length; i++) {
      var node = document.getElementById(settings[i]);
        if (node) {
          node.parentNode.removeChild(node);
        }

      if (!module.exports.fileExists(store.get(settings[i]))) {
        module.exports.initializeSettings();
      }

      try {
        let externalModule = new ExternalModule(store.get(settings[i]), settings[i]);
        externalModule.loadIn(element);
      } catch (e) {
        // Settings have not been initialised
        module.exports.initializeSettings();
        module.exports.loadSettings();
      }
    }
    setTimeout(module.exports.adaptToContent, 1000);
  },
};
