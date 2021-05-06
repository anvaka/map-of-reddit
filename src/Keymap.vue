<template>
  <div class='navigation-controls'>
    <div class='navigation-row padded'>
      <div class='item'>
        <a href="#" class='navigation-btn secondary left' :class="{down: isRotLeft}" ref="rotLeft">
          <svg viewBox="0 0 1024 1024">
          <path d="m884.6 622.6v192c0 11.333-3.834 20.833-11.5 28.5-7.667 7.666-17 11.5-28 11.5s-20.5-3.834-28.5-11.5c-8-7.667-12-17.167-12-28.5v-192c0-61.334-21.667-113.67-65-157-43.334-43.334-95.667-65-157-65h-340l113 112c7.333 8 11 17.5 11 28.5s-3.834 20.333-11.5 28c-7.667 7.666-17 11.5-28 11.5s-20.5-4-28.5-12l-178-178c-8-8-12-17.5-12-28.5s4-20.5 12-28.5l183-183c8-8 17.5-12 28.5-12s20.5 3.833 28.5 11.5c8 7.666 12 17 12 28s-4 20.5-12 28.5l-114 114h336c83.333 0 154.5 29.5 213.5 88.5s88.5 130.17 88.5 213.5z"/>
          </svg>
          <div class='legend'>Q</div>
        </a>
      </div>
      <a href='#' class='item navigation-btn' :class="{down: isFwd}" ref='fwd'>
        <svg viewBox="0 0 100 100"><path d="M10,80 50,30 90,80z"></path></svg>
        <div class='legend'>W</div>
      </a>
      <a href="#" class='item navigation-btn secondary right' :class="{down: isRotRight}" ref='rotRight'>
        <svg viewBox="0 0 1024 1024">
          <path d="m108.6 622.6v192c0 11.333 3.833 20.833 11.5 28.5 7.666 7.666 17 11.5 28 11.5s20.5-3.834 28.5-11.5c8-7.667 12-17.167 12-28.5v-192c0-61.334 21.666-113.67 65-157 43.333-43.334 95.666-65 157-65h340l-113 112c-7.334 8-11 17.5-11 28.5s3.833 20.333 11.5 28c7.666 7.666 17 11.5 28 11.5s20.5-4 28.5-12l178-178c8-8 12-17.5 12-28.5s-4-20.5-12-28.5l-183-183c-8-8-17.5-12-28.5-12s-20.5 3.833-28.5 11.5c-8 7.666-12 17-12 28s4 20.5 12 28.5l114 114h-336c-83.334 0-154.5 29.5-213.5 88.5s-88.5 130.17-88.5 213.5z"/>
        </svg>
        <div class='legend'>E</div>
      </a>
    </div>
    <div class='navigation-row padded'>
      <a href='#' class='item navigation-btn' :class="{down: isLeft}" ref='moveLeft'>
        <svg viewBox="0 0 100 100" ><path d="M80,10 80,90 30,50z"></path></svg>
        <div class='legend'>A</div>
      </a>
      <a href='#' class='item navigation-btn' :class="{down: isBack}" ref='backward'>
        <svg viewBox="0 0 100 100"><path d="M10,30 50,80 90,30z"></path></svg>
        <div class='legend'>S</div>
      </a>
      <a href='#' class='item navigation-btn' :class="{down: isRight}" ref='moveRight'>
        <svg viewBox="0 0 100 100" ><path d="M30,10 30,90 80,50z"></path></svg>
        <div class='legend'>D</div>
      </a>
    </div>
    <div class='navigation-row'>
      <a href='#'  class='item navigation-btn wide' :class="{down: isDown}" ref='moveDown'>
        <svg width="100%" height="100%" viewBox="0 0 1024 1024">
            <path d="M364,666L522,824C528,830 535.5,833 544.5,833C553.5,833 561,830 567,824L725,666C731.667,659.333 735,651.667 735,643C735,634.333 731.667,626.667 725,620C719,614 711.5,611 702.5,611C693.5,611 686,614 680,620L576,724L576,32C576,23.333 573,15.833 567,9.5C561,3.167 553.333,0 544,0C535.333,0 527.833,3.167 521.5,9.5C515.167,15.833 512,23.333 512,32L512,724L409,620C403,614 395.5,611 386.5,611C377.5,611 370,614 364,620C358,626.667 355,634.333 355,643C355,651.667 358,659.333 364,666ZM1024,992C1024,1000.67 1020.83,1008.17 1014.5,1014.5C1008.17,1020.83 1000.67,1024 992,1024L32,1024C23.333,1024 15.833,1020.83 9.5,1014.5C3.167,1008.17 0,1000.67 0,992C0,983.333 3.167,975.833 9.5,969.5C15.833,963.167 23.333,960 32,960L992,960C1000.67,960 1008.17,963.167 1014.5,969.5C1020.83,975.833 1024,983.333 1024,992Z" style="fill-rule:nonzero;"/>
        </svg>
        <div class='legend'>shift</div>
      </a>
      <a href='#' class='item navigation-btn wide' :class="{down: isUp}" ref='moveUp'>
        <svg viewBox="0 0 1024 1024"><path d="M726 167L568 9q-9-9-22.5-9T523 9L365 167q-10 10-10 23t10 23q9 9 22.5 9t22.5-9l104-104v692q0 13 9 22.5t23 9.5q13 0 22.5-9.5T578 801V109l103 104q9 9 22.5 9t22.5-9q9-10 9-23t-9-23zm298 825q0 13-9.5 22.5T992 1024H32q-13 0-22.5-9.5T0 992t9.5-22.5T32 960h960q13 0 22.5 9.5t9.5 22.5z"></path></svg>
        <div class='legend'>space</div>
      </a>
  </div>
    <div class='cursor-legend'>
      <input type="checkbox" id="lockMouse" name="lockMouse" v-model='lockMouse'>
      <label for="lockMouse">Capture mouse cursor</label>
    </div>
  </div>
