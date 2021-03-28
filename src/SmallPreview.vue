<template>
  <a href='#' @click.prevent='showFullPreview' class='small-preview-container'>
    <div class='header'>
      <span>r/{{name}}</span>
      <span v-if='details' class='subscribers-count'>{{details.subscribers}} members · {{details.active}} active</span>
    </div>
    <loading-icon v-if='loading'></loading-icon>
    <img v-if='details && details.image' :src='details.image.icon' class='community-icon'>
    <div class='info' v-if='details'>{{details.description}}</div>
    <!-- <div class='thumbnails' v-if='details && details.image'>
      <img v-if='details.image.banner' :src='details.image.banner' class='banner'>
      <img :src='details.image.icon' class='community-icon'>
    </div> -->
  </a>
</template>
<script>
import bus from './lib/bus';
import LoadingIcon from './LoadingIcon'
import {formatNumber} from './lib/utils';

export default {
  name: 'SmallPreview',
  props: ['name'],
  components: {
    LoadingIcon
  },
  data() {
    return {
      loading: true,
      details: null
    }
  },
  watch: {
    name() {
      this.getSubredditInfo();
    }
  },
  mounted() {
    this.getSubredditInfo();
  },
  methods: {
    showFullPreview() {
      bus.fire('show-subreddit', this.name, true);
    },
    getSubredditInfo() {
      let fetchedName = this.name;
      this.details = null;
      this.loading = true;
      fetch('https://www.reddit.com/r/' + fetchedName + '/about.json', {mode: 'cors'})
        .then(x => x.json())
        .then(x => {
          if (this.name !== fetchedName) return;
          let data = x.data;
          let description = data.public_description;
          let displayName = data.display_name_prefixed;
          let subscribers = formatNumber(data.subscribers);
          let active = formatNumber(data.accounts_active);
          this.loading = false;
          let image = null;
          let icon = data.icon_img || data.community_icon;
          if (icon) {
            let banner = data.banner_img || data.banner_background_image;
            image = {
              icon: icon.split('?')[0],
              banner: banner ? banner.split('?')[0] : null
            }
          }
          if (data.over18 && !window.ageConfirmed) {
            image = null;
          }
          this.details = {
            description, displayName, subscribers, active, image
          }
        })
    }
  }
};
</script>
<style lang="stylus">
text-color = #eee;
.loader {
  margin: 8px;
}
.header {
  font-size: 16px;
}
.small-preview-container {
  padding: 4px 8px;
  font-size: 12px;
  color: text-color;
  a {
    color: text-color;
  }
}
.info {
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.subscribers-count {
  color: #999999;
  float: right;
  display: inline-block;
  font-size: 12px;
}
.community-icon {
  width: 32px;
  border-radius: 100%;
  margin: 8px;
  float: left;
}
.banner {
  // height: 48px;
  width: 100%;
  position: absolute;
  top: 0px;
}
.thumbnails {
  overflow: hidden;
  position: absolute;
  bottom: 84px;
  width: 100%;
  height: 48px;
  background: orange;
  left: 0;
}
</style>