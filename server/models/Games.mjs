import dayjs from 'dayjs';

// Costruttore per Card
function Card(id, description, image, misfortuneIndex) {
  this.id = id;
  this.description = description;
  this.image = image;
  this.misfortuneIndex = misfortuneIndex;
}

// Costruttore per Game
function Game(id, userId, date, cards = [], status = 'ongoing') {
  this.id = id;
  this.userId = userId;
  this.cards = cards; // array di id delle carte possedute
  this.status = status;
  this.date = dayjs(date);
}

export { Card, Game };