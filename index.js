// --Classes-- //
class Cell {
  up;
  right;
  bottom;
  left;
  currentOccupant = null;
  originalVisual;
  constructor(element) {
    this.element = element;
    this.originalVisual = this.element.style.background;
  }

  setOccupant(occupant) {
    this.currentOccupant = occupant;
    this.element.classList.add(this.currentOccupant.cellVisual);
  }

  removeOccupant() {
    if (this.currentOccupant) {
      this.element.classList.remove(this.currentOccupant.cellVisual);
    }

    this.currentOccupant = null;
  }

  isOccupied() {
    return Boolean(this.currentOccupant);
  }
}

class Occupant {
  constructor(cellVisual) {
    this.cellVisual = cellVisual;
  }

  setOccupiedCell(cell) {
    cell.setOccupant(this);
  }
}

class SnakeSegment extends Occupant {
  static snakeVisual = 'snake-segment';
  currentlyOccupiedCell;
  lastOccupiedCell = null;
  nextSegment;
  constructor(currentlyOccupiedCell, snakeVisual) {
    super(snakeVisual);

    if (currentlyOccupiedCell) {
      this.setOccupiedCell(currentlyOccupiedCell);
    }
  }

  setOccupiedCell(cell) {
    if (Boolean(this.currentlyOccupiedCell)) {
      if (this.currentlyOccupiedCell === cell) {
        return;
      }
      this.currentlyOccupiedCell.removeOccupant();
    }

    super.setOccupiedCell(cell);
    this.lastOccupiedCell = this.currentlyOccupiedCell;
    this.currentlyOccupiedCell = cell;
  }
}

class SnakeHead extends SnakeSegment {
  snakeLength = 1;
  constructor(currentlyOccupiedCell, snakeVisual) {
    super(currentlyOccupiedCell, snakeVisual);
  }

  setOccupiedCell(cell) {
    if (!cell) {
      loseGame();
      return;
    }

    if (cell.currentOccupant instanceof SnakeSegment) {
      loseGame();
      return;
    }

    if (cell.currentOccupant instanceof Food) {
      cell.currentOccupant.eat();
      cell.removeOccupant();

      if (
        snakeHead.snakeLength ===
        game.movementGridDimensions * game.movementGridDimensions
      ) {
        game.stateMachine.setState(new GameWon());
      }
    }

    super.setOccupiedCell(cell);
  }

  pullOtherSegments() {
    let currentSegment = this;
    while (currentSegment.nextSegment) {
      currentSegment.nextSegment.setOccupiedCell(
        currentSegment.lastOccupiedCell
      );
      currentSegment = currentSegment.nextSegment;
    }
  }

  getTail() {
    let tail = this;

    while (tail.nextSegment) {
      tail = tail.nextSegment;
    }

    return tail;
  }

  reset() {
    this.snakeLength = 1;

    let currentSegment = this;
    while (currentSegment.nextSegment) {
      let temp = currentSegment.nextSegment;
      currentSegment.nextSegment.currentlyOccupiedCell.removeOccupant();
      currentSegment.nextSegment = null;
      currentSegment = temp;
    }
  }
}

class Food extends Occupant {
  constructor(name, foodVisual, value, poisonous) {
    super(foodVisual);
    this.name = name;
    this.value = value;
    this.poisonous = poisonous;
  }

  eat() {
    game.foodItemsOnGrid--;
    game.changeScore(this.value);
    game.changeFoodEaten(1);
    addSnakeSegment();
    spawnFoodRandomly();
    settings.playSound('snakeEatSound');
  }
}

class Apple extends Food {
  constructor() {
    super('Apple', 'apple', 30, false);
  }
}

class Banana extends Food {
  constructor() {
    super('Banana', 'banana', 10, false);
  }
}

// State Machine //
class State {
  constructor() {}

  setMoveDirection(movementKey) {}
  pauseGame() {}
  quitGame() {
    game.stateMachine.setState(new PreGame());
  }
  enter() {}
  exit() {}
}

class PreGame extends State {
  constructor() {
    super();
  }

  quitGame() {}

  enter() {
    game.reset();
    changeMenu('main-menu');
    settings.resetGameplayMusic();
  }
}

class Running extends State {
  constructor() {
    super();
  }

