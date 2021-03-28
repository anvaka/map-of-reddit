<template>
  <div>
    <h3>Improve this map</h3>
    <!-- Icon copyright (c) 2013-2017 Cole Bemis: https://github.com/feathericons/feather/blob/master/LICENSE -->
    <a href='#' @click.prevent='onClose' class='close-btn'>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
    </a>
    <p>The entire website is open source. You can contribute in multiple ways:</p>
    <ul>
      <li>Support this work <a href="https://www.patreon.com/anvaka" class='accent'>on Patreon</a> or
      <a href="https://github.com/sponsors/anvaka" class='accent'>GitHub</a>. There is a lot of things
      I'd love to improve about this project, but without your support I wouldn't know if I'm moving
      in the right direction.
      </li>
      <li>
        Add new subreddits or update positions of existing ones if you found an issue. Please 
        follow instructions  <a href='https://github.com/anvaka/map-of-reddit-data#how-to-add-a-new-subreddit'
        class='accent' target='_blank'>here</a>.
      </li>
      <li>If you found a rendering bug - consider reporting it or fixing it 
        <a href='https://github.com/anvaka/map-of-reddit' class='accent' target='_blank'>here</a>.
      </li>
      <li>
        Share your suggestions and follow me on Twitter. My direct messages are open: 
<a href='https://twitter.com/anvaka' class='accent'>https://twitter.com/anvaka</a>
      </li>
    </ul>
    Thank you for your support! <br/>
    ♥️ Anvaka
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