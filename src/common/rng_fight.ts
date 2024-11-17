/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rng_fight.json`.
 */
export type RngFight = {
  "address": "Fe4xbkhVRRCiJxPN2n9rZWJkfdiJj1D9mifGMWE36Ao8",
  "metadata": {
    "name": "rngFight",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptChallenge",
      "discriminator": [
        195,
        227,
        139,
        241,
        55,
        193,
        153,
        105
      ],
      "accounts": [
        {
          "name": "defender",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "challengeId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "attack",
      "discriminator": [
        197,
        26,
        63,
        242,
        77,
        247,
        101,
        119
      ],
      "accounts": [
        {
          "name": "attacker",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "challengeId",
          "type": "u64"
        },
        {
          "name": "damage",
          "type": "i8"
        }
      ]
    },
    {
      "name": "createChallenge",
      "discriminator": [
        170,
        244,
        47,
        1,
        1,
        15,
        173,
        239
      ],
      "accounts": [
        {
          "name": "challenger",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "challengeId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeGameAccount",
      "discriminator": [
        27,
        63,
        89,
        12,
        212,
        206,
        254,
        42
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "challengeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  115
                ]
              }
            ]
          }
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
      "name": "challengeAccount",
      "discriminator": [
        96,
        128,
        44,
        165,
        71,
        172,
        60,
        12
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "challengeNotFound",
      "msg": "Challenge Not Found!"
    },
    {
      "code": 6001,
      "name": "invalidAction",
      "msg": "Invalid Action!"
    },
    {
      "code": 6002,
      "name": "notYourTurn",
      "msg": "Not Your Turn!"
    }
  ],
  "types": [
    {
      "name": "challenge",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challengeId",
            "type": "u64"
          },
          {
            "name": "challenger",
            "type": "pubkey"
          },
          {
            "name": "defender",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "challengerHealth",
            "type": "u8"
          },
          {
            "name": "defenderHealth",
            "type": "u8"
          },
          {
            "name": "currentTurn",
            "type": "pubkey"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "state"
              }
            }
          }
        ]
      }
    },
    {
      "name": "challengeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "challenges",
            "type": {
              "vec": {
                "defined": {
                  "name": "challenge"
                }
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "state",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "invitationSent"
          },
          {
            "name": "started"
          },
          {
            "name": "ended"
          },
          {
            "name": "going"
          }
        ]
      }
    }
  ]
};
