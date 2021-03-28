<template>
  <div id="app">
    <div v-if='!isWebGLEnabled'>
      <div class='absolute no-webgl'>
        <h4>WebGL is not enabled :(</h4>
        <p>This website needs <a href='https://en.wikipedia.org/wiki/WebGL' class='accent'>WebGL</a> to render a map of reddit.
        </p> <p>
        You can try another browser. If the problem persists - very likely your video card isn't supported.
        </p>
      </div>
    </div>
    <div v-if='isWebGLEnabled'>
    <transition name='fade'>
      <div class='progress' v-if='progressMessage'>{{progressMessage}}</div>
    </transition>
    <transition name='fade'>
      <div class='progress subgraph' v-if='subgraphName'>
        Only <a href='#' class='accent' @click.prevent='onSubgraphRootClick'>/r/{{subgraphName}}</a> related subreddits are shown.
        <a href='#' class='accent' @click.prevent='onExitSubgraph'>view all</a>
      </div>
    </transition>
    <subreddit v-if="subreddit" :name="subreddit" class="preview" @declineAge='onDeclineAge'>
      <template slot='after-title'>
        <div>
          <a href='#' class='subreddit-action' @click.prevent='showRelated' v-if='graphLoaded'>Show related</a>
          <span v-if='!graphLoaded' class='subreddit-action'>the map is still loading...</span>
        </div>
      </template>
    </subreddit>
    <form @submit.prevent="onSubmit" class="search-box">
      <typeahead
        placeholder="Find subreddit"
        @menuClicked='sidebarVisible = true'
        @selected='findSubreddit'
        @beforeClear='closeSubredditOnSmallScreen'
        @cleared='closeSubredditViewer'
        @inputChanged='onTypeAheadInput'
        :showClearButton="subreddit"
        :query="appState.query"
      ></typeahead>
    </form>
    <a href='#' @click.prevent='onImproveClick' class='accent improve'>Improve this map</a>
    <transition name='slide-bottom'>
      <small-preview v-if="smallPreview" :name="smallPreview" class="small-preview"></small-preview>
    </transition>

    <transition name='slide-top'>
      <improve-window v-if='improveVisible' @close='improveVisible = false' class='improve-window'></improve-window>
    </transition>

    <tooltip
      v-if="tooltip"
      :style="{
      left: tooltip.x + 'px',
      top: tooltip.y + 'px'
    }"
      :data="tooltip"
      class="tooltip"
    ></tooltip>

    <transition name='fade'>
      <div class='backdrop' v-if='sidebarVisible || improveVisible' @click="onBackdropClick"></div>
    </transition>
    <transition name='slide-left'>
      <sidebar v-if="sidebarVisible" @close='sidebarVisible = false'></sidebar>
    </transition>
    </div>
  </div>
</template>

<script>
import "vuereddit/dist/vuereddit.css";

import createStreamingSVGRenderer from './lib/createStreamingSVGRenderer';
import Tooltip from "./Tooltip";
import Typeahead from "./components/Typeahead";
import Sidebar from "./components/Sidebar";
import ImproveWindow from "./components/ImproveWindow";
import Subreddit from "vuereddit";
import SmallPreview from "./SmallPreview";
import appState from "./appState.js";
import createFirstInteractionListener from './lib/createFirstInteractionListener';
import {isWebGLEnabled} from 'w-gl';

import bus from "./lib/bus";

