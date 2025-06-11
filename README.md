[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #N: "Exam Title"
## Student: s123456 LASTNAME FIRSTNAME 

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/something`
  - request parameters and request body content
  - response body content
- GET `/api/something`
  - request parameters
  - response body content
- POST `/api/something`
  - request parameters and request body content
  - response body content
- ...

## APIs
Hereafter, we report the designed HTTP APIs, also implemented in the project.

---

### __Login__

URL: `/api/sessions`  
HTTP Method: POST

Description: Authenticates a user and starts a session.

Request body:
```
{
  "username": "user@polito.it",
  "password": "your_password"
}
```

Response:  
- `201 Created` (success, user authenticated)  
- `401 Unauthorized` (wrong credentials)  
- `500 Internal Server Error` (generic error)

Response body (success):
```
{
  "user_id": 1,
  "email": "ilaria@polito.it",
  "name": "Ilaria"
}
```

---

### __Get current session__

URL: `/api/sessions/current`  
HTTP Method: GET

Description: Returns the authenticated user's info.

Response:  
- `200 OK` (session exists)  
- `401 Unauthorized` (not authenticated)  

Response body (success):
```
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "Mario Rossi"
}
```

---

### __Logout__

URL: `/api/sessions/current`  
HTTP Method: DELETE

Description: Logs out the current user.

Response:  
- `200 OK` (logout success)  

Response body: _None_

---

### __Get random cards__

URL: `/api/cards`  
HTTP Method: GET

Description: Retrieve a set of random cards.  
Query parameters:  
- `count` (integer, optional, default=1): number of cards to retrieve  
- `exclude` (array, optional): card IDs to exclude (e.g. `/api/cards?count=3&exclude=2&exclude=7`)  
- `withMisfortuneIndex` (boolean, optional, default=true): if false, omits the `misfortune_index` field

Response: `200 OK` (success), or `400 Bad Request` (error).

Response body:
```
[
  {
    "card_id": 5,
    "description": "Hai dimenticato il portafoglio a casa.",
    "image": "img5.png",
    "misfortune_index": 15.5
  }
]
```
or, if `withMisfortuneIndex=false`:
```
[
  {
    "card_id": 5,
    "description": "Hai dimenticato il portafoglio a casa.",
    "image": "img5.png"
  }
]
```

---

### __Get a card by id__

URL: `/api/cards/<id>`  
HTTP Method: GET

Description: Retrieve the card represented by `<id>`.

Response:  
- `200 OK` (success)  
- `404 Not Found` (wrong id)  
- `400 Bad Request` (generic error)

Response body:
```
{
  "card_id": 5,
  "description": "...",
  "image": "...",
  "misfortune_index": 15.5
}
```

---

### __Create a new game__

URL: `/api/games`  
HTTP Method: POST

Description: Create a new game.

Request body:
```
{
  "user_id": 1,
  "initialCardIds": [23, 12, 7],
  "status": "ongoing"
}
```

Response:  
- `201 Created` (success, the created game id)  
- `400 Bad Request` (error)

Response body:
```
{
  "game_id": 10
}
```

---

### __List all games for a user__

URL: `/api/games/user/<userId>`  
HTTP Method: GET

Description: Retrieve all games for the user `<userId>`.

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
[
  {
    "game_id": 10,
    "user_id": 1,
    "date": "2025-06-11T08:12:00Z",
    "status": "ongoing"
  },
  ...
]
```

---

### __Get a game by id__

URL: `/api/games/<gameId>`  
HTTP Method: GET

Description: Retrieve the game represented by `<gameId>`.

Response:  
- `200 OK` (success)  
- `404 Not Found` (wrong id)  
- `400 Bad Request` (error)

Response body:
```
{
  "game_id": 10,
  "user_id": 1,
  "date": "2025-06-11T08:12:00Z",
  "status": "ongoing"
}
```

---

### __Update game status__

URL: `/api/games/<gameId>/status`  
HTTP Method: PATCH

Description: Update the status of a game.

Request body:
```
{
  "status": "won"
}
```

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)  

Response body:
```
{}
```

---

### __Delete a game__

URL: `/api/games/<gameId>`  
HTTP Method: DELETE

Description: Delete a game and all its associated data.

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
{}
```

---

### __Get initial cards of a game__

URL: `/api/games/<gameId>/initial-cards`  
HTTP Method: GET

Description: Retrieve the initial cards for a game, ordered by `misfortune_index`.

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
[
  {
    "card_id": 5,
    "description": "...",
    "image": "...",
    "misfortune_index": 15.5
  },
  ...
]
```

---

### __Get all rounds of a game__

URL: `/api/games/<gameId>/rounds`  
HTTP Method: GET

Description: Retrieve all rounds of the game `<gameId>`.

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
[
  {
    "round_id": 21,
    "game_id": 10,
    "card_id": 5,
    "round_number": 2,
    "guessed_correctly": 1,
    "chosen_position": 3,
    "time": "2025-06-11T08:15:00Z"
  },
  ...
]
```

---

### __Add a new round to a game__

URL: `/api/games/<gameId>/rounds`  
HTTP Method: POST

Description: Add a new round to the game `<gameId>`.

Request body:
```
{
  "card_id": 7,
  "round_number": 2,
  "guessed_correctly": 1,
  "chosen_position": 2,
  "time": "2025-06-11T09:15:00Z"
}
```

Response:  
- `201 Created` (success, with the created round id)  
- `400 Bad Request` (error)

Response body:
```
{
  "round_id": 31
}
```

---

### __Get all won cards of a game__

URL: `/api/games/<gameId>/rounds/won`  
HTTP Method: GET

Description: Retrieve all won cards (guessed correctly) for game `<gameId>`.

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
[
  {
    "card": {
      "card_id": 5,
      "description": "...",
      "image": "...",
      "misfortune_index": 15.5
    },
    "round_number": 2
  },
  ...
]
```

---

### __Get a card for the next round__

URL: `/api/games/<gameId>/next-card`  
HTTP Method: GET

Description: Get a random card for the next round, excluding cards already in hand or already played.

Query parameters:
- `exclude` (array of card_id to exclude)
- `withMisfortuneIndex` (boolean, optional, default=false)

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body (default):
```
{
  "card_id": 8,
  "description": "...",
  "image": "..."
}
```
or, if `withMisfortuneIndex=true`:
```
{
  "card_id": 8,
  "description": "...",
  "image": "...",
  "misfortune_index": 47.5
}
```

---

### __Get demo cards (anonymous game)__

URL: `/api/demo`  
HTTP Method: GET

Description: Get a demo game for anonymous users (3 initial cards + 1 to guess).

Response:  
- `200 OK` (success)  
- `400 Bad Request` (error)

Response body:
```
{
  "initialCards": [
    { "card_id": 5, "description": "...", "image": "...", "misfortune_index": 15.5 },
    { "card_id": 7, "description": "...", "image": "...", "misfortune_index": 25.5 },
    { "card_id": 2, "description": "...", "image": "...", "misfortune_index": 35.5 }
  ],
  "roundCard": {
    "card_id": 8,
    "description": "...",
    "image": "..."
  }
}
```

---

## Database Tables

- Table `users` - contains xx yy zz
- Table `something` - contains ww qq ss
- ...

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username `ilaria@polito.it`, password `Ilaria00!`
- username `francesca@polito.it`, password `Francesca02!`
- username `roberta@polito.it`, password `Roberta07!`
