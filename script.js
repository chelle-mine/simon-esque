// default settings before starting game
var game = {
  timeout: undefined,
  pause: undefined,
  interval: undefined,
  strictMode: false,
  listenerBool: false,
  responseCount: 0,
  steps: 1,
  volume: 0.6
};

window.onload = function main() {
  // ================== //
  // define game sounds //
  // ================== //
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  game.audioCtx = new AudioContext();
  var freqs = [
    138.59, // d-flat
    174.61, // f
    277.81, // d-flat
    207.65, // a-flat
  ];
  game.tones = freqs.map(function(freq) {
    var osc = game.audioCtx.createOscillator();
    osc.frequency.value = freq;
    osc.start(0);
    return osc;
  });
  game.gainNodes = game.tones.map(function(tone) {
    var gn = game.audioCtx.createGain();
    tone.connect(gn);
    gn.gain.value = 0;
    gn.connect(game.audioCtx.destination);
    return gn;
  });
  // bad tone
  game.errTone = game.audioCtx.createOscillator();
  game.errTone.frequency.value = 92.50;
  game.errTone.type = "triangle";
  game.errTone.start();
  game.errNode = game.audioCtx.createGain();
  game.errTone.connect(game.errNode);
  game.errNode.gain.value = 0;
  game.errNode.connect(game.audioCtx.destination);

  // 'global' vars
  var optPnl = document.getElementById("options-panel");
  var opt = document.getElementById("options");
  var ctPnl = document.getElementById("count-panel");
  var ct = document.getElementById("count");
  var thmPnl = document.getElementById("themes-panel");
  var thm = document.getElementById("themes");
  var quads = document.getElementsByClassName("quadrant");
  var body = document.getElementById("theme-target");

  // click display to start game
  ct.addEventListener("click", startGame, false);

  // toggle options panel
  opt.onclick = function() {
    tgglPanels(ctPnl, optPnl);
  }
  document.getElementById("back-ct").onclick = function() {
    tgglPanels(optPnl, ctPnl);
  }
  // toggle theme panel
  thm.onclick = function() {
    tgglPanels(optPnl, thmPnl)
  }
  document.getElementById("back-opt").onclick = function() {
    tgglPanels(optPnl, thmPnl);
  }
  var thmPicker = document.getElementsByClassName("theme-select");
  for (let i = 0; i < thmPicker.length; i++) {
    thmPicker[i].addEventListener("click", function() {
      setTheme(this.id)
    }, false);
  }
  // strict mode toggle
  var slider = document.getElementById("mode-switch");
  document.getElementById("mode-label").onclick = function switchMode() {
    slider.checked = slider.checked === true ? false : true;
    game.strictMode = slider.checked ? true : false;
  }
  slider.onchange = function toggleMode() {
    game.strictMode = this.checked ? true : false;
  }

  function tgglPanels(elem1, elem2) {
    elem1.classList.toggle("hidden");
    elem2.classList.toggle("hidden");
  }

  function setTheme(theme) {
    for (let i = 0; i < quads.length; i++) {
      body.classList.remove("classic");
      body.classList.remove("purple");
      body.classList.remove("neon");
      body.classList.toggle(theme);
    }
  }

  function blink(elem, cb, param) {
    var i = 0;
    game.interval = setInterval(function blinker() {
      elem.classList.toggle("hidden");
      i++;
      if (i == 6) {
        clearInterval(game.interval);
        game.interval = undefined;
        cb(param);
      }
    }, 250);
  }

  function playTone(node) {
    node.gain.setTargetAtTime(game.volume, game.audioCtx.currentTime, 0.015);
  }

  function stopTones() {
    for (let i = 0; i < game.gainNodes.length; i++) {
      game.gainNodes[i].gain.setTargetAtTime(0, game.audioCtx.currentTime, 0.015);
    }
  }

  function startGame() {
    this.textContent = "--";
    blink(this, playGame);
    this.removeEventListener("click", startGame, false);
  }

  function playGame() {
    var sequence = genSequence();
    var subSeq = sequence.slice(0, game.steps);
    // restart button
    document.getElementById("restart").onclick = function() {
      tgglPanels(ctPnl, optPnl);
      reset(true);
    }
    document.getElementById("stop").onclick = function() {
      tgglPanels(ctPnl, optPnl);
      reset(false);
      ct.textContent = "start";
      ct.addEventListener("click", startGame, false);
    }

    showSeq(subSeq);
    // restart game, interrupting all processes and resetting defaults
    function reset(bool) {
      for (let i = 0; i < quads.length; i++) {
        quads[i].classList.remove("light-active");
        stopTones();
      }
      clearTimeout(game.pause);
      clearTimeout(game.timeout);
      clearInterval(game.interval);
      game.timeout = undefined;
      game.interval = undefined;
      game.listenerBool = true;
      game.steps = 1;
      toggleButts();
      if (bool) {
        playGame();
      } else {
        return;
      }
    }

    function setCountDisplay() {
      ct.textContent = game.steps < 10 ? "0" + game.steps : game.steps;
    }

    function genSequence() {
      var arr = [];
      for (let i = 0; i < 20; i++) {
        // random int between 0 and 3 (inclusive)
        arr.push(Math.floor(Math.random() * 4));
      }
      return arr;
    }

    function increment() {
      if (game.steps < 20) {
        game.steps++;
        subSeq = sequence.slice(0, game.steps);
        setCountDisplay();
        showSeq(subSeq);
      } else {
        congrats();
      }
    }

    function congrats() {
      ct.textContent = "You win!";
      var i = 0;
      game.interval = setInterval(function winSeq() {
        document.getElementById(i % 4).classList.toggle("light-active");
        for (let j = 0; j < game.gainNodes.length; j++) {
          game.gainNodes[j].gain.setTargetAtTime(game.gainNodes[j].gain.value == 0 ? game.volume : 0, game.audioCtx.currentTime, 0.005); // unintended, but ok effect?
        }
        i++;
        if (i == 16) {
          clearInterval(game.interval);
          partTwo();
        }
      }, 100);

      function partTwo() {
        i = 0;
        game.interval = setInterval(function blinkAll() {
          for (let j = 0; j < quads.length; j++) {
            quads[j].classList.toggle("light-active");
          }
          i++;
          if (i == 4) {
            for (let k = 0; k < game.gainNodes.length; k++) {
              stopTones();
            }
            clearInterval(game.interval);
            ct.textContent = "--";
            blink(ct, reset, true);
          }
        }, 300);
      }
    }

    function setDelay(seq) {
      var d;
      if (seq.length < 5) {
        d = 1250;
      } else if (seq.length < 10) {
        d = 1100;
      } else if (seq.length < 15) {
        d = 950;
      } else {
        d = 800;
      }
      return d;
    }
    // display each step in sequence, in set intervals
    function showSeq(seq) {
      setCountDisplay();
      var delay = setDelay(seq);
      var i = 0;

      game.interval = setInterval(function seqHandler() {
        document.getElementById(seq[i]).classList.toggle("light-active");
        playTone(game.gainNodes[seq[i]]);
        game.timeout = setTimeout(function revert() {
          stopTones();
          document.getElementById(seq[i]).classList.toggle("light-active");
          if (i == seq.length - 1) {
            clearTimeout(game.pause);
            clearTimeout(game.timeout);
            clearInterval(game.interval);
            collectAnswers(seq);
          }
          i++;
        }, delay / 2);
      }, delay);
    }

    function collectAnswers(seq) {
      game.responseCount = 0;
      // add event listeners
      toggleButts();
      timeLmt();
    }

    // handle good input
    function goodHandler() {
      stopTones();
      let lit = document.getElementsByClassName("light-active");
      for (let i=0; i<lit.length; i++){
        lit[i].classList.toggle("light-active");
      }
      if (game.responseCount == subSeq.length - 1) {
        upHandle(true);
      } else {
        game.responseCount++;
        timeLmt();
        window.removeEventListener("mouseup", goodHandler, false);
      }
    }

    // handle bad input
    function badHandler() {
      stopTones();
      let lit = document.getElementsByClassName("light-active");
      for (let i=0; i<lit.length; i++){
        lit[i].classList.toggle("light-active");
      }
      upHandle(false);
    }

    // run on last user input, bool being true if correct
    function upHandle(bool) {
      clearTimeout(game.pause);
      verdict(bool);
      toggleButts();
    }

    function mousedownHandler() {
      clearTimeout(game.pause);
      this.classList.toggle("light-active");
      playTone(game.gainNodes[this.id]);
      // if user input does not match sequence step
      if (subSeq[game.responseCount] != this.id) {
        console.log("wrong");
        window.addEventListener("mouseup", badHandler, false);
      } else {
        window.addEventListener("mouseup", goodHandler, false);
      }
    }

    // remove/add event listeners as needed
    function toggleButts() {
      if (game.listenerBool) {
        for (let i = 0; i < quads.length; i++) {
          quads[i].removeEventListener("mousedown", mousedownHandler, false);
        }
        window.removeEventListener("mouseup", badHandler, false);
        window.removeEventListener("mouseup", goodHandler, false);
        game.listenerBool = false;
      } else {
        for (let i = 0; i < quads.length; i++) {
          quads[i].addEventListener("mousedown", mousedownHandler, false);
        }
        game.listenerBool = true;
      }
    }

    // time out after five seconds of inactivity
    function timeLmt() {
      game.pause = setTimeout(function() {
        toggleButts();
        verdict(false);
      }, 5000);
    }

    // true if correct, false if incorrect sequence is input
    function verdict(bool) {
      if (bool) {
        setTimeout(increment, 250);
      } else if (!bool && game.strictMode) {
        flashErr(true);
      } else {
        // repeat current steps in sequence
        flashErr(false);
      }
    }

    // flash 'incorrect' message to user
    function flashErr(bool) {
      var i = 0;
      ct.textContent = "--";
      game.interval = setInterval(function playErr() {
        game.errNode.gain.value = game.errNode.gain.value == 0 ? game.volume : 0;
        ct.classList.toggle("hidden");
        i++;
        if (i == 4 && bool) {
          clearInterval(game.interval);
          setTimeout(function() {
            reset(true);
          }, 500);
        } else if (i == 4 && !bool) {
          clearInterval(game.interval);
          setTimeout(function wait() {
            showSeq(subSeq);
          }, 500);
        }
      }, 100);
    }
  }
}
