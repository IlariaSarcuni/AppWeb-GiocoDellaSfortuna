import dayjs from 'dayjs';

function Card(card_id, description, image, misfortune_index) {
  this.card_id = card_id;
  this.description = description;
  this.image = image;
  this.misfortune_index = misfortune_index;
}

function Game(game_id, user_id, date, status = 'ongoing') {
  this.game_id = game_id;
  this.user_id = user_id;
  this.date = dayjs(date);
  this.status = status;
 }

function Round(round_id, game_id, card_id, round_number, guessed_correctly, chosen_position, time) {
  this.round_id = round_id;
  this.game_id = game_id;
  this.card_id = card_id;
  this.round_number = round_number;
  this.guessed_correctly = guessed_correctly;
  this.chosen_position = chosen_position;
  this.time = dayjs(time);
}

export { Card, Game, Round };
