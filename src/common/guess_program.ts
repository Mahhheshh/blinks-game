/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/guess_program.json`.
 */
export type GuessProgram = {
  "address": "52FBC8SyRo1ZoE5vFY7qcu3EePgKeLRhquxcGeetUCL",
  "metadata": {
    "name": "guessProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "guess",
      "discriminator": [
        150,
        196,
        62,
        128,
        129,
        236,
        114,
        40
      ],
      "accounts": [
        {
          "name": "pdaAccount",
          "writable": true
        },
        {
          "name": "guesser",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "guessNumber",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "pdaAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "challengeId",
          "type": "u64"
        },
        {
          "name": "secretNumber",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "guessAccount",
      "discriminator": [
        235,
        244,
        125,
        203,
        130,
        75,
        18,
        220
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "winnerAlreadyDeclared",
      "msg": "A winner has already been declared."
    }
  ],
  "types": [
    {
      "name": "guessAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challengeId",
            "type": "u64"
          },
          {
            "name": "secretNumber",
            "type": "u64"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    }
  ]
};