export default {
  components: {
    Tooltip,
    Typeahead,
    Subreddit,
    Sidebar,
    ImproveWindow,
    SmallPreview
  },
  name: "app",
  methods: {
    showRelated() {
      this.scene.showRelated(this.subreddit);
      if (isSmallScreen()) {
        // move panel to the bottom
        this.smallPreview = this.subreddit;
        this.subreddit = null;
      }
    },
    findSubreddit(q) {
      appState.query = q;
      this.onSubmit();
    },
    closeSubredditOnSmallScreen(payload) {
      appState.userTypedSomething = true;
      if (isSmallScreen() && this.subreddit) {
        // First time - just close the subreddit, second time - clear all
        payload.shouldProceed = false;
        this.subreddit = null;
        this.scene.focus();
      } 
    },
    onTypeAheadInput() {
      this.typeaheadChanged = true;
      appState.userTypedSomething = true;
    },
    onDeclineAge(e) {
      e.preventDefault();
      this.closeSubredditViewer();
    },
    onBackdropClick() {
      this.sidebarVisible = false;
      this.improveVisible = false;
    },
    onImproveClick() {
      this.improveVisible = true;
    },
    closeSubredditViewer() {
      this.subreddit = null;
      this.smallPreview = null;
      appState.query = '';
      appState.saveQuery(appState.query);
      bus.fire('unfocus');
    },
    showTooltip(e) {
      if (e) {
        this.tooltip = e;
      } else {
        this.tooltip = null;
      }
    },
    onSubmit() {
      bus.fire('focus-node', appState.query);
      appState.saveQuery(appState.query);
      this.subgraphName = null;
    },
    onSubgraphRootClick() {
      bus.fire('subgraph-focus-node', this.subgraphName);
    },
    onExitSubgraph() {
      bus.fire('exit-subgraph');
      this.subgraphName = null;
    },
    showSubreddit(subreddit, forceFullView) {
      if (isSmallScreen() && !forceFullView) {
        this.smallPreview = subreddit;
      } else {
        this.smallPreview = null;
        this.subreddit = subreddit;
      }
      appState.query = subreddit;
      this.tooltip = null;
      appState.saveQuery(appState.query);
    },

    setProgress(progress) {
      if (progress && progress.mapLoaded) {
        // last message!
        if (!this.typeaheadChanged) {
          this.progressMessage = progress.error ? 'Something is likely not right...' : 'Map is ready to use. Please enjoy';
        }
        this.graphLoaded = true;
        this.disposeFirstListener = createFirstInteractionListener(() => {
          setTimeout(() => this.progressMessage = null, 3000);
        });
      } else if (progress && progress.subgraphDone) {
        this.progressMessage = null;
        this.subgraphName = progress.subgraphName;
      } else if (progress) {
        this.progressMessage = progress.message;
        this.subgraphVisualized = null;
      } 
    }
  },
  data() {
    return {
      improveVisible: false,
      isWebGLEnabled: false,
      typeaheadChanged: false,
      tooltip: null,
      subgraphName: null,
      subreddit: null,
      smallPreview: null,
      sidebarVisible: false,
      progressMessage: '',
      graphLoaded: false,
      appState,
    };
  },
  mounted() {
    const canvas = document.getElementById("cnv");
    this.isWebGLEnabled = isWebGLEnabled(canvas);
    if (!this.isWebGLEnabled) return;

    let svgRenderer = createStreamingSVGRenderer(canvas);
    let path = appState.getFilePath();
    svgRenderer.loadSVG(path);
    this.scene = svgRenderer;

    bus.on('show-tooltip', this.showTooltip);
    bus.on('show-subreddit', this.showSubreddit);
    bus.on('progress', this.setProgress);
  },

  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.disposeFirstListener) {
      this.disposeFirstListener();
    }
    bus.off('show-tooltip', this.showTooltip);
    bus.off('show-subreddit', this.showSubreddit);
    bus.off('progress', this.setProgress);
  }
};

function isSmallScreen() {
  return window.innerWidth < 550;
}
</script>

<style lang='stylus'>
@import './vars.styl';

#app {
  position: relative;
  background: background-color;
}
.no-webgl {
  width: 100%;
  color: hsla(215, 37%, 55%, 1);
  flex-direction: column; text-align: center;
  padding: 12px;
}
.no-webgl h4 {
  margin: 7px 0;
  font-size: 24px;
}
.subreddit .subreddit-action {
  display: inline-block;
  border: 1px solid;
  color: primary-color;
  border-radius: 3px;
  padding: 0 8px;
  margin: 8px;
}

.subreddit span.subreddit-action {
  border-color: border-color;
}

.backdrop {
  position fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.21);
}

