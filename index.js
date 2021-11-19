// --Global Variables-- //
const playArea = document.getElementById('play-area');
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
  foodEaten: 0,
  currentMoveDirection: 'right',
  loopTimeout: undefined,
  tickSpeed: 100,
  setMoveDirection(movementKey) {
    switch (movementKey) {
      case 'w':
        this.currentMoveDirection =
          SnakeSegment.snakeHead.lastOccupiedCell !==
          SnakeSegment.snakeHead.currentlyOccupiedCell.topNeighbor
            ? 'up'
            : this.currentMoveDirection;
        break;
      case 'a':
        this.currentMoveDirection =
          SnakeSegment.snakeHead.lastOccupiedCell !==
          SnakeSegment.snakeHead.currentlyOccupiedCell.leftNeighbor
            ? 'left'
            : this.currentMoveDirection;
        break;
      case 's':
        this.currentMoveDirection =
          SnakeSegment.snakeHead.lastOccupiedCell !==
          SnakeSegment.snakeHead.currentlyOccupiedCell.bottomNeighbor
            ? 'down'
            : this.currentMoveDirection;
        break;
      case 'd':
        this.currentMoveDirection =
          SnakeSegment.snakeHead.lastOccupiedCell !==
          SnakeSegment.snakeHead.currentlyOccupiedCell.rightNeighbor
            ? 'right'
            : this.currentMoveDirection;
        break;
    }
  }
};

// --Classes-- //
class Cell {
  topNeighbor;
  rightNeighbor;
  bottomNeighbor;
  leftNeighbor;
  currentOccupant = null;
  constructor(element) {
    this.element = element;
  }

  setOccupant(occupant) {
    this.currentOccupant = occupant;
    this.element.style.background = this.currentOccupant.cellVisual;
  }

  removeOccupant() {
    this.currentOccupant = null;
    this.element.style.background = 'transparent';
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
  static snakeHead;
  static snakeLength = 1;
  static snakeVisual = 'green';
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
}

class Food extends Occupant {
  constructor(name, foodVisual, value, poisonous) {
    super(foodVisual);
    this.name = name;
    this.value = value;
    this.poisonous = poisonous;
  }
}

// --Functions-- //
const getMiddleCellOfMovementGrid = () => {
  return movementGridCells[
    Math.floor(
      settings.movementGridDimensions.x *
        (settings.movementGridDimensions.y / 2)
    )
  ];
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
      movementGridCells.push(newCell);
    }
  }
};

const setupCellNeighbors = () => {
  movementGridCells.forEach((element, index) => {
    let indexForRows = index % settings.movementGridDimensions.x;
    let topNeighborIndex = index - settings.movementGridDimensions.x;
    let rightNeighborIndex = index + 1;
    let bottomNeighborIndex = index + settings.movementGridDimensions.x;
    let leftNeighborIndex = index - 1;

    element.topNeighbor =
      index >= settings.movementGridDimensions.x
        ? movementGridCells[topNeighborIndex]
        : null;
    element.rightNeighbor =
      indexForRows < settings.movementGridDimensions.x - 1
        ? movementGridCells[rightNeighborIndex]
        : null;
    element.bottomNeighbor =
      index <= movementGridCells.length - settings.movementGridDimensions.x - 1
        ? movementGridCells[bottomNeighborIndex]
        : null;
    element.leftNeighbor =
      indexForRows > 0 ? movementGridCells[leftNeighborIndex] : null;
  });
};

const setupMovementGrid = () => {
  playArea.style.gridTemplate = `repeat(${settings.movementGridDimensions.y}, 1fr) / repeat(${settings.movementGridDimensions.x}, 1fr)`;
  placeAllCellElements();
  setupCellNeighbors();
};

const increaseSnakeLength = () => {
  let newSnakeSegment = new SnakeSegment(
    SnakeSegment.snakeHead.getTail().lastOccupiedCell,
    SnakeSegment.snakeVisual
  );
  SnakeSegment.snakeHead.getTail().nextSegment = newSnakeSegment;
  SnakeSegment.snakeLength++;
};

const moveSnake = () => {
  switch (game.currentMoveDirection) {
    case 'up':
      if (SnakeSegment.snakeHead.currentlyOccupiedCell.topNeighbor) {
        SnakeSegment.snakeHead.setOccupiedCell(
          SnakeSegment.snakeHead.currentlyOccupiedCell.topNeighbor
        );
      } else {
        loseGame();
      }
      break;
    case 'down':
      if (SnakeSegment.snakeHead.currentlyOccupiedCell.bottomNeighbor) {
        SnakeSegment.snakeHead.setOccupiedCell(
          SnakeSegment.snakeHead.currentlyOccupiedCell.bottomNeighbor
        );
      } else {
        loseGame();
      }
      break;
    case 'left':
      if (SnakeSegment.snakeHead.currentlyOccupiedCell.leftNeighbor) {
        SnakeSegment.snakeHead.setOccupiedCell(
          SnakeSegment.snakeHead.currentlyOccupiedCell.leftNeighbor
        );
      } else {
        loseGame();
      }
      break;
    case 'right':
      if (SnakeSegment.snakeHead.currentlyOccupiedCell.rightNeighbor) {
        SnakeSegment.snakeHead.setOccupiedCell(
          SnakeSegment.snakeHead.currentlyOccupiedCell.rightNeighbor
        );
      } else {
        loseGame();
      }
      break;
  }
  SnakeSegment.snakeHead.pullOtherSegments();
};

const gameLoop = () => {
  if (game.state === 'running') {
    moveSnake();
    game.loopTimeout = setTimeout(gameLoop, game.tickSpeed);
    console.log(`game.looptimeout is now ${game.loopTimeout}`);
  }
};

const stopGame = () => {
  console.log(`stopping game.loopTimeout ${game.loopTimeout}`);
  clearTimeout(game.loopTimeout);
  game.state = 'stopped';
};

const loseGame = () => {
  stopGame();
};

const startGame = () => {
  game.state = 'running';
  gameLoop();
};
// --Event Listeners-- //
document.onkeydown = (e) => {
  game.setMoveDirection(e.key);

  if (e.key === 'e') {
    increaseSnakeLength();
  }
};

// --Main-- //
setupMovementGrid();

SnakeSegment.snakeHead = new SnakeSegment(
  getMiddleCellOfMovementGrid(),
  'darkgreen'
);
console.log(SnakeSegment.snakeHead);
startGame();
