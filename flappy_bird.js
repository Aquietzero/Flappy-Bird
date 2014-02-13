window.G = 3.5;
window.T = 10;

var OBSTACLE_DISTANCE = 250;
var BIRD_SPEED = 2.5;
var OBSTACLE_SPEED = 0.8;

function Bird() {
  this.$el = $('#bird');
  this.init();
}

Bird.prototype = {
  init: function () {
    this.pos = {
      top: 220,
      left: 100
    }
    this.speed = 0;
    this.setPos();
  },

  setPos: function () {
    this.$el.css({
      top: this.pos.top + 'px',
      left: this.pos.left + 'px'
    });
  },

  fly: function () {
    this.speed = -BIRD_SPEED;
  },

  drop: function () {
    this.speed += G * T / 1000;
    this.pos.top += this.speed;
    this.setPos();

    var degree = 0;
    if (this.speed < 0) {
      degree = -20 * (this.speed / -3);
    } else {
      var h = 640 - this.pos.top;
      var t0 = this.speed / G;
      var h0 = G * t0 * t0 / 2;
      var t = Math.sqrt(2 * (h + h0) / G);
      var v = G * t;
      degree = 90 * 5 * this.speed / v;
      degree = degree > 90 ? 90 : degree;
    }

    this.$el.css({
      '-webkit-transform': 'rotate(' + degree + 'deg)'
    });
  },

  isDie: function () {
    if (this.pos.top > 640 - 100) {
      return true;
    } else {
      return false;
    }
  }
}


var Obstacle = function ($el) {
  this.$el = $el;
  this.init();
}

Obstacle.prototype = {
  init: function () {
    this.pos = {top: -50, right: -40};
    this.speed = OBSTACLE_SPEED;
    this.setPos();

    this.setRandomSlot();
  },

  setRandomSlot: function () {
    this.upperHeight = Math.floor(100 + Math.random() * 300);
    var offset = Math.floor(-70 + Math.random() * 140);
    this.upperHeight += offset;
    this.upperHeight = 22 * Math.floor(this.upperHeight / 22);

    this.bottomHeight = 640 - this.upperHeight - 140;
    this.bottomHeight = 22 * Math.floor(this.bottomHeight / 22);

    this.$el.find('.upper-part').height(this.upperHeight);
    this.$el.find('.bottom-part').height(this.bottomHeight);
  },

  setPos: function () {
    this.$el.css({
      top: this.pos.top + 'px',
      right: this.pos.right + 'px'
    });
  },

  reset: function () {
    this.pos.right = -40;
    this.setRandomSlot();
  },

  move: function () {
    if (this.pos.right > 420 + OBSTACLE_DISTANCE) {
      this.reset();
    }

    if (this.pos.right < 325 && this.pos.right > 320) {
      this.$el.trigger('check:end');
    } else if (this.pos.right < 225 && this.pos.right > 220) {
      this.$el.trigger('check:begin', {
        upperHeight: this.upperHeight,
        bottomHeight: this.bottomHeight
      });
    }

    this.pos.right += this.speed;
    this.setPos();
  }
}


var Obstacles = function () {
  this.init();
}

Obstacles.prototype = {
  init: function () {
    this.obstacles = [];

    var obstacles = $('.obstacle');
    for (var i = 0; i < obstacles.length; ++i) {
      this.obstacles.push(new Obstacle($(obstacles[i])));

      this.obstacles[i].pos.right = -40 - i * OBSTACLE_DISTANCE;
      this.obstacles[i].setPos();
    }
  },

  move: function () {
    for (var i = 0; i < this.obstacles.length; ++i) {
      this.obstacles[i].move();
    }
  }
}


function Game() {
  this.$el = $('#game-background');
  this.init();
}

Game.prototype = {
  init: function () {
    this.bird = new Bird();
    this.obstacles = new Obstacles();

    this.$result = $('#result');
    this.$score = $('#score');

    this.bindKeys();
    this.bindListeners();
    this.bindEvents();

    this.running = false;
    this.score = 0;
  },

  // key j: jump.
  // enter: begin.
  bindKeys: function () {
    var self = this;
    $(window).keyup(function (e) {
      switch (e.which) {
        case 74:
          self.bird.fly();
          break;
        case 13:
          if (!self.running) {
            self.restart();
          }
          break;
      }
    });
  },

  bindListeners: function () {
    var self = this;
    for (var i = 0; i < this.obstacles.obstacles.length; ++i) {
      this.obstacles.obstacles[i].$el.on('check:begin', function (e, heights) {
        self.collisionCondition = {
          lower: heights.upperHeight - 50,
          upper: 640 - 37.5 - 50 - heights.bottomHeight
        }
      });
      this.obstacles.obstacles[i].$el.on('check:end', function (e) {
        if (self.collisionCondition) {
          self.score += 1;
          self.$score.html(self.score);
        }
        self.collisionCondition = null;
      });
    }
  },

  bindEvents: function () {
    var self = this;
    this.$result.find('.restart').click(function () {
      self.restart();
      return false;
    })
  },

  stop: function () {
    clearInterval(this.iterId);
    this.$result.fadeIn();
    this.running = false;
  },

  start: function () {
    var self = this;
    var run = function () {
      // iterate the move.
      self.bird.drop();
      self.obstacles.move();

      // check collision.
      if (self.collisionCondition) {
        var top = self.bird.pos.top;
        if (top < self.collisionCondition.lower || top > self.collisionCondition.upper) {
          self.stop();
        }
      }

      if (self.bird.isDie()) {
        self.stop();
      }
    }

    this.$score.html(this.score).fadeIn();
    this.iterId = setInterval(run, 1);
    this.running = true;
  },

  restart: function () {
    this.bird.init();
    this.obstacles.init();
    this.collisionCondition = null;

    this.$result.fadeOut();

    this.score = 0;
    this.start();
  }
}
