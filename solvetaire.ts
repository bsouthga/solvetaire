
interface Card {
  suit: number,
  value: number,
  hidden: boolean
}

interface Board {
  positions: Card[][];
  finished: Card[][];
  showing: Card[];
  remaining: Card[];
  states: StateHash;
}

interface StateHash {
  [key: string]: boolean;
}



function play(board: Board) {
  const hash = encode(board);
  const positions = board.positions;
  const finished = board.finished;
  const showing = board.showing;
  const remaining = board.remaining;

  if (won(board)) return hash;
  if (board.states[hash]) return false;

  // we have visited this state in this game tree
  board.states[hash] = true;

  return (
    move(positions, positions, board)         ||
    move(positions, finished, board)          ||
    move([[last(showing)]], finished, board)  ||
    move([[last(showing)]], positions, board) ||
    move(finished, positions, board, true)    ||
    play(draw(board))
  );
}


function move(from: Card[][], to: Card[][], board: Board, finish?: boolean): string | void {
  const paths: (string | void)[] = [];

  for (let i = 0, f = from.length; i < f; i++) {
    for (let j = 0, t = to.length; j < t; j++) {
      const A = from[i].pop();
      const B = last(to[j]);
      if (A && B && canMove(A, B, finish)) {
        to[j].push(A);
        paths.push(play(clone(board)));
        to[j].pop();
      }
      if (A) from[i].push(A);
    }
  }

  // check if any branches resulted in a win for this game
  for (let i = 0, l = paths.length; i < l; i++) {
    if (paths[i]) return paths[i];
  }
}



function cloneCard(card: Card): Card {
  return {
    suit: card.suit,
    value: card.value,
    hidden: card.hidden
  };
}

function cloneNested(arr: Card[]): Card[] {
  return arr.map(cloneCard);
}


function clone(board: Board): Board {
  const states: StateHash = {};
  for (let s in board.states) states[s] = true;
  return {
    positions: map(board.positions, cloneNested),
    finished: map(board.finished, cloneNested),
    remaining: map(board.remaining, cloneCard),
    showing: map(board.showing, cloneCard),
    states: states
  };
}


function map<T, U>(arr: U[], fn: (U) => T): T[] {
  const out: T[] = [];
  for (let i = 0, l = arr.length; i < l; i++) {
    out.length++;
    out[i] = fn(arr[i]);
  }
  return out;
}



function won(board: Board): boolean {
  const f = board.finished;
  return (
    f[0].length === 13 &&
    f[1].length === 13 &&
    f[2].length === 13 &&
    f[3].length === 13
  );
}


function draw(board: Board): Board {
  const l = board.remaining.length;
  let i = Math.min(l, 3);

  if (i === 0) {
    board.remaining = board.showing;
    board.showing = [];
    return draw(board);
  }

  while (i--) board.showing.push(board.remaining.pop());

  return board;
}


function canMove(A: Card, B: Card, finish?: boolean): boolean {
  const differentColor = A.suit % 2 !== B.suit % 2;
  const decrease = A.value === B.value - 1;
  const sameSuit = A.suit === B.suit;
  return finish
    ? sameSuit && decrease
    : differentColor && decrease;
}


function shuffle(deck: Card[]): Card[] {
  const n = deck.length;
  for (let i = 0; i < n; i++) {
    const rand = Math.floor(Math.random() * n);
    const temp = deck[rand];
    deck[rand] = deck[i];
    deck[i] = temp;
  }
  return deck;
}


function deal(): Card[] {
  const deck = [];
  for (let suit = 1; suit <= 4; suit++) {
    for (let value = 1; value < 13; value++) {
      deck.push({ suit: suit, value: value, hidden: true });
    }
  }

  let i = 50;
  while(i--) shuffle(deck);
  return deck;
}


function join(arr: any[], fn: Function): string {
  let out = "";
  for (let i = 0, l = arr.length; i < l; i++) {
    out += (i ? "," : "") + fn(arr[i]);
  }
  return out;
}


function encode(board: Board): string {
  return (
    "p:" + join(board.positions, encodeNested) + "|" +
    "f:" + join(board.finished, encodeNested) + "|" +
    "s:" + join(board.showing, encodeCard) + "|" +
    "r:" + join(board.remaining, encodeCard)
  );
}


function encodeNested(arr: Card[]): string {
  return "-" + join(arr, encodeCard) + "-";
}


function encodeCard(card: Card): string {
  return "(" + (card.suit || "") + "," + (card.value || "") + ")";
}


function game(deck: Card[]): Board {
  const positions = [[], [], [], [], [], [], []];
  const finished = [[], [], [], []];
  const remaining = [];
  const states: StateHash = {};
  const n = shuffle(deck).length;

  for (let i = 0; i < n; deck[i++].hidden = true);

  let cardIndex = 0;
  for (let i = 0; i < positions.length; i++) {
    let count = i + 1;
    while (count--) {
      const card = deck[cardIndex++];
      if (count === i + 1) card.hidden = false;
      positions[i].push(card);
    }
  }

  while (cardIndex < n) remaining.push(deck[cardIndex++]);

  return {
    positions: positions,
    remaining: remaining,
    finished: finished,
    showing: [],
    states: states
  };
}

function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}


function main(): void {
  console.log(
    play(draw(game(deal())))
  );
}


main();

