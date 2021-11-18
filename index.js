// --Global Variables-- //
const playArea = document.getElementById('play-area');
const movementGridCells = [];

const settings = {
  movementGridDimensions: {
    x: 20,
    y: 20
  }
};

const game = {
  state: 'pre-game',
  score: 0,
  foodEaten: 0,
  currentMoveDirection: 'right'
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

class SnakePart extends Occupant {
  static snakeHead;
  lastOccupiedCell = null;
  constructor(currentlyOccupiedCell, snakeVisual) {
    super(snakeVisual);
    this.currentlyOccupiedCell = currentlyOccupiedCell;
  }

  setOccupiedCell(cell) {
    super.setOccupiedCell(cell);
    this.lastOccupiedCell = this.currentlyOccupiedCell;
    this.currentlyOccupiedCell = cell;
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

// --Event Listeners-- //

// --Main-- //
setupMovementGrid();
SnakePart.snakeHead = new SnakePart(null, '#eee');
console.log(SnakePart.snakeHead);