  setMoveDirection(movementKey) {
    switch (movementKey) {
      case 'w':
      case 'ArrowUp':
        game.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.up
            ? 'up'
            : game.currentMoveDirection;
        break;
      case 'a':
      case 'ArrowLeft':
        game.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.left
            ? 'left'
            : game.currentMoveDirection;
        break;
      case 's':
      case 'ArrowDown':
        game.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.down
            ? 'down'
            : game.currentMoveDirection;
        break;
      case 'd':
      case 'ArrowRight':
        game.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.right
            ? 'right'
            : game.currentMoveDirection;
        break;
    }
  }

  pauseGame() {
    game.stateMachine.setState(new Paused());
  }

  enter() {
    changeMenu('');
    gameLoop();
    settings.playSound('gameplayMusic');
  }
}

class Paused extends State {
  constructor() {
    super();
  }

  pauseGame() {
    game.stateMachine.setState(new Running());
  }

  enter() {
    changeMenu('pause-menu');
    stopGame();
    settings.sounds.gameplayMusic.pause();
  }
}

class GameOver extends State {
  constructor() {
    super();
  }

  enter() {
    changeMenu('game-over-menu');
    stopGame();
  }
}

class GameWon extends State {
  constructor() {
    super();
  }

  enter() {
    changeMenu('game-won-menu');
    stopGame();
  }
}

class Countdown extends State {
  constructor() {
    super();
  }

  enter() {
    countdownContainer.className = 'counting';
    game.countdown = game.initialCountdown;
    countdownDisplay.setAttribute(
      'style',
      `animation-iteration-count: ${game.countdown + 1};`
    );
    updateCountdownDisplay();
    changeMenu();
  }

  exit() {
    countdownContainer.className = '';
  }
}

class StateMachine {
  #state;
  constructor(initialState) {
    this.#state = initialState;
  }

  setState(newState) {
    if (this.#state) {
      this.#state.exit();
    }

    this.#state = newState;
    this.#state.enter();
  }

  getState() {
    return this.#state;
  }
}

// Difficulty //
class Difficulty {
  constructor(tickSpeed) {
    this.tickSpeed = tickSpeed;
  }
}

// Settings //
class Setting {
  static #settings = [];
  #defaultValue;
  constructor(name, defaultValue, element) {
    this.name = name;
    this.#defaultValue = defaultValue;
    this.value = localStorage.getItem(name) || defaultValue;
    this.element = element;
    Setting.#settings.push(this);
  }

  static initialize() {
    Setting.#settings.forEach((setting) => {
      setting.initialize();
    });
  }

  cacheValue() {
    localStorage.setItem(this.name, this.value);
  }

  finalize(extraFunc) {
    this.cacheValue();

    if (extraFunc) {
      extraFunc();
    }
  }

  reset() {
    this.value = this.#defaultValue;
  }
}

class BooleanSetting extends Setting {
  constructor(
    name,
    defaultValue = 'On',
    element,
    turnOnExtraFunc,
    turnOffExtraFunc
  ) {
    super(name, defaultValue, element);
    this.turnOnExtraFunc = turnOnExtraFunc;
    this.turnOffExtraFunc = turnOffExtraFunc;
    this.onBtn = element.querySelector('[data-bool="On"]');
    this.onBtn.addEventListener('click', () => {
      this.turnOn();
    });
    this.offBtn = element.querySelector('[data-bool="Off"]');
    this.offBtn.addEventListener('click', () => {
      this.turnOff();
    });
  }

  #setSelected(onBtnSelected, offBtnSelected) {
    let addReForOn = onBtnSelected ? 'add' : 'remove';
    let addReForOff = offBtnSelected ? 'add' : 'remove';

    this.onBtn.classList[addReForOn]('selected');
    this.offBtn.classList[addReForOff]('selected');
  }

  initialize() {
    this[`turn${this.value}`]();
  }

  turnOn() {
    this.#setSelected(true, false);
    this.value = 'On';
    super.finalize(this.turnOnExtraFunc);
  }

  turnOff() {
    this.#setSelected(false, true);
    this.value = 'Off';
    super.finalize(this.turnOffExtraFunc);
  }

  isEnabled() {
    return this.value === 'On';
  }
}

class RadioSetting extends Setting {
  constructor(name, defaultValue, element, ...options) {
    super(name, defaultValue, element);
    this.options = options;
    this.optionElements = element.querySelectorAll(
      '[data-radio*="setting-option-"]'
    );
    this.optionElements.forEach((element, index) => {
      element.addEventListener('click', () => {
        this.set(index);
      });
    });
  }

  #setSelected(selectedElement) {
    this.optionElements.forEach((element) => {
      element.classList.remove('selected');
    });