.close-container {
  position: fixed;
  z-index: 2;
  top: 0;
  right: 0;
  height: 40px;

  a {
    padding: 0 12px;
    font-size: 12px;
    color: #fff;
    background-color: #333;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
.improve {
  position: fixed;
  background: rgba(0, 0, 0, 0.3);
  padding: 0 8px;
  font-size: 12px;
  right: 8px;
  bottom: 8px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-bottom-enter-active, .slide-bottom-leave-active {
  transition: transform .3s cubic-bezier(0,0,0.58,1);
}
.slide-bottom-enter, .slide-bottom-leave-to {
  transform: translateY(84px);
}

.small-preview {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 84px;
  background: rgba(5, 15, 43, 1); 
  box-shadow: 0 -4px 4px rgba(0,0,0,0.42);
}

.subreddit.preview {
  position: absolute;
  left: 0;
  top: 0;
  width: side-panel-width + 16px;
  height: 100vh;
  overflow: auto;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.row .label {
  flex: 1;
}

.row .value {
  flex: 1;
}

.row select {
  width: 100%;
}

.btn-command {
  display: block;
  padding: 4px;
  margin-top: 10px;
  border: 1px solid;
}

.tooltip {
  position: fixed;
  background: post-background;
  border: 1px solid border-hover;
  color: primary-color;
  padding: 8px;
  pointer-events: none;
  max-width: 400px;
  transform: translateY(calc(-100% - 8px));
  font-family: monospace;
}

.subreddit {
  background: panel-background;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  color: highlight-color;
  .error {
    color: white;
    h3 {
      color: error-color;
    }
  }
  .background-area {
    background: post-background;
    border-bottom: 1px solid border-color;

    .community-icon {
      background: post-background;
    }
  }
  h2, h3 {
    color: primary-color;
  }
  .loading {
    margin-top: 8px;
  }
  .age-warning  {
    h2 {
      text-align: center;
      display: inline-block;
    }
  }
  .error,
  .age-warning {
    margin-top: 62px;
  }
  a {
    color: highlight-color;
  }
  .post {
    background: post-background;
    border: 1px solid border-color;
    .url {
      color: inherit;
    }
    .title, h1 {
      color: primary-color;
    }
    a.comments-count {
      &:hover {
        background: hover-background;
      }
    }
    .post-content, .byline {
      a:hover {
        background: hover-background;
      }
    }
    .status-line {
      background-color: #161617;
      .vote-count {
        color: primary-color;
        background: initial;
      }
    }
    .read-more {
      background-image: linear-gradient(180deg,hsla(0,0%,100%,0), #171718);
    }
    &:hover {
      border: 1px solid border-hover;
    }
  }
}

a {
  color: highlight-color;
  text-decoration: none;
}
.search-box {
  position: absolute;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  height: 48px;
  font-size: 16px;
  margin-top: 16px;
  padding: 0;
  cursor: text;
  left: 8px;
  width: side-panel-width;
}

.progress {
  position: fixed;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 8px;
  background: rgba(5, 15, 43, 0.4);
  box-shadow: 0 4px 4px rgba(0,0,0,0.2);
  user-select: none;
}

.slide-left-enter-active, .slide-left-leave-active {
  transition: transform 150ms cubic-bezier(0,0,0.58,1);
}
.slide-left-enter, .slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-top-enter-active, .slide-top-leave-active {
  transition: opacity .3s cubic-bezier(0,0,0.58,1);
}
.slide-top-enter, .slide-top-leave-to {
  opacity: 0;
}
.improve-window {
  position: fixed;
  transform: translate(-50%, -50%);
  top: 0;
  left: 50%;
  top: 50%;
  width: 400px;
  background: white;
  z-index: 2;
  box-shadow: 0 -1px 24px rgb(0 0 0);
  padding: 8px 16px;
  overflow-y: auto;
  max-height: 100%;
  h3 {
    margin: 0;
  }
  .close-btn {
    position: absolute;
    right: 8px;
    top: 8px;
  }
}
a.accent {
  color: highlight-link;
}
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: side-panel-width - 10px;
  background: white;
  z-index: 2;
  box-shadow: 0 -1px 24px rgb(0 0 0);
  display: flex;
  flex-direction: column;

  h3 {
    font-weight: normal;
    margin: 8px 8px 0 8px;
    font-size: 18px;
    flex: 1;
  }
  .close-btn {
    align-self: stretch;
    align-items: center;
    display: flex;
    padding: 0 8px;
  }

  .container {
    padding: 8px;
    flex: 1;
    overflow-y: auto;
  }
  h4 {
    margin: 0;
    font-weight: normal;
    text-align: right;
  }
  .byline {
    margin: 0 8px 8px;
    font-size: 12px;
  }
}
.progress.subgraph {
  max-width: 400px;
  text-align: center;
}

@media (max-width: 1200px) {
  .progress {
    top: 16px;
    right: 8px;
    left: inherit;
    transform: inherit;
  }
}
@media (max-width: 810px) {
  .progress.subgraph {
    top: 62px;
    left: 8px;
  }
}

@media (max-width: small-screen-width) {
  #app {
    width: 100%;
    margin: 0;
  }
  .sidebar {
    width: 100%;
  }
  .search-box {
    left: 0;
    margin-top: 0;
    width: 100%;
  }
  .improve-window {
    width: 100%;
    height: 100%;
  }
  .subreddit.preview {
    width: 100%;
  }
  .progress, .progress.subgraph  {
    top: 48px;
    left: 0;
    color: white;
    text-align: center;
    width: 100%;
    position: absolute;
    transform: initial;
    box-shadow: initial;
  }
}
</style>
