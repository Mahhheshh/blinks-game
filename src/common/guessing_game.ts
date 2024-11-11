/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/guessing_game.json`.
 */
export type GuessingGame = {
  "address": "Gp9DomzAFXA8uoyqSdFcBm6UMezq9mrUnmzgaFWFvwjC",
  "metadata": {
    "name": "guessingGame",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "close",
      "discriminator": [
        98,
        165,
        201,
        177,
        108,
        65,
        206,
        96
      ],
      "accounts": [
        {
          "name": "pdaAccount",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "pdaAccount"
          ]
        },
        {
          "name": "receiver"
        }
      ],
      "args": []
    },
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
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  117,
                  101,
                  115,
                  115,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
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
          "name": "secretNumber",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeState",
      "discriminator": [
        190,
        171,
        224,
        219,
        217,
        72,
        199,
        176
      ],
      "accounts": [
        {
          "name": "state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  117,
                  101,
                  115,
                  115,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
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
    },
    {
      "name": "stateAccount",
      "discriminator": [
        142,
        247,
        54,
        95,
        85,
        133,
        249,
        103
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "winnerAlreadyDeclared",
      "msg": "A winner has already been declared."
    },
    {
      "code": 6001,
      "name": "challengeIdOverflow",
      "msg": "Challenge ID overflow"
    },
    {
      "code": 6002,
      "name": "alreadyInitialized",
      "msg": "The state has already been initialized."
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
    },
    {
      "name": "stateAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "currentChallengeId",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