    selectedElement.classList.add('selected');
  }

  initialize() {
    this.set(this.value);
  }

  set(newValue) {
    this.#setSelected(this.optionElements[newValue]);
    this.value = newValue;
    super.finalize();
  }

  getValue() {
    return this.options[this.value];
  }
}

class SliderSetting extends Setting {
  constructor(name, defaultValue, element) {
    super(name, defaultValue, element);
    this.element.addEventListener('input', () => {
      this.set(this.element.value);
    });
  }

  initialize() {
    this.set(this.value);
  }

  set(newValue) {
    this.value = newValue;
    this.element.value = this.value;
    super.finalize();
  }
}
//

// --Global Variables-- //
const htmlElement = document.firstElementChild;
const countdownContainer = document.querySelector('#countdown');
const countdownDisplay = countdownContainer.querySelector('p');
const playArea = document.getElementById('play-area');
const playBtn = document.querySelector(
  '#main-menu .menu-options-area > button'
);
const settingsBtn = document.querySelector(
  '#main-menu .menu-options-area > button:nth-child(2)'
);
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const soundBtns = document.querySelectorAll('.sound-btn');
const volumeSlider = document.getElementById('sound-volume-slider');
const musicBtns = document.querySelectorAll('.gameplay-music-sound-btn');
const darkModeBtns = document.querySelectorAll('.dark-mode-btn');
const aboutBtn = document.querySelector(
  '#main-menu .menu-options-area > button:nth-child(3)'
);
const resumeBtn = document.querySelector(
  '#pause-menu .menu-options-area > button'
);
const backBtns = document.querySelectorAll('.menu-back-btn');
const resetBtns = document.querySelectorAll('.reset-btn');
const quitBtns = document.querySelectorAll('.quit-btn');
const scoreValue = document.getElementById('score-value');
const allBtns = document.querySelectorAll('button');
const previousBestScoreValue = document.getElementById(
  'previous-best-score-value'
);
const foodEatenValue = document.getElementById('food-eaten-value');
const movementGridCells = [];

const settings = {
  movementGridDimensions: {
    x: 21,
    y: 21
  },
  sounds: {
    buttonClickSound: new Audio('sounds/button-click-sound.wav'),
    snakeEatSound: new Audio('sounds/snake-eat-sound.wav'),
    gameplayMusic: new Audio('sounds/gameplay-music.wav')
  },

  resetGameplayMusic() {
    this.sounds.gameplayMusic.currentTime = 0;
    this.sounds.gameplayMusic.pause();
  },

  playSound(soundName) {
    if (!this.sound.isEnabled()) {
      return;
    }

    let selectedSound = this.sounds[soundName];
    if (
      selectedSound &&
      (soundName !== 'gameplayMusic' || this.musicEnabled.isEnabled())
    ) {
      selectedSound.volume = this.volume.value;
      selectedSound.play();
    }
  },

  updateSoundVolumes() {
    for (let prop in this.sounds) {
      this.sounds[prop].volume = this.volume;
    }
  },

  setVolume(newVolume) {
    this.volume = newVolume;
    this.updateSoundVolumes();
  },

  loadSettings() {
    Object.entries(localStorage).forEach((element) => {
      console.log(element);
    });
  }
};
settings.sounds.gameplayMusic.loop = true;
settings.sound = new BooleanSetting(
  'sound',
  'On',
  document.querySelector('#sound-setting'),
  () => {
    settings.playSound('buttonClickSound');
  }
);
settings.musicEnabled = new BooleanSetting(
  'music',
  'On',
  document.querySelector('#music-setting'),
  undefined,
  () => {
    settings.resetGameplayMusic();
  }
);
settings.darkMode = new BooleanSetting(
  'dark-mode',
  'On',
  document.querySelector('#dark-mode-setting'),
  () => {
    htmlElement.setAttribute('color-scheme', 'dark');
  },
  () => {
    htmlElement.setAttribute('color-scheme', 'light');
  }
);
settings.difficulty = new RadioSetting(
  'difficulty',
  1,
  document.querySelector('#difficulty-setting'),
  new Difficulty(150),
  new Difficulty(100),
  new Difficulty(70)
);
settings.volume = new SliderSetting(
  'volume',
  0.5,
  document.querySelector('#sound-volume-slider')
);

Setting.initialize();