</template>

<script>
import createPressListener from './lib/createPressListener';

export default {
  props: ['scene'],
  mounted() {
    let camera = this.camera = this.scene.getScene().getCameraController();
    this.camera.on('move', this.updateTransforms);
    this.disposeHandlers = [
      this.createHandler(this.$refs.fwd, camera.MOVE_FORWARD),
      this.createHandler(this.$refs.backward, camera.MOVE_BACKWARD),
      this.createHandler(this.$refs.moveLeft, camera.MOVE_LEFT),
      this.createHandler(this.$refs.moveRight, camera.MOVE_RIGHT),
      this.createHandler(this.$refs.moveUp, camera.MOVE_UP),
      this.createHandler(this.$refs.moveDown, camera.MOVE_DOWN),
      this.createHandler(this.$refs.rotLeft, camera.TURN_LEFT),
      this.createHandler(this.$refs.rotRight, camera.TURN_RIGHT)
    ];
  },
  beforeDestroy() {
    this.camera.off('move', this.updateTransforms);
    this.disposeHandlers.forEach(x => x());
  },
  watch: {
    lockMouse(isLocked) {
      this.camera.setMouseCapture(isLocked);
    }
  },
  data() {
    return {
      lockMouse: this.scene.getScene().getCameraController().getMouseCapture(),
      isFwd: false,
      isBack: false,
      isLeft: false,
      isRight: false,
      isRotLeft: false,
      isRotRight: false,
      isUp: false,
      isDown: false,
    }

  },
  methods: {
    createHandler(el, command) {
      return createPressListener(el, isDown => {
        this.camera.handleCommand(command, isDown ? 1 : 0);
      });
    },
    updateTransforms(e) {
      this.isLeft = e.dx > 0;
      this.isRight = e.dx < 0;
      this.isFwd = e.dy > 0;
      this.isBack = e.dy < 0;
      this.isUp = e.dz > 0;
      this.isDown = e.dz < 0;
      this.isRotLeft = e.dPhi < 0;
      this.isRotRight = e.dPhi > 0;
    }
  }
}
</script>

<style lang='stylus' scoped>
.navigation-controls {
    position: fixed;
    bottom: 8px;
    left: 8px;
}
label {
  color: white;
}
.legend {
    text-align: center;
    font-size: 14px;
}
.navigation-row {
  display: flex;
}
.item {
  width: 42px;
  height: 42px;
  margin: 2px;
}
.navigation-btn {
  background: rgba(0 0 0 0.2);
  box-shadow: 
    0 2px 4px rgb(0 0 0 / 30%), 
    0 -1px 0px rgba(0 0 0 0.05);
  text-decoration: none;
  display: flex;
  width: 42px;
  flex-direction: column;
  color: #cecece;
}
.navigation-btn.down {
  background: rgba(250 250 250 .2);
}
.padded {
  margin-left: 10px;
}
.navigation-btn.secondary {
  width: 42px;
  height: 42px;
  transform: scale(0.70);
  svg {
    padding: 4px;
  }
  .legend {
    color: #aaa;
  }
}
.navigation-btn.secondary.left {
  transform-origin: right bottom;
}
.navigation-btn.secondary.right {
  transform-origin: left bottom;
}
.navigation-btn.wide {
  width: 75px;
}
.navigation-btn svg {
  fill: white;
  padding-top: 4px;
}
.cursor-legend {
  margin-top: 8px;
  display: none;
}

@media (pointer: fine) {
  .cursor-legend {
    display: block;
  }
}

</style>