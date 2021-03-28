<template>
  <div class="sidebar">
    <div class='row'>
      <h3>Map of Reddit</h3>
      <!-- Icon copyright (c) 2013-2017 Cole Bemis: https://github.com/feathericons/feather/blob/master/LICENSE -->
        <a href='#' @click.prevent='onClose' class='close-btn'>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </a>
    </div>

    <div class="container">
      <p>
        Each dot is a subreddit. Two dots within the same cluster are 
        usually close to each other if multiple users frequently leave comments on both subreddits.
      </p>
      <p>
        If you find something missing, please feel free to <a href='https://github.com/anvaka/map-of-reddit-data#how-to-add-a-new-subreddit' target='_blank' class='accent'>edit the map</a>.
      </p>
      <p>
        I spent last couple years developing this website as a hobby project. If you enjoy
        this work please support it <a href="https://www.patreon.com/anvaka" class='accent'>on Patreon</a> or
        <a href="https://github.com/sponsors/anvaka" class='accent'>GitHub</a> and I promise to not disappoint you
        with new features :).
      </p>
      <p>
      Please follow me on Twitter  to stay in touch: <a href='https://twitter.com/anvaka' class='accent'>https://twitter.com/anvaka</a>.
      </p>
      <p>
        Thank you for your interest and support!
      </p>
    </div>
  </div>
</template>
<script>
export default {
  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    handleKeyDown(e) {
      if (e.which === 27 /* ESC */) {
        this.onClose();
      }
    }
  }
}
</script>