const game = {
  stateMachine: new StateMachine(new PreGame()),
  score: 0,
  initialCountdown: 3,
  countdown: 3,
  menuStack: ['main-menu'],
  previousBestScore: localStorage.getItem('previous-best') || 0,
  foodEaten: 0,
  foodItems: [new Apple(), new Banana()],
  foodItemsOnGrid: 0,
  initialMoveDirection: 'right',
  currentMoveDirection: 'right',
  loopTimeout: undefined,
  animatedScoreTimeout: undefined,

  updateScoreDisplays(startingValue, endingValue, scoreDisplayElement, t = 0) {
    t += 0.01;
    let animatedValue = Math.round(
      startingValue + (endingValue - startingValue) * t
    );
    scoreDisplayElement.innerText = animatedValue.toString();

    if (t < 1) {
      this.animatedScoreTimeout = setTimeout(() => {
        this.updateScoreDisplays(
          startingValue,
          endingValue,
          scoreDisplayElement,
          t
        );
      }, 5.625);
    }
  },

  changeScore(amount) {
    this.updateScoreDisplays(this.score, this.score + amount, scoreValue);
    this.score += amount;

    if (this.score > this.previousBestScore) {
      this.updateScoreDisplays(
        this.previousBestScore,
        this.score,
        previousBestScoreValue
      );
      this.previousBestScore = this.score;
      localStorage.setItem('previous-best', this.previousBestScore);
    }
  },

  changeFoodEaten(amount) {
    this.foodEaten += amount;
    foodEatenValue.innerText = this.foodEaten.toString();
  },

  resetScores(includePb) {
    this.score = 0;
    this.foodEaten = 0;

    if (includePb) {
      this.previousBestScore = 0;
      previousBestScoreValue.innerText = '0';
    }

    scoreValue.innerText = '0';
    foodEatenValue.innerText = '0';
  },

  reset() {
    stopGame();
    resetMovementGrid();
    this.resetScores();
    snakeHead.reset();
    this.currentMoveDirection = this.initialMoveDirection;
    settings.resetGameplayMusic();
  }
};
game.updateScoreDisplays(0, game.previousBestScore, previousBestScoreValue);
//

// --Functions-- //
const getMiddleCellOfMovementGrid = () => {
  return movementGridCells[
    Math.floor(
      settings.movementGridDimensions.x *
        (settings.movementGridDimensions.y / 2)
    )
  ];
};

const getRandomMovementGridCell = () => {
  return movementGridCells[
    Math.floor(Math.random() * movementGridCells.length)
  ];
};

const resetMovementGrid = () => {
  movementGridCells.forEach((cell) => {
    cell.removeOccupant();
  });
};

const runMovementCellNeighborVisualizer = (speed = 500) => {
  for (let i = 0; i < movementGridCells.length; i++) {
    let currentCell = movementGridCells[i];
    setTimeout(() => {
      currentCell.element.style.backgroundColor = 'blue';
      if (currentCell.up) {
        currentCell.up.element.style.backgroundColor = 'red';
      }
      if (currentCell.right) {
        currentCell.right.element.style.backgroundColor = 'orange';
      }
      if (currentCell.down) {
        currentCell.down.element.style.backgroundColor = 'yellow';
      }
      if (currentCell.left) {
        currentCell.left.element.style.backgroundColor = 'green';
      }
      setTimeout(() => {
        currentCell.element.style.backgroundColor = 'transparent';
        if (currentCell.up) {
          currentCell.up.element.style.backgroundColor = 'transparent';
        }
        if (currentCell.right) {
          currentCell.right.element.style.backgroundColor = 'transparent';
        }
        if (currentCell.down) {
          currentCell.down.element.style.backgroundColor = 'transparent';
        }
        if (currentCell.left) {
          currentCell.left.element.style.backgroundColor = 'transparent';
        }
      }, speed / 2);
    }, speed + speed * i);
  }
};

const placeNewCellElement = () => {
  let newCell = document.createElement('div');
  newCell.classList.add('cell');
  playArea.appendChild(newCell);
  return newCell;
};

const placeAllCellElements = () => {
  for (let y = 0; y < settings.movementGridDimensions.y; y++) {
    for (let x = 0; x < settings.movementGridDimensions.x; x++) {
      let newCellElement = placeNewCellElement();
      let newCell = new Cell(newCellElement);
      if ((!(y % 2) && x % 2) || (y % 2 && !(x % 2))) {
        newCell.element.classList.add('checkered-cell');
      }
      movementGridCells.push(newCell);
    }
  }
};

