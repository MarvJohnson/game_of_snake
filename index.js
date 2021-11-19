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
    this.element.style.background = this.currentOccupant.cellVisual;
  }

  removeOccupant() {
    this.currentOccupant = null;
    this.element.style.background = this.originalVisual;
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
  static snakeVisual = '#2e8bd2';
  currentlyOccupiedCell;
  lastOccupiedCell = null;
  nextSegment;
  constructor(currentlyOccupiedCell, snakeVisual) {
    super(snakeVisual);
    this.setOccupiedCell(currentlyOccupiedCell);
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

    this.setOccupiedCell(getMiddleCellOfMovementGrid());
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
  }
}

class Apple extends Food {
  constructor() {
    super('Apple', 'yellow', 10, false);
  }
}

class Banana extends Food {
  constructor() {
    super('Banana', 'yellow', 10, false);
  }
}

// --Global Variables-- //
const playArea = document.getElementById('play-area');
const scoreValue = document.getElementById('score-value');
const previousBestScoreValue = document.getElementById(
  'previous-best-score-value'
);
const foodEatenValue = document.getElementById('food-eaten-value');
const movementGridCells = [];

const settings = {
  movementGridDimensions: {
    x: 21,
    y: 21
  }
};

const game = {
  state: 'pre-game',
  score: 0,
  previousBestScore: 0,
  foodEaten: 0,
  foodItems: [new Apple(), new Banana()],
  foodItemsOnGrid: 0,
  initialMoveDirection: 'right',
  currentMoveDirection: 'right',
  loopTimeout: undefined,
  tickSpeed: 80,
  setMoveDirection(movementKey) {
    switch (movementKey) {
      case 'w':
        this.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.up
            ? 'up'
            : this.currentMoveDirection;
        break;
      case 'a':
        this.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.left
            ? 'left'
            : this.currentMoveDirection;
        break;
      case 's':
        this.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.down
            ? 'down'
            : this.currentMoveDirection;
        break;
      case 'd':
        this.currentMoveDirection =
          snakeHead.lastOccupiedCell !== snakeHead.currentlyOccupiedCell.right
            ? 'right'
            : this.currentMoveDirection;
        break;
    }
  },
  updateScoreDisplays() {
    scoreValue.innerText = this.score.toString();
    previousBestScoreValue.innerText = this.previousBestScore.toString();
    foodEatenValue.innerText = this.foodEaten.toString();
  },
  changeScore(amount) {
    this.score += amount;

    if (this.score > this.previousBestScore) {
      this.previousBestScore = this.score;
    }

    this.updateScoreDisplays();
  },
  changeFoodEaten(amount) {
    this.foodEaten += amount;
    this.updateScoreDisplays();
  },
  resetScores(includePb = false) {
    this.score = 0;
    this.foodEaten = 0;

    if (includePb) {
      this.previousBestScore = 0;
    }

    this.updateScoreDisplays();
  },
  reset() {
    stopGame();
    resetMovementGrid();
    this.resetScores();
    snakeHead.reset();
    this.currentMoveDirection = this.initialMoveDirection;
    startGame();
  }
};

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
      if (currentCell.topNeighbor) {
        currentCell.topNeighbor.element.style.backgroundColor = 'red';
      }
      if (currentCell.rightNeighbor) {
        currentCell.rightNeighbor.element.style.backgroundColor = 'orange';
      }
      if (currentCell.bottomNeighbor) {
        currentCell.bottomNeighbor.element.style.backgroundColor = 'yellow';
      }
      if (currentCell.leftNeighbor) {
        currentCell.leftNeighbor.element.style.backgroundColor = 'green';
      }
      setTimeout(() => {
        currentCell.element.style.backgroundColor = 'transparent';
        if (currentCell.topNeighbor) {
          currentCell.topNeighbor.element.style.backgroundColor = 'transparent';
        }
        if (currentCell.rightNeighbor) {
          currentCell.rightNeighbor.element.style.backgroundColor =
            'transparent';
        }
        if (currentCell.bottomNeighbor) {
          currentCell.bottomNeighbor.element.style.backgroundColor =
            'transparent';
        }
        if (currentCell.leftNeighbor) {
          currentCell.leftNeighbor.element.style.backgroundColor =
            'transparent';
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
  game.loopTimeout = setTimeout(gameLoop, game.tickSpeed);
  moveSnake();
};

const stopGame = () => {
  clearTimeout(game.loopTimeout);
};

const loseGame = () => {
  stopGame();
  console.log('Game over!');
};

const startGame = () => {
  spawnFoodRandomly();
  gameLoop();
};
// --Event Listeners-- //
document.onkeydown = (e) => {
  game.setMoveDirection(e.key);

  if (e.key === 'e') {
    addSnakeSegment();
  }

  if (e.key === 'q') {
    spawnFoodRandomly();
  }

  if (e.key === 'r') {
    game.reset();
  }
};

// --Main-- //
setupMovementGrid();
const snakeHead = new SnakeHead(getMiddleCellOfMovementGrid(), '#2574B1');
startGame();