const setupCellNeighbors = () => {
  movementGridCells.forEach((element, index) => {
    let indexForRows = index % settings.movementGridDimensions.x;
    let upIndex = index - settings.movementGridDimensions.x;
    let rightIndex = index + 1;
    let downIndex = index + settings.movementGridDimensions.x;
    let leftIndex = index - 1;

    element.up =
      index >= settings.movementGridDimensions.x
        ? movementGridCells[upIndex]
        : null;
    element.right =
      indexForRows < settings.movementGridDimensions.x - 1
        ? movementGridCells[rightIndex]
        : null;
    element.down =
      index <= movementGridCells.length - settings.movementGridDimensions.x - 1
        ? movementGridCells[downIndex]
        : null;
    element.left = indexForRows > 0 ? movementGridCells[leftIndex] : null;
  });
};

const setupMovementGrid = () => {
  playArea.style.gridTemplate = `repeat(${settings.movementGridDimensions.y}, 1fr) / repeat(${settings.movementGridDimensions.x}, 1fr)`;
  placeAllCellElements();
  setupCellNeighbors();
};

const spawnFoodRandomly = () => {
  let randomFood =
    game.foodItems[Math.floor(Math.random() * game.foodItems.length)];

  let randomCell = getRandomMovementGridCell();
  while (randomCell.isOccupied()) {
    randomCell = getRandomMovementGridCell();
  }

  randomFood.setOccupiedCell(randomCell);
};

const addSnakeSegment = () => {
  let newSnakeSegment = new SnakeSegment(
    snakeHead.getTail().lastOccupiedCell,
    SnakeSegment.snakeVisual
  );
  snakeHead.getTail().nextSegment = newSnakeSegment;
  SnakeHead.snakeLength++;
};

const moveSnake = () => {
  snakeHead.setOccupiedCell(
    snakeHead.currentlyOccupiedCell[game.currentMoveDirection]
  );
  snakeHead.pullOtherSegments();
};

const gameLoop = () => {
  game.loopTimeout = setTimeout(
    gameLoop,
    settings.difficulty.getValue().tickSpeed
  );
  moveSnake();
};

const stopGame = () => {
  clearTimeout(game.loopTimeout);
};

const loseGame = () => {
  game.stateMachine.setState(new GameOver());
};

const startGame = () => {
  snakeHead.setOccupiedCell(getMiddleCellOfMovementGrid());
  spawnFoodRandomly();
  game.stateMachine.setState(new Running());
};

const updateCountdownDisplay = () => {
  countdownDisplay.innerText = game.countdown === 0 ? 'Begin!' : game.countdown;
};

const stopCountdown = () => {
  countdownContainer.className = '';
};

const changeMenu = (menuClass, track = false) => {
  document
    .querySelectorAll('.show-menu')
    .forEach((element) => element.classList.remove('show-menu'));
  let menu = document.getElementById(menuClass);

  if (menu) {
    if (track) {
      game.menuStack.push(menuClass);
    }

    menu.classList.add('show-menu');
  }
};
//

// --Event Listeners-- //
document.onkeydown = (e) => {
  game.stateMachine.getState().setMoveDirection(e.key);

  if (e.key === 'Escape') {
    game.stateMachine.getState().pauseGame();
  }
};
playBtn.addEventListener('click', () => {
  game.stateMachine.setState(new Countdown());
});
settingsBtn.addEventListener('click', () => {
  changeMenu('settings-menu', true);
});
aboutBtn.addEventListener('click', () => {
  // https://www.freecodecamp.org/news/html-button-link-code-examples-how-to-make-html-hyperlinks-using-the-href-attribute-on-tags/
  window.location.href = 'about_page/about.html';
});
resumeBtn.addEventListener('click', () => {
  game.stateMachine.getState().pauseGame();
});
backBtns.forEach((element) => {
  element.addEventListener('click', () => {
    if (game.menuStack.length > 1) {
      game.menuStack.pop();
      changeMenu(game.menuStack[game.menuStack.length - 1]);
    }
  });
});
resetBtns.forEach((element) => {
  element.addEventListener('click', () => {
    game.reset();
    game.stateMachine.setState(new Countdown());
  });
});
quitBtns.forEach((element) => {
  element.addEventListener('click', () => {
    game.stateMachine.getState().quitGame();
  });
});
countdownDisplay.addEventListener('animationiteration', () => {
  game.countdown--;
  updateCountdownDisplay();
});
countdownDisplay.addEventListener('animationend', () => {
  startGame();
});
allBtns.forEach((element) => {
  element.addEventListener('click', () => {
    settings.playSound('buttonClickSound');
  });
});

// --Main-- //
setupMovementGrid();
const snakeHead = new SnakeHead(null, 'snake-head');
//
