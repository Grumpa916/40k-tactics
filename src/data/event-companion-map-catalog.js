// Derived without geometry changes from the verified V1 Event Companion v1.2 extraction.
// Reference-only provenance: Grumpa916/onoforge40k data/warhammer-event-companion-v1.2.json
// Source geometry is a visual guide, not a rules/line-of-sight authority.
export const EVENT_COMPANION_MAP_CATALOG = Object.freeze({
  "schemaVersion": "event-companion-map-catalog.v1",
  "source": {
    "title": "Warhammer Event Companion",
    "version": "1.2",
    "sourceUrl": "https://assets.warhammer-community.com/eng_wh40k_event_companion-pl87i44rzn-a7ieny8i9x.pdf",
    "geometrySource": "Warhammer Event Companion v1.2 official PDF layout artwork (vector geometry extraction)",
    "battlefield": {
      "widthInches": 60,
      "heightInches": 44,
      "coordinateOrigin": "bottom-left"
    },
    "layoutKeyPage": 8
  },
  "layoutIndex": [
    {
      "missionA": "Battlefield Dominance",
      "missionB": "Battlefield Dominance",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        9,
        10,
        11
      ]
    },
    {
      "missionA": "Immovable Object",
      "missionB": "Unstoppable Force",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        12,
        13,
        14
      ]
    },
    {
      "missionA": "Determined Acquisition",
      "missionB": "Death Trap",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        15,
        16,
        17
      ]
    },
    {
      "missionA": "Purge and Secure",
      "missionB": "Reconnaissance Sweep",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        18,
        19,
        20
      ]
    },
    {
      "missionA": "Inescapable Dominion",
      "missionB": "Secure Asset",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        21,
        22,
        23
      ]
    },
    {
      "missionA": "Meatgrinder",
      "missionB": "Meatgrinder",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        24,
        25,
        26
      ]
    },
    {
      "missionA": "Punishment",
      "missionB": "Delaying Action",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        27,
        28,
        29
      ]
    },
    {
      "missionA": "Consecrate",
      "missionB": "Triangulation",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        30,
        31,
        32
      ]
    },
    {
      "missionA": "Destroyer's Wrath",
      "missionB": "Vital Link",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        33,
        34,
        35
      ]
    },
    {
      "missionA": "Outmanoeuvre",
      "missionB": "Outmanoeuvre",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        36,
        37,
        38
      ]
    },
    {
      "missionA": "Smoke and Mirrors",
      "missionB": "Surveil the Foe",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        39,
        40,
        41
      ]
    },
    {
      "missionA": "Extract Relic",
      "missionB": "Locate and Deny",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        42,
        43,
        44
      ]
    },
    {
      "missionA": "Gather Intel",
      "missionB": "Gather Intel",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        45,
        46,
        47
      ]
    },
    {
      "missionA": "Vanguard Operation",
      "missionB": "Search and Scour",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        48,
        49,
        50
      ]
    },
    {
      "missionA": "Sabotage",
      "missionB": "Sabotage",
      "layouts": [
        "A",
        "B",
        "C"
      ],
      "pages": [
        51,
        52,
        53
      ]
    }
  ],
  "layouts": [
    {
      "missionKey": "Battlefield Dominance ↔ Battlefield Dominance",
      "missionA": "Battlefield Dominance",
      "missionB": "Battlefield Dominance",
      "layout": "A",
      "page": 9,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 12.7,
          "y": 25.8
        },
        "Attacker Home": {
          "x": 49.8,
          "y": 16.5
        },
        "Central 1": {
          "x": 30,
          "y": 22
        },
        "Expansion 1": {
          "x": 19.2,
          "y": 7.4
        },
        "Expansion 2": {
          "x": 41.9,
          "y": 36.7
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 47,
              "y": 33
            },
            {
              "x": 35.4,
              "y": 33
            },
            {
              "x": 35.4,
              "y": 40
            },
            {
              "x": 47,
              "y": 40
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.4,
              "y": 11.5
            },
            {
              "x": 43.4,
              "y": 12
            },
            {
              "x": 46,
              "y": 12
            },
            {
              "x": 46,
              "y": 2
            },
            {
              "x": 43.4,
              "y": 2
            },
            {
              "x": 43.4,
              "y": 9.4
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 16.2
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 40.5,
              "y": 21
            },
            {
              "x": 42.5,
              "y": 21
            },
            {
              "x": 42.5,
              "y": 27.1
            },
            {
              "x": 40.5,
              "y": 27.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 17.5,
              "y": 23
            },
            {
              "x": 5.8,
              "y": 23
            },
            {
              "x": 5.8,
              "y": 30.1
            },
            {
              "x": 17.5,
              "y": 30.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 12.9,
              "y": 11
            },
            {
              "x": 24.5,
              "y": 11
            },
            {
              "x": 24.5,
              "y": 3.9
            },
            {
              "x": 12.9,
              "y": 3.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 30,
              "y": 33.9
            },
            {
              "x": 28,
              "y": 33.9
            },
            {
              "x": 28,
              "y": 40
            },
            {
              "x": 30,
              "y": 40
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 16.5,
              "y": 32.5
            },
            {
              "x": 16.4,
              "y": 31.9
            },
            {
              "x": 13.8,
              "y": 31.9
            },
            {
              "x": 13.8,
              "y": 41.9
            },
            {
              "x": 16.4,
              "y": 41.9
            },
            {
              "x": 16.4,
              "y": 34.5
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 8.9,
              "y": 11
            },
            {
              "x": 8.9,
              "y": 17
            },
            {
              "x": 12.9,
              "y": 17
            },
            {
              "x": 12.9,
              "y": 11
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 28,
              "y": 31.9
            },
            {
              "x": 21.9,
              "y": 31.9
            },
            {
              "x": 21.9,
              "y": 35.9
            },
            {
              "x": 28,
              "y": 35.9
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 27.8
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 19.5,
              "y": 23
            },
            {
              "x": 17.5,
              "y": 23
            },
            {
              "x": 17.5,
              "y": 17
            },
            {
              "x": 19.5,
              "y": 17
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 54.1,
              "y": 21
            },
            {
              "x": 42.5,
              "y": 21
            },
            {
              "x": 42.5,
              "y": 14
            },
            {
              "x": 54.1,
              "y": 14
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 29.9,
              "y": 10.1
            },
            {
              "x": 31.9,
              "y": 10.1
            },
            {
              "x": 31.9,
              "y": 4
            },
            {
              "x": 29.9,
              "y": 4
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 32,
              "y": 12.1
            },
            {
              "x": 38,
              "y": 12.1
            },
            {
              "x": 38,
              "y": 8.1
            },
            {
              "x": 32,
              "y": 8.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 51.1,
              "y": 32.9
            },
            {
              "x": 51.1,
              "y": 26.9
            },
            {
              "x": 47.1,
              "y": 26.9
            },
            {
              "x": 47.1,
              "y": 32.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Battlefield Dominance ↔ Battlefield Dominance",
      "missionA": "Battlefield Dominance",
      "missionB": "Battlefield Dominance",
      "layout": "B",
      "page": 10,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 28.7,
          "y": 37.2
        },
        "Attacker Home": {
          "x": 31.2,
          "y": 6.8
        },
        "Central 1": {
          "x": 30,
          "y": 24.2
        },
        "Expansion 1": {
          "x": 9.4,
          "y": 19.2
        },
        "Expansion 2": {
          "x": 50.4,
          "y": 24.9
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 35.6,
              "y": 3.8
            },
            {
              "x": 24,
              "y": 3.8
            },
            {
              "x": 24,
              "y": 10.8
            },
            {
              "x": 35.6,
              "y": 10.8
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 55,
              "y": 6
            },
            {
              "x": 53.3,
              "y": 4.9
            },
            {
              "x": 49.9,
              "y": 9.9
            },
            {
              "x": 51.6,
              "y": 11.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 48.4,
              "y": 12.1
            },
            {
              "x": 48.9,
              "y": 12.3
            },
            {
              "x": 50,
              "y": 9.9
            },
            {
              "x": 40.7,
              "y": 6
            },
            {
              "x": 39.7,
              "y": 8.3
            },
            {
              "x": 46.5,
              "y": 11.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 6.6,
              "y": 5
            },
            {
              "x": 9.6,
              "y": 10.2
            },
            {
              "x": 13.1,
              "y": 8.2
            },
            {
              "x": 10,
              "y": 3
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 13.1,
              "y": 8.2
            },
            {
              "x": 14.2,
              "y": 9.9
            },
            {
              "x": 19.2,
              "y": 6.5
            },
            {
              "x": 18.1,
              "y": 4.8
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 54,
              "y": 31
            },
            {
              "x": 54,
              "y": 19.4
            },
            {
              "x": 46.9,
              "y": 19.4
            },
            {
              "x": 46.9,
              "y": 31
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 25.9,
              "y": 18.9
            },
            {
              "x": 25.9,
              "y": 24.9
            },
            {
              "x": 29.9,
              "y": 24.9
            },
            {
              "x": 29.9,
              "y": 18.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 24.4,
              "y": 40
            },
            {
              "x": 36,
              "y": 40
            },
            {
              "x": 36,
              "y": 33
            },
            {
              "x": 24.4,
              "y": 33
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 5.1,
              "y": 37.9
            },
            {
              "x": 6.8,
              "y": 39
            },
            {
              "x": 10.2,
              "y": 33.9
            },
            {
              "x": 8.5,
              "y": 32.8
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 11.7,
              "y": 31.8
            },
            {
              "x": 11.2,
              "y": 31.6
            },
            {
              "x": 10.2,
              "y": 34
            },
            {
              "x": 19.5,
              "y": 37.9
            },
            {
              "x": 20.5,
              "y": 35.5
            },
            {
              "x": 13.6,
              "y": 32.6
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 5.9,
              "y": 13.1
            },
            {
              "x": 5.9,
              "y": 24.7
            },
            {
              "x": 12.9,
              "y": 24.7
            },
            {
              "x": 12.9,
              "y": 13.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 34,
              "y": 25
            },
            {
              "x": 34,
              "y": 18.9
            },
            {
              "x": 30,
              "y": 18.9
            },
            {
              "x": 30,
              "y": 25
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 53.4,
              "y": 39
            },
            {
              "x": 50.3,
              "y": 33.8
            },
            {
              "x": 46.9,
              "y": 35.8
            },
            {
              "x": 49.9,
              "y": 41
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 46.8,
              "y": 35.8
            },
            {
              "x": 45.7,
              "y": 34.1
            },
            {
              "x": 40.7,
              "y": 37.5
            },
            {
              "x": 41.8,
              "y": 39.2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 47.1,
              "y": 16.9
            },
            {
              "x": 34.3,
              "y": 14
            },
            {
              "x": 33,
              "y": 15.5
            },
            {
              "x": 41.8,
              "y": 23.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 13,
              "y": 27
            },
            {
              "x": 25.7,
              "y": 30.1
            },
            {
              "x": 27.1,
              "y": 28.5
            },
            {
              "x": 18.3,
              "y": 20.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Battlefield Dominance ↔ Battlefield Dominance",
      "missionA": "Battlefield Dominance",
      "missionB": "Battlefield Dominance",
      "layout": "C",
      "page": 11,
      "verified": true,
      "objectivePositions": {
        "Attacker Home": {
          "x": 50.4,
          "y": 10.1
        },
        "Defender Home": {
          "x": 8.9,
          "y": 33.7
        },
        "Central 1": {
          "x": 30,
          "y": 22
        },
        "Expansion 1": {
          "x": 10.7,
          "y": 10.2
        },
        "Expansion 2": {
          "x": 49.2,
          "y": 35
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 56.3,
              "y": 12.1
            },
            {
              "x": 48,
              "y": 3.9
            },
            {
              "x": 43,
              "y": 8.8
            },
            {
              "x": 51.3,
              "y": 17
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 35,
              "y": 4.9
            },
            {
              "x": 37,
              "y": 4.9
            },
            {
              "x": 37,
              "y": 11
            },
            {
              "x": 35,
              "y": 11
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 36.9,
              "y": 15
            },
            {
              "x": 42.9,
              "y": 15
            },
            {
              "x": 42.9,
              "y": 11
            },
            {
              "x": 36.9,
              "y": 11
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 27.8
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 27,
              "y": 16.2
            },
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 35.1,
              "y": 27.8
            },
            {
              "x": 35.1,
              "y": 16.2
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 2.8,
              "y": 32
            },
            {
              "x": 11,
              "y": 40.2
            },
            {
              "x": 16,
              "y": 35.2
            },
            {
              "x": 7.8,
              "y": 27
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 23,
              "y": 29.1
            },
            {
              "x": 16.9,
              "y": 29.1
            },
            {
              "x": 16.9,
              "y": 33.1
            },
            {
              "x": 23,
              "y": 33.1
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 5.8,
              "y": 13
            },
            {
              "x": 17.3,
              "y": 14.7
            },
            {
              "x": 18.4,
              "y": 7.7
            },
            {
              "x": 6.9,
              "y": 6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 25,
              "y": 39.1
            },
            {
              "x": 23,
              "y": 39.1
            },
            {
              "x": 23,
              "y": 33.1
            },
            {
              "x": 25,
              "y": 33.1
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 37.9,
              "y": 33
            },
            {
              "x": 36,
              "y": 33
            },
            {
              "x": 36,
              "y": 39.1
            },
            {
              "x": 37.9,
              "y": 39.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 35.9,
              "y": 31
            },
            {
              "x": 29.8,
              "y": 31
            },
            {
              "x": 29.8,
              "y": 35
            },
            {
              "x": 35.9,
              "y": 35
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 21.9,
              "y": 10.9
            },
            {
              "x": 23.9,
              "y": 10.9
            },
            {
              "x": 23.9,
              "y": 4.9
            },
            {
              "x": 21.9,
              "y": 4.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 23.9,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 9
            },
            {
              "x": 23.9,
              "y": 9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 54.2,
              "y": 31
            },
            {
              "x": 42.7,
              "y": 29.3
            },
            {
              "x": 41.6,
              "y": 36.3
            },
            {
              "x": 53.1,
              "y": 38
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 12.2,
              "y": 17.4
            },
            {
              "x": 11.9,
              "y": 16.9
            },
            {
              "x": 9.8,
              "y": 18.5
            },
            {
              "x": 15.9,
              "y": 26.5
            },
            {
              "x": 18,
              "y": 24.9
            },
            {
              "x": 13.5,
              "y": 19
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 47.7,
              "y": 26.6
            },
            {
              "x": 48.1,
              "y": 27
            },
            {
              "x": 50.1,
              "y": 25.4
            },
            {
              "x": 44,
              "y": 17.5
            },
            {
              "x": 41.9,
              "y": 19
            },
            {
              "x": 46.5,
              "y": 24.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Immovable Object ↔ Unstoppable Force",
      "missionA": "Immovable Object",
      "missionB": "Unstoppable Force",
      "layout": "A",
      "page": 12,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.7,
          "y": 35.8
        },
        "Attacker Home": {
          "x": 49.1,
          "y": 8.4
        },
        "Central 1": {
          "x": 27.5,
          "y": 18.1
        },
        "Central 2": {
          "x": 32.6,
          "y": 25.6
        },
        "Expansion 1": {
          "x": 10.4,
          "y": 13.4
        },
        "Expansion 2": {
          "x": 49.2,
          "y": 30.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 17.4,
              "y": 32
            },
            {
              "x": 5.8,
              "y": 32
            },
            {
              "x": 5.8,
              "y": 39
            },
            {
              "x": 17.4,
              "y": 39
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.5,
              "y": 34.1
            },
            {
              "x": 55.1,
              "y": 34.1
            },
            {
              "x": 55.1,
              "y": 27
            },
            {
              "x": 43.5,
              "y": 27
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 34.5,
              "y": 40.5
            },
            {
              "x": 34.9,
              "y": 40.8
            },
            {
              "x": 36.8,
              "y": 39
            },
            {
              "x": 29.7,
              "y": 31.9
            },
            {
              "x": 27.8,
              "y": 33.7
            },
            {
              "x": 33.1,
              "y": 39
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 25.1,
              "y": 30.8
            },
            {
              "x": 20.6,
              "y": 34.8
            },
            {
              "x": 23.3,
              "y": 37.8
            },
            {
              "x": 27.8,
              "y": 33.8
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 41.5,
              "y": 40.1
            },
            {
              "x": 43.5,
              "y": 40.1
            },
            {
              "x": 43.5,
              "y": 34.1
            },
            {
              "x": 41.5,
              "y": 34.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 20.9,
              "y": 23
            },
            {
              "x": 33.3,
              "y": 18.6
            },
            {
              "x": 33.6,
              "y": 16.6
            },
            {
              "x": 22.1,
              "y": 14.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 38.9,
              "y": 20.9
            },
            {
              "x": 26.6,
              "y": 25.4
            },
            {
              "x": 26.3,
              "y": 27.5
            },
            {
              "x": 37.9,
              "y": 29
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 42.4,
              "y": 12.1
            },
            {
              "x": 54.1,
              "y": 12.1
            },
            {
              "x": 54.1,
              "y": 5
            },
            {
              "x": 42.4,
              "y": 5
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 16.5,
              "y": 9.9
            },
            {
              "x": 4.9,
              "y": 9.9
            },
            {
              "x": 4.9,
              "y": 16.9
            },
            {
              "x": 16.5,
              "y": 16.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 25.1,
              "y": 3.4
            },
            {
              "x": 24.7,
              "y": 3
            },
            {
              "x": 22.9,
              "y": 4.8
            },
            {
              "x": 30,
              "y": 11.9
            },
            {
              "x": 31.8,
              "y": 10.1
            },
            {
              "x": 26.6,
              "y": 4.8
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 34.5,
              "y": 13
            },
            {
              "x": 39,
              "y": 9
            },
            {
              "x": 36.4,
              "y": 6
            },
            {
              "x": 31.8,
              "y": 10.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 18.5,
              "y": 3.8
            },
            {
              "x": 16.5,
              "y": 3.8
            },
            {
              "x": 16.5,
              "y": 9.9
            },
            {
              "x": 18.5,
              "y": 9.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 13,
              "y": 20.7
            },
            {
              "x": 14.3,
              "y": 22.2
            },
            {
              "x": 9.9,
              "y": 26.3
            },
            {
              "x": 8.6,
              "y": 24.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 15.7,
              "y": 21
            },
            {
              "x": 19.9,
              "y": 25.4
            },
            {
              "x": 17,
              "y": 28.1
            },
            {
              "x": 12.8,
              "y": 23.7
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 47.1,
              "y": 23.3
            },
            {
              "x": 45.7,
              "y": 21.8
            },
            {
              "x": 50.1,
              "y": 17.7
            },
            {
              "x": 51.5,
              "y": 19.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 44.3,
              "y": 23
            },
            {
              "x": 40.1,
              "y": 18.6
            },
            {
              "x": 43,
              "y": 15.9
            },
            {
              "x": 47.2,
              "y": 20.3
            }
          ]
        }
      }
    },
    {
      "missionKey": "Immovable Object ↔ Unstoppable Force",
      "missionA": "Immovable Object",
      "missionB": "Unstoppable Force",
      "layout": "B",
      "page": 13,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.7,
          "y": 35.9
        },
        "Attacker Home": {
          "x": 50.4,
          "y": 8.3
        },
        "Central 1": {
          "x": 26.8,
          "y": 19.5
        },
        "Central 2": {
          "x": 33,
          "y": 24.9
        },
        "Expansion 1": {
          "x": 10.1,
          "y": 9.6
        },
        "Expansion 2": {
          "x": 50.1,
          "y": 34.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 14,
              "y": 15.6
            },
            {
              "x": 14,
              "y": 4
            },
            {
              "x": 6.9,
              "y": 4
            },
            {
              "x": 6.9,
              "y": 15.6
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.4,
              "y": 12.1
            },
            {
              "x": 55,
              "y": 12.1
            },
            {
              "x": 55,
              "y": 5
            },
            {
              "x": 43.4,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 35.8,
              "y": 31.7
            },
            {
              "x": 35.5,
              "y": 31.3
            },
            {
              "x": 33.5,
              "y": 33
            },
            {
              "x": 39.9,
              "y": 40.7
            },
            {
              "x": 41.9,
              "y": 39
            },
            {
              "x": 37.2,
              "y": 33.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 29.9,
              "y": 10
            },
            {
              "x": 29.9,
              "y": 3.9
            },
            {
              "x": 33.9,
              "y": 3.9
            },
            {
              "x": 33.9,
              "y": 10
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 37.1,
              "y": 18.2
            },
            {
              "x": 27.3,
              "y": 27
            },
            {
              "x": 27.8,
              "y": 29
            },
            {
              "x": 39.1,
              "y": 26.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 33.9,
              "y": 12
            },
            {
              "x": 33.9,
              "y": 10
            },
            {
              "x": 40,
              "y": 10
            },
            {
              "x": 40,
              "y": 12
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 22.9,
              "y": 25.8
            },
            {
              "x": 32.6,
              "y": 16.9
            },
            {
              "x": 32,
              "y": 15
            },
            {
              "x": 20.8,
              "y": 18
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 46,
              "y": 28.5
            },
            {
              "x": 46,
              "y": 40.1
            },
            {
              "x": 53,
              "y": 40.1
            },
            {
              "x": 53,
              "y": 28.5
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 16.5,
              "y": 31.9
            },
            {
              "x": 4.8,
              "y": 31.9
            },
            {
              "x": 4.8,
              "y": 39
            },
            {
              "x": 16.5,
              "y": 39
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 14.9,
              "y": 20
            },
            {
              "x": 14.9,
              "y": 22
            },
            {
              "x": 8.8,
              "y": 22
            },
            {
              "x": 8.8,
              "y": 20
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 18.9,
              "y": 28.1
            },
            {
              "x": 18.9,
              "y": 22
            },
            {
              "x": 14.9,
              "y": 22
            },
            {
              "x": 14.9,
              "y": 28.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 29.9,
              "y": 33.9
            },
            {
              "x": 29.9,
              "y": 40
            },
            {
              "x": 25.9,
              "y": 40
            },
            {
              "x": 25.9,
              "y": 33.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 25.9,
              "y": 31.9
            },
            {
              "x": 25.9,
              "y": 33.9
            },
            {
              "x": 19.9,
              "y": 33.9
            },
            {
              "x": 19.9,
              "y": 31.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 24,
              "y": 12.1
            },
            {
              "x": 24.4,
              "y": 12.6
            },
            {
              "x": 26.4,
              "y": 10.9
            },
            {
              "x": 19.9,
              "y": 3.2
            },
            {
              "x": 17.9,
              "y": 4.9
            },
            {
              "x": 22.7,
              "y": 10.6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 45,
              "y": 24.1
            },
            {
              "x": 45,
              "y": 22.1
            },
            {
              "x": 51.1,
              "y": 22.1
            },
            {
              "x": 51.1,
              "y": 24.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 41,
              "y": 16
            },
            {
              "x": 41,
              "y": 22
            },
            {
              "x": 45,
              "y": 22
            },
            {
              "x": 45,
              "y": 16
            }
          ]
        }
      }
    },
    {
      "missionKey": "Immovable Object ↔ Unstoppable Force",
      "missionA": "Immovable Object",
      "missionB": "Unstoppable Force",
      "layout": "C",
      "page": 14,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.5,
          "y": 32.9
        },
        "Attacker Home": {
          "x": 49.9,
          "y": 10.7
        },
        "Central 1": {
          "x": 34.2,
          "y": 21
        },
        "Central 2": {
          "x": 25.8,
          "y": 23.1
        },
        "Expansion 1": {
          "x": 22.2,
          "y": 7.3
        },
        "Expansion 2": {
          "x": 37.9,
          "y": 36.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 42,
              "y": 44
            },
            {
              "x": 42,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 17.9,
              "y": 0
            },
            {
              "x": 17.9,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 14,
              "y": 39
            },
            {
              "x": 14,
              "y": 27.4
            },
            {
              "x": 6.9,
              "y": 27.4
            },
            {
              "x": 6.9,
              "y": 39
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 41.1,
              "y": 42
            },
            {
              "x": 41.1,
              "y": 30.4
            },
            {
              "x": 34.1,
              "y": 30.4
            },
            {
              "x": 34.1,
              "y": 42
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 12.1,
              "y": 10.9
            },
            {
              "x": 13.6,
              "y": 9.5
            },
            {
              "x": 9.6,
              "y": 5
            },
            {
              "x": 8.1,
              "y": 6.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 18.5,
              "y": 17.5
            },
            {
              "x": 18.5,
              "y": 16.9
            },
            {
              "x": 15.9,
              "y": 17
            },
            {
              "x": 16,
              "y": 27
            },
            {
              "x": 18.6,
              "y": 27
            },
            {
              "x": 18.5,
              "y": 19.5
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 10.4,
              "y": 17.9
            },
            {
              "x": 14.8,
              "y": 13.8
            },
            {
              "x": 12.1,
              "y": 10.9
            },
            {
              "x": 7.7,
              "y": 15
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 24.9,
              "y": 31.9
            },
            {
              "x": 18.8,
              "y": 31.9
            },
            {
              "x": 18.8,
              "y": 35.9
            },
            {
              "x": 24.9,
              "y": 35.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 32.1,
              "y": 27.7
            },
            {
              "x": 24.2,
              "y": 17.2
            },
            {
              "x": 22.2,
              "y": 17.5
            },
            {
              "x": 24,
              "y": 29
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 27,
              "y": 33.9
            },
            {
              "x": 25,
              "y": 33.9
            },
            {
              "x": 25,
              "y": 40
            },
            {
              "x": 27,
              "y": 40
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 41.5,
              "y": 26.5
            },
            {
              "x": 41.5,
              "y": 27
            },
            {
              "x": 44.1,
              "y": 27
            },
            {
              "x": 44,
              "y": 17
            },
            {
              "x": 41.4,
              "y": 17
            },
            {
              "x": 41.4,
              "y": 24.4
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 47.9,
              "y": 33.1
            },
            {
              "x": 46.4,
              "y": 34.5
            },
            {
              "x": 50.4,
              "y": 39
            },
            {
              "x": 51.9,
              "y": 37.7
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 49.6,
              "y": 26.1
            },
            {
              "x": 45.1,
              "y": 30.2
            },
            {
              "x": 47.9,
              "y": 33.1
            },
            {
              "x": 52.3,
              "y": 29
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 28,
              "y": 16.2
            },
            {
              "x": 35.8,
              "y": 26.7
            },
            {
              "x": 37.8,
              "y": 26.4
            },
            {
              "x": 36,
              "y": 15
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 46.1,
              "y": 5
            },
            {
              "x": 46.1,
              "y": 16.6
            },
            {
              "x": 53.2,
              "y": 16.6
            },
            {
              "x": 53.2,
              "y": 5
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 18.9,
              "y": 2
            },
            {
              "x": 18.9,
              "y": 13.6
            },
            {
              "x": 25.9,
              "y": 13.6
            },
            {
              "x": 25.9,
              "y": 2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 35.1,
              "y": 11.8
            },
            {
              "x": 41.2,
              "y": 11.8
            },
            {
              "x": 41.2,
              "y": 7.9
            },
            {
              "x": 35.1,
              "y": 7.9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 33,
              "y": 10.1
            },
            {
              "x": 35,
              "y": 10.1
            },
            {
              "x": 35,
              "y": 4
            },
            {
              "x": 33,
              "y": 4
            }
          ]
        }
      }
    },
    {
      "missionKey": "Determined Acquisition ↔ Death Trap",
      "missionA": "Determined Acquisition",
      "missionB": "Death Trap",
      "layout": "A",
      "page": 15,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.6,
          "y": 37
        },
        "Attacker Home": {
          "x": 50.3,
          "y": 7
        },
        "Central 1": {
          "x": 31.8,
          "y": 21.4
        },
        "Expansion 1": {
          "x": 11,
          "y": 13.6
        },
        "Expansion 2": {
          "x": 48.8,
          "y": 30.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 4.9,
              "y": 17
            },
            {
              "x": 16.5,
              "y": 17
            },
            {
              "x": 16.5,
              "y": 10
            },
            {
              "x": 4.9,
              "y": 10
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.5,
              "y": 11
            },
            {
              "x": 55.1,
              "y": 11
            },
            {
              "x": 55.1,
              "y": 4
            },
            {
              "x": 43.5,
              "y": 4
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 12.5,
              "y": 8.9
            },
            {
              "x": 18.1,
              "y": 6.6
            },
            {
              "x": 16.5,
              "y": 2.9
            },
            {
              "x": 11,
              "y": 5.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 55.1,
              "y": 26.9
            },
            {
              "x": 43.5,
              "y": 26.9
            },
            {
              "x": 43.5,
              "y": 34
            },
            {
              "x": 55.1,
              "y": 34
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 16.5,
              "y": 33
            },
            {
              "x": 4.9,
              "y": 33
            },
            {
              "x": 4.9,
              "y": 40
            },
            {
              "x": 16.5,
              "y": 40
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 10.6,
              "y": 22.2
            },
            {
              "x": 11.8,
              "y": 23.8
            },
            {
              "x": 7.1,
              "y": 27.6
            },
            {
              "x": 5.9,
              "y": 26
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 28.7,
              "y": 30.7
            },
            {
              "x": 28.3,
              "y": 30.4
            },
            {
              "x": 26.6,
              "y": 32.3
            },
            {
              "x": 34.1,
              "y": 39
            },
            {
              "x": 35.8,
              "y": 37
            },
            {
              "x": 30.3,
              "y": 32.1
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 14.3,
              "y": 21.9
            },
            {
              "x": 18.1,
              "y": 26.6
            },
            {
              "x": 15,
              "y": 29.1
            },
            {
              "x": 11.2,
              "y": 24.4
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 24.2,
              "y": 27.1
            },
            {
              "x": 35.8,
              "y": 27.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 21.3,
              "y": 35.8
            },
            {
              "x": 22.8,
              "y": 37.1
            },
            {
              "x": 26.6,
              "y": 32.3
            },
            {
              "x": 25.1,
              "y": 31.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 31.1,
              "y": 13.2
            },
            {
              "x": 31.5,
              "y": 13.5
            },
            {
              "x": 33.3,
              "y": 11.6
            },
            {
              "x": 25.7,
              "y": 5
            },
            {
              "x": 24,
              "y": 6.9
            },
            {
              "x": 29.6,
              "y": 11.8
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 38.6,
              "y": 8.1
            },
            {
              "x": 37,
              "y": 6.9
            },
            {
              "x": 33.2,
              "y": 11.6
            },
            {
              "x": 34.8,
              "y": 12.8
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 47.5,
              "y": 34.9
            },
            {
              "x": 41.9,
              "y": 37.3
            },
            {
              "x": 43.4,
              "y": 40.9
            },
            {
              "x": 49,
              "y": 38.6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 49.5,
              "y": 21.8
            },
            {
              "x": 48.2,
              "y": 20.2
            },
            {
              "x": 52.9,
              "y": 16.4
            },
            {
              "x": 54.2,
              "y": 17.9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 45.7,
              "y": 22.1
            },
            {
              "x": 41.9,
              "y": 17.4
            },
            {
              "x": 45,
              "y": 14.9
            },
            {
              "x": 48.8,
              "y": 19.6
            }
          ]
        }
      }
    },
    {
      "missionKey": "Determined Acquisition ↔ Death Trap",
      "missionA": "Determined Acquisition",
      "missionB": "Death Trap",
      "layout": "B",
      "page": 16,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.9,
          "y": 35.3
        },
        "Attacker Home": {
          "x": 51.3,
          "y": 8.6
        },
        "Central 1": {
          "x": 31.1,
          "y": 23.8
        },
        "Expansion 1": {
          "x": 13.5,
          "y": 10.7
        },
        "Expansion 2": {
          "x": 46.3,
          "y": 33.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0.1,
              "y": 0
            },
            {
              "x": 0.1,
              "y": 43.9
            },
            {
              "x": 30.1,
              "y": 43.9
            },
            {
              "x": 0.1,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 20.4,
              "y": 30.5
            },
            {
              "x": 20.1,
              "y": 30
            },
            {
              "x": 17.9,
              "y": 31.4
            },
            {
              "x": 23.1,
              "y": 40
            },
            {
              "x": 25.3,
              "y": 38.6
            },
            {
              "x": 21.5,
              "y": 32.3
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 39.7,
              "y": 13.6
            },
            {
              "x": 40,
              "y": 14
            },
            {
              "x": 42.2,
              "y": 12.7
            },
            {
              "x": 37,
              "y": 4.1
            },
            {
              "x": 34.8,
              "y": 5.4
            },
            {
              "x": 38.6,
              "y": 11.8
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 6.9,
              "y": 7.9
            },
            {
              "x": 13.6,
              "y": 17.4
            },
            {
              "x": 19.4,
              "y": 13.4
            },
            {
              "x": 12.7,
              "y": 3.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 12.1,
              "y": 21.9
            },
            {
              "x": 13.7,
              "y": 20.8
            },
            {
              "x": 10.2,
              "y": 15.8
            },
            {
              "x": 8.6,
              "y": 17
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 10.5,
              "y": 23.2
            },
            {
              "x": 14,
              "y": 28.1
            },
            {
              "x": 17.2,
              "y": 25.8
            },
            {
              "x": 13.7,
              "y": 20.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 15.5,
              "y": 31.9
            },
            {
              "x": 3.9,
              "y": 31.9
            },
            {
              "x": 3.9,
              "y": 39
            },
            {
              "x": 15.5,
              "y": 39
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 35.7,
              "y": 19
            },
            {
              "x": 24.1,
              "y": 25.1
            },
            {
              "x": 24.1,
              "y": 27.1
            },
            {
              "x": 35.7,
              "y": 27.1
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 24.1,
              "y": 25.1
            },
            {
              "x": 35.7,
              "y": 19
            },
            {
              "x": 35.7,
              "y": 17
            },
            {
              "x": 24.1,
              "y": 17
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 36,
              "y": 34
            },
            {
              "x": 34,
              "y": 34
            },
            {
              "x": 34,
              "y": 40
            },
            {
              "x": 36,
              "y": 40
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 33.9,
              "y": 31
            },
            {
              "x": 27.9,
              "y": 31
            },
            {
              "x": 27.9,
              "y": 35
            },
            {
              "x": 33.9,
              "y": 35
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 52.9,
              "y": 36
            },
            {
              "x": 46.3,
              "y": 26.5
            },
            {
              "x": 40.5,
              "y": 30.5
            },
            {
              "x": 47.2,
              "y": 40
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 44.4,
              "y": 12
            },
            {
              "x": 56.1,
              "y": 12
            },
            {
              "x": 56.1,
              "y": 5
            },
            {
              "x": 44.4,
              "y": 5
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 47.9,
              "y": 22.1
            },
            {
              "x": 46.2,
              "y": 23.3
            },
            {
              "x": 49.7,
              "y": 28.2
            },
            {
              "x": 51.3,
              "y": 27.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 49.5,
              "y": 20.9
            },
            {
              "x": 46,
              "y": 15.9
            },
            {
              "x": 42.7,
              "y": 18.3
            },
            {
              "x": 46.2,
              "y": 23.2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 23.9,
              "y": 10.1
            },
            {
              "x": 25.9,
              "y": 10.1
            },
            {
              "x": 25.9,
              "y": 4
            },
            {
              "x": 23.9,
              "y": 4
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 25.9,
              "y": 12.9
            },
            {
              "x": 32,
              "y": 12.9
            },
            {
              "x": 32,
              "y": 8.9
            },
            {
              "x": 25.9,
              "y": 8.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Determined Acquisition ↔ Death Trap",
      "missionA": "Determined Acquisition",
      "missionB": "Death Trap",
      "layout": "C",
      "page": 17,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 12.6,
          "y": 22.3
        },
        "Attacker Home": {
          "x": 47.3,
          "y": 21.8
        },
        "Central 1": {
          "x": 29.9,
          "y": 19.9
        },
        "Expansion 1": {
          "x": 22.2,
          "y": 7.5
        },
        "Expansion 2": {
          "x": 37.5,
          "y": 35.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 42,
              "y": 44
            },
            {
              "x": 42,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 17.9,
              "y": 0
            },
            {
              "x": 17.9,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 9.9,
              "y": 16.4
            },
            {
              "x": 9.9,
              "y": 28
            },
            {
              "x": 16.9,
              "y": 28
            },
            {
              "x": 16.9,
              "y": 16.4
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 25.9,
              "y": 13.6
            },
            {
              "x": 25.9,
              "y": 2
            },
            {
              "x": 18.9,
              "y": 2
            },
            {
              "x": 18.9,
              "y": 13.6
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 10.9,
              "y": 34.1
            },
            {
              "x": 10.9,
              "y": 32.1
            },
            {
              "x": 4.8,
              "y": 32.1
            },
            {
              "x": 4.8,
              "y": 34.1
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 13.6,
              "y": 4.5
            },
            {
              "x": 13.6,
              "y": 4
            },
            {
              "x": 11,
              "y": 4
            },
            {
              "x": 11,
              "y": 14
            },
            {
              "x": 13.6,
              "y": 14
            },
            {
              "x": 13.6,
              "y": 6.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 24.9,
              "y": 30.9
            },
            {
              "x": 24.9,
              "y": 32.9
            },
            {
              "x": 18.9,
              "y": 32.9
            },
            {
              "x": 18.9,
              "y": 30.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 28,
              "y": 33
            },
            {
              "x": 28,
              "y": 39.1
            },
            {
              "x": 24,
              "y": 39.1
            },
            {
              "x": 24,
              "y": 33
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 14.9,
              "y": 40.1
            },
            {
              "x": 14.9,
              "y": 34.1
            },
            {
              "x": 10.9,
              "y": 34.1
            },
            {
              "x": 10.9,
              "y": 40.1
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 34.9,
              "y": 13
            },
            {
              "x": 34.9,
              "y": 11
            },
            {
              "x": 41,
              "y": 11
            },
            {
              "x": 41,
              "y": 13
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 32.1,
              "y": 11
            },
            {
              "x": 32.1,
              "y": 4.9
            },
            {
              "x": 36.1,
              "y": 4.9
            },
            {
              "x": 36.1,
              "y": 11
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 50.1,
              "y": 27.6
            },
            {
              "x": 50.1,
              "y": 16
            },
            {
              "x": 43.1,
              "y": 16
            },
            {
              "x": 43.1,
              "y": 27.6
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 46.4,
              "y": 39.5
            },
            {
              "x": 46.4,
              "y": 40
            },
            {
              "x": 49,
              "y": 40
            },
            {
              "x": 49,
              "y": 30
            },
            {
              "x": 46.4,
              "y": 30
            },
            {
              "x": 46.4,
              "y": 37.4
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 33.9,
              "y": 30.4
            },
            {
              "x": 33.9,
              "y": 42
            },
            {
              "x": 40.9,
              "y": 42
            },
            {
              "x": 40.9,
              "y": 30.4
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 35.8,
              "y": 16.9
            },
            {
              "x": 24.2,
              "y": 16.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 35.9,
              "y": 19
            },
            {
              "x": 24.2,
              "y": 25
            },
            {
              "x": 24.2,
              "y": 27.1
            },
            {
              "x": 35.9,
              "y": 27.1
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 49.1,
              "y": 10
            },
            {
              "x": 49.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 10
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 45,
              "y": 4
            },
            {
              "x": 45,
              "y": 10
            },
            {
              "x": 49,
              "y": 10
            },
            {
              "x": 49,
              "y": 4
            }
          ]
        }
      }
    },
    {
      "missionKey": "Purge and Secure ↔ Reconnaissance Sweep",
      "missionA": "Purge and Secure",
      "missionB": "Reconnaissance Sweep",
      "layout": "A",
      "page": 18,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.5,
          "y": 31.5
        },
        "Attacker Home": {
          "x": 51.1,
          "y": 12.3
        },
        "Central 1": {
          "x": 30.2,
          "y": 21.9
        },
        "Expansion 1": {
          "x": 15.8,
          "y": 9.2
        },
        "Expansion 2": {
          "x": 44.2,
          "y": 34.7
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 34,
              "y": 33
            },
            {
              "x": 32,
              "y": 33
            },
            {
              "x": 32,
              "y": 39.1
            },
            {
              "x": 34,
              "y": 39.1
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 21.6,
              "y": 30.5
            },
            {
              "x": 21.6,
              "y": 30
            },
            {
              "x": 19,
              "y": 30
            },
            {
              "x": 19,
              "y": 40
            },
            {
              "x": 21.6,
              "y": 40
            },
            {
              "x": 21.6,
              "y": 32.6
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 12.8,
              "y": 21.8
            },
            {
              "x": 12.8,
              "y": 15.7
            },
            {
              "x": 8.8,
              "y": 15.7
            },
            {
              "x": 8.8,
              "y": 21.8
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19.1
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 32,
              "y": 32
            },
            {
              "x": 32,
              "y": 34
            },
            {
              "x": 25.9,
              "y": 34
            },
            {
              "x": 25.9,
              "y": 32
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 25.9,
              "y": 11
            },
            {
              "x": 27.9,
              "y": 11
            },
            {
              "x": 27.9,
              "y": 5
            },
            {
              "x": 25.9,
              "y": 5
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 28,
              "y": 11.9
            },
            {
              "x": 28,
              "y": 9.9
            },
            {
              "x": 34.1,
              "y": 9.9
            },
            {
              "x": 34.1,
              "y": 11.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 19,
              "y": 30
            },
            {
              "x": 19,
              "y": 23.9
            },
            {
              "x": 15,
              "y": 23.9
            },
            {
              "x": 15,
              "y": 30
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 4.8,
              "y": 25.4
            },
            {
              "x": 4.8,
              "y": 37
            },
            {
              "x": 11.9,
              "y": 37
            },
            {
              "x": 11.9,
              "y": 25.4
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 12.9,
              "y": 4
            },
            {
              "x": 12.9,
              "y": 15.6
            },
            {
              "x": 19.9,
              "y": 15.6
            },
            {
              "x": 19.9,
              "y": 4
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 35.8,
              "y": 18.8
            },
            {
              "x": 24.2,
              "y": 24.9
            },
            {
              "x": 24.2,
              "y": 26.9
            },
            {
              "x": 35.8,
              "y": 26.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 38.6,
              "y": 13.5
            },
            {
              "x": 38.6,
              "y": 14
            },
            {
              "x": 41.2,
              "y": 14
            },
            {
              "x": 41.2,
              "y": 4
            },
            {
              "x": 38.6,
              "y": 4
            },
            {
              "x": 38.6,
              "y": 11.4
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 41.1,
              "y": 14
            },
            {
              "x": 41.1,
              "y": 20.1
            },
            {
              "x": 45.1,
              "y": 20.1
            },
            {
              "x": 45.1,
              "y": 14
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 55.1,
              "y": 18.5
            },
            {
              "x": 55.1,
              "y": 6.9
            },
            {
              "x": 48,
              "y": 6.9
            },
            {
              "x": 48,
              "y": 18.5
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 47.1,
              "y": 22.2
            },
            {
              "x": 47.1,
              "y": 28.2
            },
            {
              "x": 51.1,
              "y": 28.2
            },
            {
              "x": 51.1,
              "y": 22.2
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 47.1,
              "y": 39.9
            },
            {
              "x": 47.1,
              "y": 28.3
            },
            {
              "x": 40,
              "y": 28.3
            },
            {
              "x": 40,
              "y": 39.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Purge and Secure ↔ Reconnaissance Sweep",
      "missionA": "Purge and Secure",
      "missionB": "Reconnaissance Sweep",
      "layout": "B",
      "page": 19,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 12.4,
          "y": 36.4
        },
        "Attacker Home": {
          "x": 47.6,
          "y": 8.1
        },
        "Central 1": {
          "x": 31.4,
          "y": 21.2
        },
        "Expansion 1": {
          "x": 10.7,
          "y": 16.6
        },
        "Expansion 2": {
          "x": 49,
          "y": 27.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 4.8,
              "y": 19.9
            },
            {
              "x": 16.5,
              "y": 19.9
            },
            {
              "x": 16.5,
              "y": 12.9
            },
            {
              "x": 4.8,
              "y": 12.9
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 6.9,
              "y": 39.5
            },
            {
              "x": 18.6,
              "y": 39.5
            },
            {
              "x": 18.6,
              "y": 32.5
            },
            {
              "x": 6.9,
              "y": 32.5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 31.9,
              "y": 14
            },
            {
              "x": 36.6,
              "y": 10.1
            },
            {
              "x": 34,
              "y": 7
            },
            {
              "x": 29.3,
              "y": 10.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 35.8,
              "y": 18.9
            },
            {
              "x": 24.1,
              "y": 25
            },
            {
              "x": 24.1,
              "y": 27
            },
            {
              "x": 35.8,
              "y": 27
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 27.8,
              "y": 12.2
            },
            {
              "x": 29.3,
              "y": 10.9
            },
            {
              "x": 25.4,
              "y": 6.3
            },
            {
              "x": 23.9,
              "y": 7.6
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 43.5,
              "y": 24
            },
            {
              "x": 55.1,
              "y": 24
            },
            {
              "x": 55.1,
              "y": 31.1
            },
            {
              "x": 43.5,
              "y": 31.1
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 53,
              "y": 4.5
            },
            {
              "x": 41.4,
              "y": 4.5
            },
            {
              "x": 41.4,
              "y": 11.6
            },
            {
              "x": 53,
              "y": 11.6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 10.8,
              "y": 10.3
            },
            {
              "x": 12.2,
              "y": 8.9
            },
            {
              "x": 7.9,
              "y": 4.6
            },
            {
              "x": 6.5,
              "y": 6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 16.4,
              "y": 29.8
            },
            {
              "x": 16.9,
              "y": 30
            },
            {
              "x": 18.1,
              "y": 27.7
            },
            {
              "x": 9,
              "y": 23.3
            },
            {
              "x": 7.9,
              "y": 25.6
            },
            {
              "x": 14.6,
              "y": 28.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 15,
              "y": 11.7
            },
            {
              "x": 19.4,
              "y": 7.5
            },
            {
              "x": 16.6,
              "y": 4.6
            },
            {
              "x": 12.3,
              "y": 8.8
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 24.1,
              "y": 25
            },
            {
              "x": 35.7,
              "y": 19
            },
            {
              "x": 35.7,
              "y": 16.9
            },
            {
              "x": 24.1,
              "y": 16.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 43.5,
              "y": 14.3
            },
            {
              "x": 43,
              "y": 14.1
            },
            {
              "x": 41.8,
              "y": 16.4
            },
            {
              "x": 50.9,
              "y": 20.8
            },
            {
              "x": 52,
              "y": 18.5
            },
            {
              "x": 45.3,
              "y": 15.2
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 28.1,
              "y": 30
            },
            {
              "x": 23.4,
              "y": 33.8
            },
            {
              "x": 26,
              "y": 36.9
            },
            {
              "x": 30.6,
              "y": 33
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 32.2,
              "y": 31.7
            },
            {
              "x": 30.7,
              "y": 33
            },
            {
              "x": 34.6,
              "y": 37.6
            },
            {
              "x": 36.1,
              "y": 36.4
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 49.5,
              "y": 34.3
            },
            {
              "x": 48.1,
              "y": 35.7
            },
            {
              "x": 52.4,
              "y": 40
            },
            {
              "x": 53.8,
              "y": 38.6
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 45.3,
              "y": 32.9
            },
            {
              "x": 41,
              "y": 37.1
            },
            {
              "x": 43.7,
              "y": 39.9
            },
            {
              "x": 48.1,
              "y": 35.7
            }
          ]
        }
      }
    },
    {
      "missionKey": "Purge and Secure ↔ Reconnaissance Sweep",
      "missionA": "Purge and Secure",
      "missionB": "Reconnaissance Sweep",
      "layout": "C",
      "page": 20,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.7,
          "y": 35.4
        },
        "Attacker Home": {
          "x": 49.2,
          "y": 8.4
        },
        "Central 1": {
          "x": 30,
          "y": 22
        },
        "Expansion 1": {
          "x": 13.1,
          "y": 10.1
        },
        "Expansion 2": {
          "x": 46.8,
          "y": 33.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 17.5,
              "y": 32
            },
            {
              "x": 5.9,
              "y": 32
            },
            {
              "x": 5.9,
              "y": 39
            },
            {
              "x": 17.5,
              "y": 39
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 16.9,
              "y": 22
            },
            {
              "x": 14.9,
              "y": 22
            },
            {
              "x": 14.9,
              "y": 28
            },
            {
              "x": 16.9,
              "y": 28
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 26.7,
              "y": 37.2
            },
            {
              "x": 27,
              "y": 37.7
            },
            {
              "x": 24.8,
              "y": 39.2
            },
            {
              "x": 19.1,
              "y": 30.9
            },
            {
              "x": 21.2,
              "y": 29.4
            },
            {
              "x": 25.5,
              "y": 35.5
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 35.9,
              "y": 30.9
            },
            {
              "x": 29.9,
              "y": 30.9
            },
            {
              "x": 29.9,
              "y": 34.9
            },
            {
              "x": 35.9,
              "y": 34.9
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 35.8,
              "y": 18.9
            },
            {
              "x": 24.2,
              "y": 25
            },
            {
              "x": 24.2,
              "y": 27
            },
            {
              "x": 35.8,
              "y": 27
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 38,
              "y": 32.9
            },
            {
              "x": 36,
              "y": 32.9
            },
            {
              "x": 36,
              "y": 39
            },
            {
              "x": 38,
              "y": 39
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 33.1,
              "y": 6.9
            },
            {
              "x": 32.8,
              "y": 6.4
            },
            {
              "x": 35,
              "y": 4.9
            },
            {
              "x": 40.7,
              "y": 13.2
            },
            {
              "x": 38.6,
              "y": 14.7
            },
            {
              "x": 34.3,
              "y": 8.6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 10.4,
              "y": 15.6
            },
            {
              "x": 19.9,
              "y": 8.9
            },
            {
              "x": 15.8,
              "y": 3.2
            },
            {
              "x": 6.3,
              "y": 9.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 49.4,
              "y": 28.2
            },
            {
              "x": 39.9,
              "y": 34.9
            },
            {
              "x": 44,
              "y": 40.6
            },
            {
              "x": 53.5,
              "y": 33.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 44.9,
              "y": 25.9
            },
            {
              "x": 51,
              "y": 25.9
            },
            {
              "x": 51,
              "y": 22
            },
            {
              "x": 44.9,
              "y": 22
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 42.9,
              "y": 22.1
            },
            {
              "x": 44.9,
              "y": 22.1
            },
            {
              "x": 44.9,
              "y": 16.1
            },
            {
              "x": 42.9,
              "y": 16.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 42.5,
              "y": 12
            },
            {
              "x": 54.1,
              "y": 12
            },
            {
              "x": 54.1,
              "y": 5
            },
            {
              "x": 42.5,
              "y": 5
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 14.9,
              "y": 18.2
            },
            {
              "x": 8.9,
              "y": 18.2
            },
            {
              "x": 8.9,
              "y": 22.1
            },
            {
              "x": 14.9,
              "y": 22.1
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 24.1,
              "y": 13
            },
            {
              "x": 30.1,
              "y": 13
            },
            {
              "x": 30.1,
              "y": 9
            },
            {
              "x": 24.1,
              "y": 9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 22,
              "y": 11
            },
            {
              "x": 24,
              "y": 11
            },
            {
              "x": 24,
              "y": 4.9
            },
            {
              "x": 22,
              "y": 4.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Inescapable Dominion ↔ Secure Asset",
      "missionA": "Inescapable Dominion",
      "missionB": "Secure Asset",
      "layout": "A",
      "page": 21,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.1,
          "y": 32.9
        },
        "Attacker Home": {
          "x": 51.6,
          "y": 11
        },
        "Central 1": {
          "x": 35.6,
          "y": 20.3
        },
        "Central 2": {
          "x": 25.1,
          "y": 24.5
        },
        "Expansion 1": {
          "x": 14,
          "y": 8.4
        },
        "Expansion 2": {
          "x": 45.6,
          "y": 35
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 8.7,
              "y": 6.9
            },
            {
              "x": 15.2,
              "y": 16.6
            },
            {
              "x": 21.1,
              "y": 12.6
            },
            {
              "x": 14.6,
              "y": 3
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 11.9,
              "y": 39
            },
            {
              "x": 11.9,
              "y": 27.4
            },
            {
              "x": 4.8,
              "y": 27.4
            },
            {
              "x": 4.8,
              "y": 39
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 9.3,
              "y": 15.9
            },
            {
              "x": 8.9,
              "y": 15.5
            },
            {
              "x": 6.8,
              "y": 17
            },
            {
              "x": 12.8,
              "y": 25.1
            },
            {
              "x": 14.9,
              "y": 23.6
            },
            {
              "x": 10.5,
              "y": 17.6
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 18.9,
              "y": 17.9
            },
            {
              "x": 25,
              "y": 29.5
            },
            {
              "x": 27,
              "y": 29.5
            },
            {
              "x": 27,
              "y": 17.9
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 36,
              "y": 33.9
            },
            {
              "x": 34,
              "y": 33.9
            },
            {
              "x": 34,
              "y": 40
            },
            {
              "x": 36,
              "y": 40
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 50.9,
              "y": 36.9
            },
            {
              "x": 44.4,
              "y": 27.3
            },
            {
              "x": 38.6,
              "y": 31.3
            },
            {
              "x": 45.1,
              "y": 40.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 48,
              "y": 5
            },
            {
              "x": 48,
              "y": 16.6
            },
            {
              "x": 55.1,
              "y": 16.6
            },
            {
              "x": 55.1,
              "y": 5
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 17.8,
              "y": 27.8
            },
            {
              "x": 16.2,
              "y": 29
            },
            {
              "x": 19.8,
              "y": 33.8
            },
            {
              "x": 21.4,
              "y": 32.6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 18.3,
              "y": 35.2
            },
            {
              "x": 22,
              "y": 40
            },
            {
              "x": 25.2,
              "y": 37.5
            },
            {
              "x": 21.5,
              "y": 32.7
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 33.9,
              "y": 32.1
            },
            {
              "x": 27.8,
              "y": 32.1
            },
            {
              "x": 27.8,
              "y": 36
            },
            {
              "x": 33.9,
              "y": 36
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 41.1,
              "y": 26.1
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 33,
              "y": 14.5
            },
            {
              "x": 33,
              "y": 26.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 50.7,
              "y": 28.1
            },
            {
              "x": 51,
              "y": 28.6
            },
            {
              "x": 53.1,
              "y": 27.1
            },
            {
              "x": 47.2,
              "y": 18.9
            },
            {
              "x": 45.1,
              "y": 20.5
            },
            {
              "x": 49.5,
              "y": 26.5
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 42.2,
              "y": 16.1
            },
            {
              "x": 43.8,
              "y": 14.9
            },
            {
              "x": 40.1,
              "y": 10.1
            },
            {
              "x": 38.5,
              "y": 11.3
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 41.6,
              "y": 8.7
            },
            {
              "x": 37.9,
              "y": 3.9
            },
            {
              "x": 34.8,
              "y": 6.4
            },
            {
              "x": 38.5,
              "y": 11.2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 24,
              "y": 10.1
            },
            {
              "x": 26,
              "y": 10.1
            },
            {
              "x": 26,
              "y": 4
            },
            {
              "x": 24,
              "y": 4
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 26.1,
              "y": 12
            },
            {
              "x": 32.2,
              "y": 12
            },
            {
              "x": 32.2,
              "y": 8
            },
            {
              "x": 26.1,
              "y": 8
            }
          ]
        }
      }
    },
    {
      "missionKey": "Inescapable Dominion ↔ Secure Asset",
      "missionA": "Inescapable Dominion",
      "missionB": "Secure Asset",
      "layout": "B",
      "page": 22,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.5,
          "y": 31.3
        },
        "Attacker Home": {
          "x": 49.3,
          "y": 11.9
        },
        "Central 1": {
          "x": 25.3,
          "y": 24.2
        },
        "Central 2": {
          "x": 34.5,
          "y": 37.5
        },
        "Expansion 1": {
          "x": 25.3,
          "y": 6.6
        },
        "Expansion 2": {
          "x": 34.8,
          "y": 20
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 42,
              "y": 44
            },
            {
              "x": 42,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 17.9,
              "y": 0
            },
            {
              "x": 17.9,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 14,
              "y": 38
            },
            {
              "x": 14,
              "y": 26.4
            },
            {
              "x": 6.9,
              "y": 26.4
            },
            {
              "x": 6.9,
              "y": 38
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 18.8,
              "y": 9.9
            },
            {
              "x": 30.5,
              "y": 9.9
            },
            {
              "x": 30.5,
              "y": 2.9
            },
            {
              "x": 18.8,
              "y": 2.9
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 16.8,
              "y": 33.9
            },
            {
              "x": 16.8,
              "y": 35.9
            },
            {
              "x": 22.8,
              "y": 35.9
            },
            {
              "x": 22.8,
              "y": 33.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 14.9,
              "y": 12.6
            },
            {
              "x": 14.9,
              "y": 12
            },
            {
              "x": 12.3,
              "y": 12
            },
            {
              "x": 12.3,
              "y": 22.1
            },
            {
              "x": 14.9,
              "y": 22.1
            },
            {
              "x": 14.9,
              "y": 14.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 19.9,
              "y": 11.9
            },
            {
              "x": 19.9,
              "y": 17.9
            },
            {
              "x": 23.9,
              "y": 17.9
            },
            {
              "x": 23.9,
              "y": 11.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 12.3,
              "y": 12
            },
            {
              "x": 12.3,
              "y": 6
            },
            {
              "x": 8.3,
              "y": 6
            },
            {
              "x": 8.3,
              "y": 12
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 26.9,
              "y": 31.9
            },
            {
              "x": 27.7,
              "y": 18.9
            },
            {
              "x": 25.9,
              "y": 17.8
            },
            {
              "x": 19.9,
              "y": 27.7
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 25,
              "y": 33.9
            },
            {
              "x": 23,
              "y": 33.9
            },
            {
              "x": 23,
              "y": 40
            },
            {
              "x": 25,
              "y": 40
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 43.2,
              "y": 10
            },
            {
              "x": 43.2,
              "y": 8.1
            },
            {
              "x": 37.1,
              "y": 8.1
            },
            {
              "x": 37.1,
              "y": 10
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 35,
              "y": 10.1
            },
            {
              "x": 37,
              "y": 10.1
            },
            {
              "x": 37,
              "y": 4.1
            },
            {
              "x": 35,
              "y": 4.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 41,
              "y": 31.9
            },
            {
              "x": 41,
              "y": 25.9
            },
            {
              "x": 37,
              "y": 25.9
            },
            {
              "x": 37,
              "y": 31.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 44,
              "y": 31.4
            },
            {
              "x": 44,
              "y": 31.9
            },
            {
              "x": 46.6,
              "y": 31.9
            },
            {
              "x": 46.6,
              "y": 21.9
            },
            {
              "x": 44,
              "y": 21.9
            },
            {
              "x": 44,
              "y": 29.3
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 46.6,
              "y": 37.9
            },
            {
              "x": 46.6,
              "y": 31.9
            },
            {
              "x": 50.6,
              "y": 31.9
            },
            {
              "x": 50.6,
              "y": 37.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 46.1,
              "y": 6
            },
            {
              "x": 46.1,
              "y": 17.6
            },
            {
              "x": 53.2,
              "y": 17.6
            },
            {
              "x": 53.2,
              "y": 6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 41,
              "y": 34
            },
            {
              "x": 29.4,
              "y": 34
            },
            {
              "x": 29.4,
              "y": 41
            },
            {
              "x": 41,
              "y": 41
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 33,
              "y": 12
            },
            {
              "x": 32.4,
              "y": 25.1
            },
            {
              "x": 34.2,
              "y": 26.1
            },
            {
              "x": 40,
              "y": 16
            }
          ]
        }
      }
    },
    {
      "missionKey": "Inescapable Dominion ↔ Secure Asset",
      "missionA": "Inescapable Dominion",
      "missionB": "Secure Asset",
      "layout": "C",
      "page": 23,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 22.2,
          "y": 37.7
        },
        "Attacker Home": {
          "x": 37.9,
          "y": 6.1
        },
        "Central 1": {
          "x": 34.7,
          "y": 21.5
        },
        "Central 2": {
          "x": 25.3,
          "y": 22.5
        },
        "Expansion 1": {
          "x": 11.2,
          "y": 18.2
        },
        "Expansion 2": {
          "x": 48.9,
          "y": 25.9
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 15.8,
              "y": 41
            },
            {
              "x": 27.5,
              "y": 41
            },
            {
              "x": 27.5,
              "y": 34
            },
            {
              "x": 15.8,
              "y": 34
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 44.5,
              "y": 30.1
            },
            {
              "x": 56.1,
              "y": 30.1
            },
            {
              "x": 56.1,
              "y": 23
            },
            {
              "x": 44.5,
              "y": 23
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 41.5,
              "y": 37.2
            },
            {
              "x": 42.2,
              "y": 39.1
            },
            {
              "x": 47.9,
              "y": 37
            },
            {
              "x": 47.2,
              "y": 35.2
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 55.1,
              "y": 38
            },
            {
              "x": 50.5,
              "y": 34.1
            },
            {
              "x": 47.9,
              "y": 37.1
            },
            {
              "x": 52.5,
              "y": 41
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 44,
              "y": 2.9
            },
            {
              "x": 32.4,
              "y": 2.9
            },
            {
              "x": 32.4,
              "y": 9.9
            },
            {
              "x": 44,
              "y": 9.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 15.5,
              "y": 13.9
            },
            {
              "x": 3.9,
              "y": 13.9
            },
            {
              "x": 3.9,
              "y": 20.9
            },
            {
              "x": 15.5,
              "y": 20.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 18.5,
              "y": 6.9
            },
            {
              "x": 17.8,
              "y": 5
            },
            {
              "x": 12.1,
              "y": 7.1
            },
            {
              "x": 12.7,
              "y": 8.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 31,
              "y": 12.3
            },
            {
              "x": 31.5,
              "y": 12.4
            },
            {
              "x": 32.4,
              "y": 10
            },
            {
              "x": 22.8,
              "y": 6.8
            },
            {
              "x": 22,
              "y": 9.3
            },
            {
              "x": 29.1,
              "y": 11.6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 4.9,
              "y": 6.1
            },
            {
              "x": 9.4,
              "y": 10.1
            },
            {
              "x": 12.1,
              "y": 7
            },
            {
              "x": 7.5,
              "y": 3.1
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 28.1,
              "y": 15.1
            },
            {
              "x": 26.9,
              "y": 28.1
            },
            {
              "x": 25,
              "y": 28.9
            },
            {
              "x": 20.6,
              "y": 18.2
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 13.1,
              "y": 25.8
            },
            {
              "x": 17,
              "y": 30.4
            },
            {
              "x": 13.9,
              "y": 33
            },
            {
              "x": 10,
              "y": 28.3
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 6.7,
              "y": 31
            },
            {
              "x": 5.4,
              "y": 29.5
            },
            {
              "x": 10.1,
              "y": 25.6
            },
            {
              "x": 11.3,
              "y": 27.2
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 28.9,
              "y": 31.6
            },
            {
              "x": 28.4,
              "y": 31.5
            },
            {
              "x": 27.5,
              "y": 33.9
            },
            {
              "x": 37.1,
              "y": 37.1
            },
            {
              "x": 37.9,
              "y": 34.7
            },
            {
              "x": 30.8,
              "y": 32.3
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 46.8,
              "y": 18.1
            },
            {
              "x": 43,
              "y": 13.4
            },
            {
              "x": 46.1,
              "y": 10.9
            },
            {
              "x": 49.9,
              "y": 15.5
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 53.3,
              "y": 12.8
            },
            {
              "x": 54.6,
              "y": 14.3
            },
            {
              "x": 49.9,
              "y": 18.2
            },
            {
              "x": 48.6,
              "y": 16.7
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 31.9,
              "y": 28.9
            },
            {
              "x": 33.1,
              "y": 15.9
            },
            {
              "x": 35,
              "y": 15.1
            },
            {
              "x": 39.4,
              "y": 25.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Meatgrinder ↔ Meatgrinder",
      "missionA": "Meatgrinder",
      "missionB": "Meatgrinder",
      "layout": "A",
      "page": 24,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9,
          "y": 36.1
        },
        "Attacker Home": {
          "x": 50.3,
          "y": 8.6
        },
        "Central 1": {
          "x": 22.3,
          "y": 17.8
        },
        "Central 2": {
          "x": 37.4,
          "y": 26.5
        },
        "Expansion 1": {
          "x": 8.4,
          "y": 12.4
        },
        "Expansion 2": {
          "x": 52.6,
          "y": 32.1
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 15.4,
              "y": 32
            },
            {
              "x": 3.8,
              "y": 32
            },
            {
              "x": 3.8,
              "y": 39
            },
            {
              "x": 15.4,
              "y": 39
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 19.3,
              "y": 28.3
            },
            {
              "x": 18.8,
              "y": 28.1
            },
            {
              "x": 17.7,
              "y": 30.4
            },
            {
              "x": 26.8,
              "y": 34.7
            },
            {
              "x": 27.9,
              "y": 32.3
            },
            {
              "x": 21.2,
              "y": 29.2
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 55,
              "y": 37
            },
            {
              "x": 55,
              "y": 31
            },
            {
              "x": 51,
              "y": 31
            },
            {
              "x": 51,
              "y": 37
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 3.9,
              "y": 21
            },
            {
              "x": 15,
              "y": 28
            },
            {
              "x": 16.8,
              "y": 26.9
            },
            {
              "x": 10.9,
              "y": 16.9
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 28.6,
              "y": 35.5
            },
            {
              "x": 26.8,
              "y": 34.7
            },
            {
              "x": 24.2,
              "y": 40.2
            },
            {
              "x": 26,
              "y": 41
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 40.6,
              "y": 15.7
            },
            {
              "x": 41.1,
              "y": 15.9
            },
            {
              "x": 42.2,
              "y": 13.6
            },
            {
              "x": 33.1,
              "y": 9.3
            },
            {
              "x": 32,
              "y": 11.7
            },
            {
              "x": 38.7,
              "y": 14.8
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 31.3,
              "y": 8.5
            },
            {
              "x": 33.1,
              "y": 9.3
            },
            {
              "x": 35.7,
              "y": 3.8
            },
            {
              "x": 33.9,
              "y": 3
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 56.1,
              "y": 22.9
            },
            {
              "x": 45,
              "y": 16
            },
            {
              "x": 43.2,
              "y": 17
            },
            {
              "x": 49.1,
              "y": 27
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 43.5,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 5
            },
            {
              "x": 43.5,
              "y": 5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 31,
              "y": 30
            },
            {
              "x": 42.7,
              "y": 30
            },
            {
              "x": 42.7,
              "y": 23
            },
            {
              "x": 31,
              "y": 23
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 18.9,
              "y": 10.1
            },
            {
              "x": 18.9,
              "y": 8.1
            },
            {
              "x": 24.9,
              "y": 8.1
            },
            {
              "x": 24.9,
              "y": 10.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 4.9,
              "y": 7
            },
            {
              "x": 4.9,
              "y": 13.1
            },
            {
              "x": 8.9,
              "y": 13.1
            },
            {
              "x": 8.9,
              "y": 7
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 14.8,
              "y": 10.1
            },
            {
              "x": 14.8,
              "y": 4.1
            },
            {
              "x": 18.8,
              "y": 4.1
            },
            {
              "x": 18.8,
              "y": 10.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 41,
              "y": 33.9
            },
            {
              "x": 41,
              "y": 35.9
            },
            {
              "x": 35,
              "y": 35.9
            },
            {
              "x": 35,
              "y": 33.9
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 45.1,
              "y": 33.9
            },
            {
              "x": 45.1,
              "y": 40
            },
            {
              "x": 41.1,
              "y": 40
            },
            {
              "x": 41.1,
              "y": 33.9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 28.9,
              "y": 13.9
            },
            {
              "x": 17.2,
              "y": 13.9
            },
            {
              "x": 17.2,
              "y": 21
            },
            {
              "x": 28.9,
              "y": 21
            }
          ]
        }
      }
    },
    {
      "missionKey": "Meatgrinder ↔ Meatgrinder",
      "missionA": "Meatgrinder",
      "missionB": "Meatgrinder",
      "layout": "B",
      "page": 25,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 12.1,
          "y": 33.6
        },
        "Attacker Home": {
          "x": 47.7,
          "y": 9.9
        },
        "Central 1": {
          "x": 29.6,
          "y": 11.1
        },
        "Central 2": {
          "x": 30.5,
          "y": 33.2
        },
        "Expansion 1": {
          "x": 17.1,
          "y": 6.9
        },
        "Expansion 2": {
          "x": 43,
          "y": 37.2
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 26,
              "y": 6
            },
            {
              "x": 26,
              "y": 17.6
            },
            {
              "x": 33.1,
              "y": 17.6
            },
            {
              "x": 33.1,
              "y": 6
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 46,
              "y": 42.1
            },
            {
              "x": 46,
              "y": 30.5
            },
            {
              "x": 39,
              "y": 30.5
            },
            {
              "x": 39,
              "y": 42.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 34.1,
              "y": 38
            },
            {
              "x": 34.1,
              "y": 26.4
            },
            {
              "x": 27,
              "y": 26.4
            },
            {
              "x": 27,
              "y": 38
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 10,
              "y": 13
            },
            {
              "x": 8,
              "y": 13
            },
            {
              "x": 8,
              "y": 6.9
            },
            {
              "x": 10,
              "y": 6.9
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 10,
              "y": 13.6
            },
            {
              "x": 10,
              "y": 13
            },
            {
              "x": 7.4,
              "y": 13
            },
            {
              "x": 7.4,
              "y": 23
            },
            {
              "x": 10,
              "y": 23
            },
            {
              "x": 10,
              "y": 15.6
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 22.9,
              "y": 40.1
            },
            {
              "x": 22.9,
              "y": 34
            },
            {
              "x": 18.9,
              "y": 34
            },
            {
              "x": 18.9,
              "y": 40.1
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 25.1,
              "y": 19.5
            },
            {
              "x": 19.9,
              "y": 16.5
            },
            {
              "x": 17.9,
              "y": 19.9
            },
            {
              "x": 23.1,
              "y": 22.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 7.9,
              "y": 26.2
            },
            {
              "x": 11,
              "y": 38.9
            },
            {
              "x": 13,
              "y": 39.4
            },
            {
              "x": 15.8,
              "y": 28.1
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 25,
              "y": 23.8
            },
            {
              "x": 23.3,
              "y": 22.8
            },
            {
              "x": 20.2,
              "y": 28
            },
            {
              "x": 22,
              "y": 29
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 13.9,
              "y": 2
            },
            {
              "x": 13.9,
              "y": 13.6
            },
            {
              "x": 21,
              "y": 13.6
            },
            {
              "x": 21,
              "y": 2
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 50,
              "y": 31
            },
            {
              "x": 52,
              "y": 31
            },
            {
              "x": 52,
              "y": 37
            },
            {
              "x": 50,
              "y": 37
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 50,
              "y": 30.4
            },
            {
              "x": 50,
              "y": 31
            },
            {
              "x": 52.6,
              "y": 31
            },
            {
              "x": 52.6,
              "y": 20.9
            },
            {
              "x": 50,
              "y": 20.9
            },
            {
              "x": 50,
              "y": 28.4
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 34.8,
              "y": 24.5
            },
            {
              "x": 40,
              "y": 27.5
            },
            {
              "x": 42,
              "y": 24.1
            },
            {
              "x": 36.8,
              "y": 21
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 52,
              "y": 17.8
            },
            {
              "x": 48.9,
              "y": 5.1
            },
            {
              "x": 46.9,
              "y": 4.6
            },
            {
              "x": 44.1,
              "y": 15.9
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 37,
              "y": 4
            },
            {
              "x": 37,
              "y": 10.1
            },
            {
              "x": 41,
              "y": 10.1
            },
            {
              "x": 41,
              "y": 4
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 35,
              "y": 20.1
            },
            {
              "x": 36.7,
              "y": 21.1
            },
            {
              "x": 39.8,
              "y": 15.8
            },
            {
              "x": 38,
              "y": 14.8
            }
          ]
        }
      }
    },
    {
      "missionKey": "Meatgrinder ↔ Meatgrinder",
      "missionA": "Meatgrinder",
      "missionB": "Meatgrinder",
      "layout": "C",
      "page": 26,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9,
          "y": 34.8
        },
        "Attacker Home": {
          "x": 51.2,
          "y": 9.1
        },
        "Central 1": {
          "x": 23.7,
          "y": 20.4
        },
        "Central 2": {
          "x": 35.9,
          "y": 23.2
        },
        "Expansion 1": {
          "x": 9,
          "y": 15.2
        },
        "Expansion 2": {
          "x": 51.3,
          "y": 29.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 44.4,
              "y": 12
            },
            {
              "x": 56,
              "y": 12
            },
            {
              "x": 56,
              "y": 5
            },
            {
              "x": 44.4,
              "y": 5
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 21,
              "y": 5
            },
            {
              "x": 7.9,
              "y": 4.2
            },
            {
              "x": 6.8,
              "y": 6
            },
            {
              "x": 16.8,
              "y": 12
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 38.9,
              "y": 38.9
            },
            {
              "x": 52,
              "y": 39.7
            },
            {
              "x": 53,
              "y": 37.9
            },
            {
              "x": 43.1,
              "y": 32
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 26.4,
              "y": 31.3
            },
            {
              "x": 26,
              "y": 31
            },
            {
              "x": 24.4,
              "y": 33
            },
            {
              "x": 32.4,
              "y": 39.1
            },
            {
              "x": 34,
              "y": 37
            },
            {
              "x": 28.1,
              "y": 32.5
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 24.4,
              "y": 33
            },
            {
              "x": 22.7,
              "y": 31.9
            },
            {
              "x": 19.2,
              "y": 36.8
            },
            {
              "x": 20.8,
              "y": 37.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 19.9,
              "y": 14.4
            },
            {
              "x": 19.9,
              "y": 26
            },
            {
              "x": 27,
              "y": 26
            },
            {
              "x": 27,
              "y": 14.4
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 40,
              "y": 29.5
            },
            {
              "x": 40,
              "y": 17.9
            },
            {
              "x": 33,
              "y": 17.9
            },
            {
              "x": 33,
              "y": 29.5
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 15.5,
              "y": 31.9
            },
            {
              "x": 3.8,
              "y": 31.9
            },
            {
              "x": 3.8,
              "y": 39
            },
            {
              "x": 15.5,
              "y": 39
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 49.7,
              "y": 22.4
            },
            {
              "x": 48.4,
              "y": 20.9
            },
            {
              "x": 53.1,
              "y": 17
            },
            {
              "x": 54.3,
              "y": 18.5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 46.9,
              "y": 22
            },
            {
              "x": 43,
              "y": 17.4
            },
            {
              "x": 46,
              "y": 14.8
            },
            {
              "x": 49.9,
              "y": 19.5
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 56.1,
              "y": 32
            },
            {
              "x": 50.1,
              "y": 32
            },
            {
              "x": 50.1,
              "y": 28
            },
            {
              "x": 56.1,
              "y": 28
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 33.5,
              "y": 12.7
            },
            {
              "x": 33.9,
              "y": 13
            },
            {
              "x": 35.5,
              "y": 10.9
            },
            {
              "x": 27.4,
              "y": 4.9
            },
            {
              "x": 25.9,
              "y": 7
            },
            {
              "x": 31.8,
              "y": 11.4
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 35.5,
              "y": 10.9
            },
            {
              "x": 37.1,
              "y": 12.1
            },
            {
              "x": 40.7,
              "y": 7.2
            },
            {
              "x": 39.1,
              "y": 6
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 10.2,
              "y": 21.6
            },
            {
              "x": 11.5,
              "y": 23.1
            },
            {
              "x": 6.8,
              "y": 27
            },
            {
              "x": 5.5,
              "y": 25.5
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 13,
              "y": 21.9
            },
            {
              "x": 16.9,
              "y": 26.6
            },
            {
              "x": 13.8,
              "y": 29.1
            },
            {
              "x": 10,
              "y": 24.5
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 3.9,
              "y": 12
            },
            {
              "x": 10,
              "y": 12
            },
            {
              "x": 10,
              "y": 16
            },
            {
              "x": 3.9,
              "y": 16
            }
          ]
        }
      }
    },
    {
      "missionKey": "Punishment ↔ Delaying Action",
      "missionA": "Punishment",
      "missionB": "Delaying Action",
      "layout": "A",
      "page": 27,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.7,
          "y": 34.4
        },
        "Attacker Home": {
          "x": 49.5,
          "y": 9.4
        },
        "Central 1": {
          "x": 23.3,
          "y": 20.6
        },
        "Central 2": {
          "x": 36.6,
          "y": 24.3
        },
        "Expansion 1": {
          "x": 13.2,
          "y": 10
        },
        "Expansion 2": {
          "x": 46.4,
          "y": 34.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 16.5,
              "y": 31
            },
            {
              "x": 4.9,
              "y": 31
            },
            {
              "x": 4.9,
              "y": 38
            },
            {
              "x": 16.5,
              "y": 38
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 15.3,
              "y": 19.5
            },
            {
              "x": 15.9,
              "y": 19.5
            },
            {
              "x": 15.9,
              "y": 22.1
            },
            {
              "x": 5.8,
              "y": 22.1
            },
            {
              "x": 5.8,
              "y": 19.5
            },
            {
              "x": 13.3,
              "y": 19.5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 22.8,
              "y": 41.1
            },
            {
              "x": 22.8,
              "y": 35
            },
            {
              "x": 18.8,
              "y": 35
            },
            {
              "x": 18.8,
              "y": 41.1
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 17.9,
              "y": 22
            },
            {
              "x": 15.9,
              "y": 22
            },
            {
              "x": 15.9,
              "y": 28.1
            },
            {
              "x": 17.9,
              "y": 28.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 36.1,
              "y": 16.9
            },
            {
              "x": 41.1,
              "y": 29
            },
            {
              "x": 39.8,
              "y": 30.6
            },
            {
              "x": 30.8,
              "y": 23.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 24,
              "y": 27.1
            },
            {
              "x": 19,
              "y": 15
            },
            {
              "x": 20.3,
              "y": 13.5
            },
            {
              "x": 29.2,
              "y": 20.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 43.4,
              "y": 13
            },
            {
              "x": 55,
              "y": 13
            },
            {
              "x": 55,
              "y": 6
            },
            {
              "x": 43.4,
              "y": 6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 8.9,
              "y": 14.6
            },
            {
              "x": 20,
              "y": 10.9
            },
            {
              "x": 17.7,
              "y": 4.2
            },
            {
              "x": 6.7,
              "y": 7.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 44.5,
              "y": 24.6
            },
            {
              "x": 43.9,
              "y": 24.5
            },
            {
              "x": 43.9,
              "y": 21.9
            },
            {
              "x": 54,
              "y": 21.9
            },
            {
              "x": 54,
              "y": 24.5
            },
            {
              "x": 46.5,
              "y": 24.5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 41.9,
              "y": 22
            },
            {
              "x": 43.9,
              "y": 22
            },
            {
              "x": 43.9,
              "y": 15.9
            },
            {
              "x": 41.9,
              "y": 15.9
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 37.9,
              "y": 3
            },
            {
              "x": 37.9,
              "y": 9
            },
            {
              "x": 41.9,
              "y": 9
            },
            {
              "x": 41.9,
              "y": 3
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 33.1,
              "y": 40.1
            },
            {
              "x": 35.1,
              "y": 40.1
            },
            {
              "x": 35.1,
              "y": 34
            },
            {
              "x": 33.1,
              "y": 34
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 33.1,
              "y": 31
            },
            {
              "x": 27,
              "y": 31
            },
            {
              "x": 27,
              "y": 35
            },
            {
              "x": 33.1,
              "y": 35
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 26.9,
              "y": 4
            },
            {
              "x": 24.9,
              "y": 4
            },
            {
              "x": 24.9,
              "y": 10
            },
            {
              "x": 26.9,
              "y": 10
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 27,
              "y": 12.9
            },
            {
              "x": 33,
              "y": 12.9
            },
            {
              "x": 33,
              "y": 8.9
            },
            {
              "x": 27,
              "y": 8.9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 50.8,
              "y": 29.4
            },
            {
              "x": 39.8,
              "y": 33
            },
            {
              "x": 42,
              "y": 39.7
            },
            {
              "x": 53,
              "y": 36
            }
          ]
        }
      }
    },
    {
      "missionKey": "Punishment ↔ Delaying Action",
      "missionA": "Punishment",
      "missionB": "Delaying Action",
      "layout": "B",
      "page": 28,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 11.3,
          "y": 26.7
        },
        "Attacker Home": {
          "x": 49,
          "y": 17.4
        },
        "Central 1": {
          "x": 33.7,
          "y": 22
        },
        "Central 2": {
          "x": 26.2,
          "y": 22.1
        },
        "Expansion 1": {
          "x": 17,
          "y": 9.1
        },
        "Expansion 2": {
          "x": 42.9,
          "y": 35
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 39,
              "y": 28.5
            },
            {
              "x": 39,
              "y": 40.1
            },
            {
              "x": 46,
              "y": 40.1
            },
            {
              "x": 46,
              "y": 28.5
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 42.6,
              "y": 14
            },
            {
              "x": 54.2,
              "y": 14
            },
            {
              "x": 54.2,
              "y": 21.1
            },
            {
              "x": 42.6,
              "y": 21.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 45.9,
              "y": 11
            },
            {
              "x": 45.9,
              "y": 9
            },
            {
              "x": 52,
              "y": 9
            },
            {
              "x": 52,
              "y": 11
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 49.4,
              "y": 34.4
            },
            {
              "x": 49.4,
              "y": 34.9
            },
            {
              "x": 52,
              "y": 34.9
            },
            {
              "x": 52,
              "y": 24.9
            },
            {
              "x": 49.4,
              "y": 24.9
            },
            {
              "x": 49.4,
              "y": 32.3
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 45.9,
              "y": 3
            },
            {
              "x": 45.9,
              "y": 9.1
            },
            {
              "x": 41.9,
              "y": 9.1
            },
            {
              "x": 41.9,
              "y": 3
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 27.9,
              "y": 11
            },
            {
              "x": 29.9,
              "y": 11
            },
            {
              "x": 29.9,
              "y": 5
            },
            {
              "x": 27.9,
              "y": 5
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 32,
              "y": 33
            },
            {
              "x": 30,
              "y": 33
            },
            {
              "x": 30,
              "y": 39
            },
            {
              "x": 32,
              "y": 39
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 29.9,
              "y": 31
            },
            {
              "x": 23.9,
              "y": 31
            },
            {
              "x": 23.9,
              "y": 35
            },
            {
              "x": 29.9,
              "y": 35
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 26.9,
              "y": 15
            },
            {
              "x": 29.3,
              "y": 27.8
            },
            {
              "x": 27.7,
              "y": 29.1
            },
            {
              "x": 20.5,
              "y": 20
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 33,
              "y": 29
            },
            {
              "x": 30.7,
              "y": 16.2
            },
            {
              "x": 32.3,
              "y": 14.9
            },
            {
              "x": 39.4,
              "y": 24
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 17.5,
              "y": 30
            },
            {
              "x": 5.9,
              "y": 30
            },
            {
              "x": 5.9,
              "y": 22.9
            },
            {
              "x": 17.5,
              "y": 22.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 21,
              "y": 15.6
            },
            {
              "x": 21,
              "y": 4
            },
            {
              "x": 13.9,
              "y": 4
            },
            {
              "x": 13.9,
              "y": 15.6
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 13.8,
              "y": 32.9
            },
            {
              "x": 13.8,
              "y": 34.9
            },
            {
              "x": 7.8,
              "y": 34.9
            },
            {
              "x": 7.8,
              "y": 32.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 10.5,
              "y": 9.5
            },
            {
              "x": 10.5,
              "y": 8.9
            },
            {
              "x": 7.9,
              "y": 8.9
            },
            {
              "x": 7.9,
              "y": 19
            },
            {
              "x": 10.5,
              "y": 19
            },
            {
              "x": 10.5,
              "y": 11.6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 13.8,
              "y": 40.9
            },
            {
              "x": 13.8,
              "y": 34.9
            },
            {
              "x": 17.8,
              "y": 34.9
            },
            {
              "x": 17.8,
              "y": 40.9
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 36.1,
              "y": 13
            },
            {
              "x": 36.1,
              "y": 9.1
            },
            {
              "x": 30,
              "y": 9.1
            }
          ]
        }
      }
    },
    {
      "missionKey": "Punishment ↔ Delaying Action",
      "missionA": "Punishment",
      "missionB": "Delaying Action",
      "layout": "C",
      "page": 29,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.9,
          "y": 35.3
        },
        "Attacker Home": {
          "x": 50.1,
          "y": 8.6
        },
        "Central 1": {
          "x": 27.3,
          "y": 18.2
        },
        "Central 2": {
          "x": 32.7,
          "y": 26.1
        },
        "Expansion 1": {
          "x": 10.1,
          "y": 19
        },
        "Expansion 2": {
          "x": 50,
          "y": 25.2
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 3.8,
              "y": 22
            },
            {
              "x": 9.7,
              "y": 12
            },
            {
              "x": 15.8,
              "y": 15.5
            },
            {
              "x": 10,
              "y": 25.6
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.5,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 5
            },
            {
              "x": 43.5,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 15.7,
              "y": 24.3
            },
            {
              "x": 15.3,
              "y": 24
            },
            {
              "x": 13.8,
              "y": 26.2
            },
            {
              "x": 22,
              "y": 31.9
            },
            {
              "x": 23.5,
              "y": 29.8
            },
            {
              "x": 17.4,
              "y": 25.5
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 21.2,
              "y": 23.1
            },
            {
              "x": 33.3,
              "y": 18
            },
            {
              "x": 33.5,
              "y": 16
            },
            {
              "x": 21.9,
              "y": 15
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 38.6,
              "y": 20.9
            },
            {
              "x": 26.6,
              "y": 26
            },
            {
              "x": 26.4,
              "y": 28.1
            },
            {
              "x": 38,
              "y": 29
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 16.5,
              "y": 31.9
            },
            {
              "x": 4.9,
              "y": 31.9
            },
            {
              "x": 4.9,
              "y": 39
            },
            {
              "x": 16.5,
              "y": 39
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 56.1,
              "y": 22
            },
            {
              "x": 50.2,
              "y": 32
            },
            {
              "x": 44.1,
              "y": 28.5
            },
            {
              "x": 49.9,
              "y": 18.5
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 42.6,
              "y": 32.5
            },
            {
              "x": 39.2,
              "y": 38
            },
            {
              "x": 43,
              "y": 40.1
            },
            {
              "x": 46.4,
              "y": 34.6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 52.1,
              "y": 37.9
            },
            {
              "x": 53.2,
              "y": 36.1
            },
            {
              "x": 47.5,
              "y": 32.8
            },
            {
              "x": 46.4,
              "y": 34.6
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 44.5,
              "y": 19.6
            },
            {
              "x": 45,
              "y": 19.9
            },
            {
              "x": 46.5,
              "y": 17.8
            },
            {
              "x": 38.2,
              "y": 12
            },
            {
              "x": 36.7,
              "y": 14.1
            },
            {
              "x": 42.8,
              "y": 18.4
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 17.3,
              "y": 11.5
            },
            {
              "x": 20.7,
              "y": 6
            },
            {
              "x": 16.9,
              "y": 3.9
            },
            {
              "x": 13.5,
              "y": 9.4
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 7.8,
              "y": 6
            },
            {
              "x": 6.7,
              "y": 7.8
            },
            {
              "x": 12.4,
              "y": 11.1
            },
            {
              "x": 13.5,
              "y": 9.3
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 22.8,
              "y": 38.9
            },
            {
              "x": 24.5,
              "y": 39.9
            },
            {
              "x": 27.7,
              "y": 34.8
            },
            {
              "x": 26,
              "y": 33.7
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 35,
              "y": 34.6
            },
            {
              "x": 29.8,
              "y": 31.4
            },
            {
              "x": 27.7,
              "y": 34.8
            },
            {
              "x": 32.9,
              "y": 38
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 37.1,
              "y": 5.1
            },
            {
              "x": 35.4,
              "y": 4
            },
            {
              "x": 32.2,
              "y": 9.2
            },
            {
              "x": 33.9,
              "y": 10.2
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 24.9,
              "y": 9.4
            },
            {
              "x": 30,
              "y": 12.6
            },
            {
              "x": 32.1,
              "y": 9.2
            },
            {
              "x": 27,
              "y": 6
            }
          ]
        }
      }
    },
    {
      "missionKey": "Consecrate ↔ Triangulation",
      "missionA": "Consecrate",
      "missionB": "Triangulation",
      "layout": "A",
      "page": 30,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 11.5,
          "y": 24.9
        },
        "Attacker Home": {
          "x": 48.3,
          "y": 18.9
        },
        "Central 1": {
          "x": 24.9,
          "y": 8.1
        },
        "Central 2": {
          "x": 35.1,
          "y": 36.2
        },
        "Expansion 1": {
          "x": 23.7,
          "y": 20.3
        },
        "Expansion 2": {
          "x": 37.2,
          "y": 24
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 42,
              "y": 44
            },
            {
              "x": 42,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 17.9,
              "y": 0
            },
            {
              "x": 17.9,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 14.9,
              "y": 30.9
            },
            {
              "x": 14.9,
              "y": 19.3
            },
            {
              "x": 7.8,
              "y": 19.3
            },
            {
              "x": 7.8,
              "y": 30.9
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 18.9,
              "y": 11
            },
            {
              "x": 30.6,
              "y": 11
            },
            {
              "x": 30.6,
              "y": 4
            },
            {
              "x": 18.9,
              "y": 4
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 6.9,
              "y": 34.9
            },
            {
              "x": 6.9,
              "y": 36.9
            },
            {
              "x": 13,
              "y": 36.9
            },
            {
              "x": 13,
              "y": 34.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 23.1,
              "y": 30.2
            },
            {
              "x": 22.9,
              "y": 29.6
            },
            {
              "x": 20.4,
              "y": 30.3
            },
            {
              "x": 23,
              "y": 40
            },
            {
              "x": 25.5,
              "y": 39.3
            },
            {
              "x": 23.6,
              "y": 32.2
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 17,
              "y": 40.9
            },
            {
              "x": 17,
              "y": 34.9
            },
            {
              "x": 13,
              "y": 34.9
            },
            {
              "x": 13,
              "y": 40.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 28.9,
              "y": 26
            },
            {
              "x": 22.8,
              "y": 14.4
            },
            {
              "x": 20.8,
              "y": 14.4
            },
            {
              "x": 20.8,
              "y": 26
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 12.1,
              "y": 5
            },
            {
              "x": 10.1,
              "y": 5
            },
            {
              "x": 10.1,
              "y": 11
            },
            {
              "x": 12.1,
              "y": 11
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 36.9,
              "y": 13.9
            },
            {
              "x": 37.1,
              "y": 14.4
            },
            {
              "x": 39.6,
              "y": 13.7
            },
            {
              "x": 37,
              "y": 4
            },
            {
              "x": 34.5,
              "y": 4.7
            },
            {
              "x": 36.4,
              "y": 11.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 53.1,
              "y": 9
            },
            {
              "x": 53.1,
              "y": 7
            },
            {
              "x": 47,
              "y": 7
            },
            {
              "x": 47,
              "y": 9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 43,
              "y": 3
            },
            {
              "x": 43,
              "y": 9
            },
            {
              "x": 47,
              "y": 9
            },
            {
              "x": 47,
              "y": 3
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 48.1,
              "y": 39
            },
            {
              "x": 50.1,
              "y": 39
            },
            {
              "x": 50.1,
              "y": 33
            },
            {
              "x": 48.1,
              "y": 33
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 48.1,
              "y": 27
            },
            {
              "x": 48.1,
              "y": 33
            },
            {
              "x": 44.1,
              "y": 33
            },
            {
              "x": 44.1,
              "y": 27
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 41,
              "y": 33
            },
            {
              "x": 29.4,
              "y": 33
            },
            {
              "x": 29.4,
              "y": 40
            },
            {
              "x": 41,
              "y": 40
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 31.2,
              "y": 18
            },
            {
              "x": 37.2,
              "y": 29.6
            },
            {
              "x": 39.3,
              "y": 29.6
            },
            {
              "x": 39.3,
              "y": 18
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 12,
              "y": 17
            },
            {
              "x": 12,
              "y": 11
            },
            {
              "x": 16,
              "y": 11
            },
            {
              "x": 16,
              "y": 17
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 45.1,
              "y": 13
            },
            {
              "x": 45.1,
              "y": 24.6
            },
            {
              "x": 52.2,
              "y": 24.6
            },
            {
              "x": 52.2,
              "y": 13
            }
          ]
        }
      }
    },
    {
      "missionKey": "Consecrate ↔ Triangulation",
      "missionA": "Consecrate",
      "missionB": "Triangulation",
      "layout": "B",
      "page": 31,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 21.2,
          "y": 37.7
        },
        "Attacker Home": {
          "x": 38.9,
          "y": 6.3
        },
        "Central 1": {
          "x": 22.9,
          "y": 21.7
        },
        "Central 2": {
          "x": 36.9,
          "y": 22.3
        },
        "Expansion 1": {
          "x": 11.2,
          "y": 18.2
        },
        "Expansion 2": {
          "x": 48.9,
          "y": 25.8
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 14.8,
              "y": 41
            },
            {
              "x": 26.5,
              "y": 41
            },
            {
              "x": 26.5,
              "y": 34
            },
            {
              "x": 14.8,
              "y": 34
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 44.5,
              "y": 30
            },
            {
              "x": 56.1,
              "y": 30
            },
            {
              "x": 56.1,
              "y": 22.9
            },
            {
              "x": 44.5,
              "y": 22.9
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 27.8,
              "y": 31.7
            },
            {
              "x": 27.3,
              "y": 31.6
            },
            {
              "x": 26.5,
              "y": 34
            },
            {
              "x": 36.1,
              "y": 37
            },
            {
              "x": 36.9,
              "y": 34.5
            },
            {
              "x": 29.8,
              "y": 32.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 36.6,
              "y": 14.3
            },
            {
              "x": 40.5,
              "y": 26.7
            },
            {
              "x": 39.1,
              "y": 28.2
            },
            {
              "x": 30.8,
              "y": 20
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 3.9,
              "y": 33.7
            },
            {
              "x": 5.4,
              "y": 35
            },
            {
              "x": 9.3,
              "y": 30.4
            },
            {
              "x": 7.8,
              "y": 29.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 15,
              "y": 30
            },
            {
              "x": 10.5,
              "y": 26
            },
            {
              "x": 7.8,
              "y": 29
            },
            {
              "x": 12.4,
              "y": 33
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 45,
              "y": 3.1
            },
            {
              "x": 33.4,
              "y": 3.1
            },
            {
              "x": 33.4,
              "y": 10.2
            },
            {
              "x": 45,
              "y": 10.2
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 15.5,
              "y": 13.9
            },
            {
              "x": 3.9,
              "y": 13.9
            },
            {
              "x": 3.9,
              "y": 20.9
            },
            {
              "x": 15.5,
              "y": 20.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 32,
              "y": 12.5
            },
            {
              "x": 32.5,
              "y": 12.6
            },
            {
              "x": 33.4,
              "y": 10.1
            },
            {
              "x": 23.8,
              "y": 7
            },
            {
              "x": 23,
              "y": 9.5
            },
            {
              "x": 30.1,
              "y": 11.8
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 44.4,
              "y": 32.8
            },
            {
              "x": 41.1,
              "y": 37.9
            },
            {
              "x": 44.4,
              "y": 40
            },
            {
              "x": 47.8,
              "y": 35
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 47.8,
              "y": 35
            },
            {
              "x": 46.7,
              "y": 36.6
            },
            {
              "x": 51.8,
              "y": 39.9
            },
            {
              "x": 52.9,
              "y": 38.2
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 15.5,
              "y": 11.3
            },
            {
              "x": 18.8,
              "y": 6.2
            },
            {
              "x": 15.5,
              "y": 4
            },
            {
              "x": 12.1,
              "y": 9.1
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 12,
              "y": 9.1
            },
            {
              "x": 13.1,
              "y": 7.4
            },
            {
              "x": 8.1,
              "y": 4.1
            },
            {
              "x": 7,
              "y": 5.7
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 56.1,
              "y": 10.2
            },
            {
              "x": 54.6,
              "y": 8.9
            },
            {
              "x": 50.6,
              "y": 13.5
            },
            {
              "x": 52.1,
              "y": 14.8
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 44.9,
              "y": 14
            },
            {
              "x": 49.5,
              "y": 17.9
            },
            {
              "x": 52.1,
              "y": 14.9
            },
            {
              "x": 47.5,
              "y": 11
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 23.2,
              "y": 29.7
            },
            {
              "x": 19.3,
              "y": 17.2
            },
            {
              "x": 20.7,
              "y": 15.8
            },
            {
              "x": 29,
              "y": 24
            }
          ]
        }
      }
    },
    {
      "missionKey": "Consecrate ↔ Triangulation",
      "missionA": "Consecrate",
      "missionB": "Triangulation",
      "layout": "C",
      "page": 32,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8,
          "y": 31.7
        },
        "Attacker Home": {
          "x": 51.7,
          "y": 12.3
        },
        "Central 1": {
          "x": 25.8,
          "y": 20.5
        },
        "Central 2": {
          "x": 34,
          "y": 23.6
        },
        "Expansion 1": {
          "x": 14.1,
          "y": 9.3
        },
        "Expansion 2": {
          "x": 45.7,
          "y": 34.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 8.9,
              "y": 7.9
            },
            {
              "x": 15.4,
              "y": 17.5
            },
            {
              "x": 21.3,
              "y": 13.6
            },
            {
              "x": 14.8,
              "y": 4
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 11.9,
              "y": 37
            },
            {
              "x": 11.9,
              "y": 25.4
            },
            {
              "x": 4.8,
              "y": 25.4
            },
            {
              "x": 4.8,
              "y": 37
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 17.7,
              "y": 27.3
            },
            {
              "x": 17.4,
              "y": 26.8
            },
            {
              "x": 15.2,
              "y": 28.3
            },
            {
              "x": 20.9,
              "y": 36.6
            },
            {
              "x": 23,
              "y": 35.2
            },
            {
              "x": 18.9,
              "y": 29
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 36,
              "y": 38
            },
            {
              "x": 36,
              "y": 32
            },
            {
              "x": 32,
              "y": 32
            },
            {
              "x": 32,
              "y": 38
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 23.9,
              "y": 28.1
            },
            {
              "x": 30.4,
              "y": 16.7
            },
            {
              "x": 29.3,
              "y": 15
            },
            {
              "x": 19.5,
              "y": 21.3
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 20.9,
              "y": 36.6
            },
            {
              "x": 19.7,
              "y": 34.9
            },
            {
              "x": 14.7,
              "y": 38.3
            },
            {
              "x": 15.8,
              "y": 40
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 24,
              "y": 5.9
            },
            {
              "x": 24,
              "y": 12
            },
            {
              "x": 27.9,
              "y": 12
            },
            {
              "x": 27.9,
              "y": 5.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 34.1,
              "y": 12
            },
            {
              "x": 34.1,
              "y": 10
            },
            {
              "x": 28,
              "y": 10
            },
            {
              "x": 28,
              "y": 12
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 42.2,
              "y": 16.7
            },
            {
              "x": 42.5,
              "y": 17.1
            },
            {
              "x": 44.7,
              "y": 15.6
            },
            {
              "x": 39,
              "y": 7.3
            },
            {
              "x": 36.9,
              "y": 8.8
            },
            {
              "x": 41,
              "y": 14.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 39,
              "y": 7.3
            },
            {
              "x": 40.2,
              "y": 9
            },
            {
              "x": 45.2,
              "y": 5.6
            },
            {
              "x": 44.1,
              "y": 4
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 50.9,
              "y": 36.1
            },
            {
              "x": 44.4,
              "y": 26.4
            },
            {
              "x": 38.6,
              "y": 30.4
            },
            {
              "x": 45.1,
              "y": 40
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 48.1,
              "y": 7
            },
            {
              "x": 48.1,
              "y": 18.6
            },
            {
              "x": 55.2,
              "y": 18.6
            },
            {
              "x": 55.2,
              "y": 7
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 11.9,
              "y": 21
            },
            {
              "x": 11.9,
              "y": 14.9
            },
            {
              "x": 7.9,
              "y": 14.9
            },
            {
              "x": 7.9,
              "y": 21
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 36,
              "y": 15.9
            },
            {
              "x": 29.6,
              "y": 27.3
            },
            {
              "x": 30.7,
              "y": 29
            },
            {
              "x": 40.5,
              "y": 22.7
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 48.1,
              "y": 23
            },
            {
              "x": 48.1,
              "y": 29
            },
            {
              "x": 52.1,
              "y": 29
            },
            {
              "x": 52.1,
              "y": 23
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 25.9,
              "y": 32.1
            },
            {
              "x": 25.9,
              "y": 34.1
            },
            {
              "x": 32,
              "y": 34.1
            },
            {
              "x": 32,
              "y": 32.1
            }
          ]
        }
      }
    },
    {
      "missionKey": "Destroyer's Wrath ↔ Vital Link",
      "missionA": "Destroyer's Wrath",
      "missionB": "Vital Link",
      "layout": "A",
      "page": 33,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 15,
          "y": 36.8
        },
        "Attacker Home": {
          "x": 45.5,
          "y": 7.9
        },
        "Central 1": {
          "x": 27.2,
          "y": 17.6
        },
        "Central 2": {
          "x": 32.3,
          "y": 26.6
        },
        "Expansion 1": {
          "x": 10.2,
          "y": 16.6
        },
        "Expansion 2": {
          "x": 49.9,
          "y": 27.1
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 3.9,
              "y": 20.1
            },
            {
              "x": 15.5,
              "y": 20.1
            },
            {
              "x": 15.5,
              "y": 13
            },
            {
              "x": 3.9,
              "y": 13
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 37.4,
              "y": 4.4
            },
            {
              "x": 49,
              "y": 4.4
            },
            {
              "x": 49,
              "y": 11.5
            },
            {
              "x": 37.4,
              "y": 11.5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 47.1,
              "y": 20.6
            },
            {
              "x": 48.5,
              "y": 19
            },
            {
              "x": 44,
              "y": 15
            },
            {
              "x": 42.6,
              "y": 16.5
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 15.4,
              "y": 8.6
            },
            {
              "x": 15.9,
              "y": 8.6
            },
            {
              "x": 15.9,
              "y": 6
            },
            {
              "x": 5.8,
              "y": 6
            },
            {
              "x": 5.8,
              "y": 8.6
            },
            {
              "x": 13.3,
              "y": 8.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 26.7,
              "y": 9.6
            },
            {
              "x": 22.9,
              "y": 4.9
            },
            {
              "x": 19.8,
              "y": 7.4
            },
            {
              "x": 23.6,
              "y": 12.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 50,
              "y": 20.2
            },
            {
              "x": 54.1,
              "y": 15.6
            },
            {
              "x": 51.2,
              "y": 12.9
            },
            {
              "x": 47,
              "y": 17.5
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 25.8,
              "y": 26.4
            },
            {
              "x": 31.2,
              "y": 14.5
            },
            {
              "x": 29.9,
              "y": 12.9
            },
            {
              "x": 20.8,
              "y": 20
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 32.7,
              "y": 7.3
            },
            {
              "x": 31.5,
              "y": 5.8
            },
            {
              "x": 26.7,
              "y": 9.6
            },
            {
              "x": 28,
              "y": 11.2
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 56,
              "y": 23.9
            },
            {
              "x": 44.4,
              "y": 23.9
            },
            {
              "x": 44.4,
              "y": 31
            },
            {
              "x": 56,
              "y": 31
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 22.6,
              "y": 39.6
            },
            {
              "x": 10.9,
              "y": 39.6
            },
            {
              "x": 10.9,
              "y": 32.5
            },
            {
              "x": 22.6,
              "y": 32.5
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 44.6,
              "y": 35.4
            },
            {
              "x": 44.1,
              "y": 35.4
            },
            {
              "x": 44.1,
              "y": 38
            },
            {
              "x": 54.1,
              "y": 38
            },
            {
              "x": 54.1,
              "y": 35.4
            },
            {
              "x": 46.7,
              "y": 35.4
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 34.1,
              "y": 17.6
            },
            {
              "x": 28.6,
              "y": 29.5
            },
            {
              "x": 29.9,
              "y": 31.1
            },
            {
              "x": 39.1,
              "y": 24
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 33.7,
              "y": 34.3
            },
            {
              "x": 37.6,
              "y": 39
            },
            {
              "x": 40.7,
              "y": 36.5
            },
            {
              "x": 36.8,
              "y": 31.8
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 27.7,
              "y": 36.6
            },
            {
              "x": 29,
              "y": 38.2
            },
            {
              "x": 33.7,
              "y": 34.3
            },
            {
              "x": 32.5,
              "y": 32.8
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 13.1,
              "y": 23.4
            },
            {
              "x": 11.7,
              "y": 24.9
            },
            {
              "x": 16.1,
              "y": 29
            },
            {
              "x": 17.5,
              "y": 27.5
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 10.2,
              "y": 23.8
            },
            {
              "x": 6,
              "y": 28.3
            },
            {
              "x": 8.9,
              "y": 31
            },
            {
              "x": 13.1,
              "y": 26.5
            }
          ]
        }
      }
    },
    {
      "missionKey": "Destroyer's Wrath ↔ Vital Link",
      "missionA": "Destroyer's Wrath",
      "missionB": "Vital Link",
      "layout": "B",
      "page": 34,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 7.8,
          "y": 36.1
        },
        "Attacker Home": {
          "x": 52.3,
          "y": 8.7
        },
        "Central 1": {
          "x": 26.2,
          "y": 19.2
        },
        "Central 2": {
          "x": 33.6,
          "y": 24.6
        },
        "Expansion 1": {
          "x": 17.5,
          "y": 9
        },
        "Expansion 2": {
          "x": 42.6,
          "y": 34.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 39,
              "y": 28.4
            },
            {
              "x": 39,
              "y": 40
            },
            {
              "x": 46,
              "y": 40
            },
            {
              "x": 46,
              "y": 28.4
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 44.5,
              "y": 12
            },
            {
              "x": 56.1,
              "y": 12
            },
            {
              "x": 56.1,
              "y": 5
            },
            {
              "x": 44.5,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 41,
              "y": 21
            },
            {
              "x": 43,
              "y": 21
            },
            {
              "x": 43,
              "y": 14.9
            },
            {
              "x": 41,
              "y": 14.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 52.6,
              "y": 23.6
            },
            {
              "x": 53.1,
              "y": 23.6
            },
            {
              "x": 53.1,
              "y": 21
            },
            {
              "x": 43,
              "y": 21
            },
            {
              "x": 43,
              "y": 23.6
            },
            {
              "x": 50.5,
              "y": 23.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 50.1,
              "y": 28
            },
            {
              "x": 50.1,
              "y": 34.1
            },
            {
              "x": 54.1,
              "y": 34.1
            },
            {
              "x": 54.1,
              "y": 28
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 35.2,
              "y": 18.1
            },
            {
              "x": 23.2,
              "y": 23.3
            },
            {
              "x": 21.6,
              "y": 22
            },
            {
              "x": 28.9,
              "y": 13
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 20.9,
              "y": 15.6
            },
            {
              "x": 20.9,
              "y": 4
            },
            {
              "x": 13.9,
              "y": 4
            },
            {
              "x": 13.9,
              "y": 15.6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 15.5,
              "y": 32
            },
            {
              "x": 3.9,
              "y": 32
            },
            {
              "x": 3.9,
              "y": 39
            },
            {
              "x": 15.5,
              "y": 39
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 18.8,
              "y": 22.9
            },
            {
              "x": 16.8,
              "y": 22.9
            },
            {
              "x": 16.8,
              "y": 29
            },
            {
              "x": 18.8,
              "y": 29
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 7.3,
              "y": 20.3
            },
            {
              "x": 6.8,
              "y": 20.3
            },
            {
              "x": 6.8,
              "y": 22.9
            },
            {
              "x": 16.8,
              "y": 22.9
            },
            {
              "x": 16.8,
              "y": 20.3
            },
            {
              "x": 9.4,
              "y": 20.3
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 9.9,
              "y": 15.9
            },
            {
              "x": 9.9,
              "y": 9.9
            },
            {
              "x": 5.9,
              "y": 9.9
            },
            {
              "x": 5.9,
              "y": 15.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 24.7,
              "y": 26
            },
            {
              "x": 36.7,
              "y": 20.8
            },
            {
              "x": 38.3,
              "y": 22.1
            },
            {
              "x": 31,
              "y": 31.1
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 28,
              "y": 32
            },
            {
              "x": 28,
              "y": 34
            },
            {
              "x": 22,
              "y": 34
            },
            {
              "x": 22,
              "y": 32
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 32,
              "y": 40
            },
            {
              "x": 32,
              "y": 34
            },
            {
              "x": 28,
              "y": 34
            },
            {
              "x": 28,
              "y": 40
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 31.9,
              "y": 12.1
            },
            {
              "x": 31.9,
              "y": 10.1
            },
            {
              "x": 38,
              "y": 10.1
            },
            {
              "x": 38,
              "y": 12.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 27.9,
              "y": 4.1
            },
            {
              "x": 27.9,
              "y": 10.1
            },
            {
              "x": 31.9,
              "y": 10.1
            },
            {
              "x": 31.9,
              "y": 4.1
            }
          ]
        }
      }
    },
    {
      "missionKey": "Destroyer's Wrath ↔ Vital Link",
      "missionA": "Destroyer's Wrath",
      "missionB": "Vital Link",
      "layout": "C",
      "page": 35,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 11.9,
          "y": 20.5
        },
        "Attacker Home": {
          "x": 48.4,
          "y": 22.8
        },
        "Central 1": {
          "x": 29.8,
          "y": 18.2
        },
        "Central 2": {
          "x": 30.6,
          "y": 25.8
        },
        "Expansion 1": {
          "x": 21.5,
          "y": 9.5
        },
        "Expansion 2": {
          "x": 38.5,
          "y": 34.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 42,
              "y": 44
            },
            {
              "x": 42,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 17.9,
              "y": 0
            },
            {
              "x": 17.9,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 34,
              "y": 30.4
            },
            {
              "x": 34,
              "y": 42
            },
            {
              "x": 41,
              "y": 42
            },
            {
              "x": 41,
              "y": 30.4
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 51.2,
              "y": 28.6
            },
            {
              "x": 51.2,
              "y": 17
            },
            {
              "x": 44.2,
              "y": 17
            },
            {
              "x": 44.2,
              "y": 28.6
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 46.4,
              "y": 39.5
            },
            {
              "x": 46.4,
              "y": 40
            },
            {
              "x": 49,
              "y": 40
            },
            {
              "x": 49,
              "y": 30
            },
            {
              "x": 46.4,
              "y": 30
            },
            {
              "x": 46.4,
              "y": 37.4
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 38.3,
              "y": 19.9
            },
            {
              "x": 25.2,
              "y": 20.9
            },
            {
              "x": 24.1,
              "y": 19.1
            },
            {
              "x": 34,
              "y": 13
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 45,
              "y": 9
            },
            {
              "x": 47,
              "y": 9
            },
            {
              "x": 47,
              "y": 15.1
            },
            {
              "x": 45,
              "y": 15.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 47.1,
              "y": 9
            },
            {
              "x": 47.1,
              "y": 3
            },
            {
              "x": 51.1,
              "y": 3
            },
            {
              "x": 51.1,
              "y": 9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 25.9,
              "y": 13.6
            },
            {
              "x": 25.9,
              "y": 2
            },
            {
              "x": 18.9,
              "y": 2
            },
            {
              "x": 18.9,
              "y": 13.6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 8.9,
              "y": 15.1
            },
            {
              "x": 8.9,
              "y": 26.7
            },
            {
              "x": 15.9,
              "y": 26.7
            },
            {
              "x": 15.9,
              "y": 15.1
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 15,
              "y": 34.9
            },
            {
              "x": 13,
              "y": 34.9
            },
            {
              "x": 13,
              "y": 28.8
            },
            {
              "x": 15,
              "y": 28.8
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 13.6,
              "y": 4.6
            },
            {
              "x": 13.6,
              "y": 4
            },
            {
              "x": 11,
              "y": 4
            },
            {
              "x": 11,
              "y": 14.1
            },
            {
              "x": 13.6,
              "y": 14.1
            },
            {
              "x": 13.6,
              "y": 6.6
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 24.9,
              "y": 31.9
            },
            {
              "x": 18.8,
              "y": 31.9
            },
            {
              "x": 18.8,
              "y": 35.9
            },
            {
              "x": 24.9,
              "y": 35.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 13,
              "y": 34.9
            },
            {
              "x": 13,
              "y": 41
            },
            {
              "x": 9,
              "y": 41
            },
            {
              "x": 9,
              "y": 34.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 21.7,
              "y": 24.2
            },
            {
              "x": 34.8,
              "y": 23.2
            },
            {
              "x": 35.9,
              "y": 25
            },
            {
              "x": 26,
              "y": 31.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 26.9,
              "y": 34
            },
            {
              "x": 24.9,
              "y": 34
            },
            {
              "x": 24.9,
              "y": 40
            },
            {
              "x": 26.9,
              "y": 40
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 35.1,
              "y": 12
            },
            {
              "x": 41.1,
              "y": 12
            },
            {
              "x": 41.1,
              "y": 8.1
            },
            {
              "x": 35.1,
              "y": 8.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 33,
              "y": 10
            },
            {
              "x": 35,
              "y": 10
            },
            {
              "x": 35,
              "y": 3.9
            },
            {
              "x": 33,
              "y": 3.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Outmanoeuvre ↔ Outmanoeuvre",
      "missionA": "Outmanoeuvre",
      "missionB": "Outmanoeuvre",
      "layout": "A",
      "page": 36,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.2,
          "y": 32.5
        },
        "Attacker Home": {
          "x": 51.1,
          "y": 12.7
        },
        "Central 1": {
          "x": 32.9,
          "y": 21.1
        },
        "Expansion 1": {
          "x": 12.1,
          "y": 10.1
        },
        "Expansion 2": {
          "x": 47.6,
          "y": 34
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 44.2,
              "y": 9
            },
            {
              "x": 50.9,
              "y": 18.5
            },
            {
              "x": 56.7,
              "y": 14.4
            },
            {
              "x": 50,
              "y": 4.9
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 53.1,
              "y": 36.1
            },
            {
              "x": 46.5,
              "y": 26.6
            },
            {
              "x": 40.7,
              "y": 30.6
            },
            {
              "x": 47.4,
              "y": 40.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 37,
              "y": 33
            },
            {
              "x": 35,
              "y": 33
            },
            {
              "x": 35,
              "y": 39
            },
            {
              "x": 37,
              "y": 39
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 22.5,
              "y": 30.5
            },
            {
              "x": 22.5,
              "y": 30
            },
            {
              "x": 19.9,
              "y": 30
            },
            {
              "x": 19.9,
              "y": 40
            },
            {
              "x": 22.5,
              "y": 40
            },
            {
              "x": 22.5,
              "y": 32.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 35,
              "y": 31
            },
            {
              "x": 28.9,
              "y": 31
            },
            {
              "x": 28.9,
              "y": 35
            },
            {
              "x": 35,
              "y": 35
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 33.1,
              "y": 16.1
            },
            {
              "x": 26.7,
              "y": 27.5
            },
            {
              "x": 27.8,
              "y": 29.3
            },
            {
              "x": 37.5,
              "y": 22.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 22.6,
              "y": 27.9
            },
            {
              "x": 22.6,
              "y": 29.9
            },
            {
              "x": 16.5,
              "y": 29.9
            },
            {
              "x": 16.5,
              "y": 27.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 6.8,
              "y": 7.9
            },
            {
              "x": 13.5,
              "y": 17.4
            },
            {
              "x": 19.3,
              "y": 13.4
            },
            {
              "x": 12.6,
              "y": 3.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 26.7,
              "y": 27.6
            },
            {
              "x": 33.1,
              "y": 16.2
            },
            {
              "x": 32,
              "y": 14.5
            },
            {
              "x": 22.3,
              "y": 20.8
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 15.8,
              "y": 35
            },
            {
              "x": 9.2,
              "y": 25.5
            },
            {
              "x": 3.4,
              "y": 29.5
            },
            {
              "x": 10,
              "y": 39
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 23,
              "y": 11
            },
            {
              "x": 25,
              "y": 11
            },
            {
              "x": 25,
              "y": 4.9
            },
            {
              "x": 23,
              "y": 4.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 25,
              "y": 12.8
            },
            {
              "x": 31.1,
              "y": 12.8
            },
            {
              "x": 31.1,
              "y": 8.9
            },
            {
              "x": 25,
              "y": 8.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 50.6,
              "y": 26.2
            },
            {
              "x": 49.9,
              "y": 20.2
            },
            {
              "x": 45.9,
              "y": 20.6
            },
            {
              "x": 46.6,
              "y": 26.6
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 37.2,
              "y": 13.4
            },
            {
              "x": 37.3,
              "y": 14
            },
            {
              "x": 39.9,
              "y": 14
            },
            {
              "x": 39.9,
              "y": 4
            },
            {
              "x": 37.3,
              "y": 4
            },
            {
              "x": 37.3,
              "y": 11.4
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 37.2,
              "y": 16
            },
            {
              "x": 37.2,
              "y": 14.1
            },
            {
              "x": 43.3,
              "y": 14.1
            },
            {
              "x": 43.3,
              "y": 16
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 9.4,
              "y": 17.7
            },
            {
              "x": 9.9,
              "y": 23.7
            },
            {
              "x": 13.8,
              "y": 23.5
            },
            {
              "x": 13.4,
              "y": 17.4
            }
          ]
        }
      }
    },
    {
      "missionKey": "Outmanoeuvre ↔ Outmanoeuvre",
      "missionA": "Outmanoeuvre",
      "missionB": "Outmanoeuvre",
      "layout": "B",
      "page": 37,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.7,
          "y": 32.6
        },
        "Attacker Home": {
          "x": 51.4,
          "y": 12
        },
        "Central 1": {
          "x": 31.5,
          "y": 24.4
        },
        "Expansion 1": {
          "x": 17.5,
          "y": 8.8
        },
        "Expansion 2": {
          "x": 42.4,
          "y": 35.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 55,
              "y": 17.6
            },
            {
              "x": 55,
              "y": 6
            },
            {
              "x": 48,
              "y": 6
            },
            {
              "x": 48,
              "y": 17.6
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 46,
              "y": 40
            },
            {
              "x": 46,
              "y": 28.4
            },
            {
              "x": 39,
              "y": 28.4
            },
            {
              "x": 39,
              "y": 40
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 11.9,
              "y": 20
            },
            {
              "x": 11.9,
              "y": 13.9
            },
            {
              "x": 7.9,
              "y": 13.9
            },
            {
              "x": 7.9,
              "y": 20
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 31,
              "y": 31.1
            },
            {
              "x": 24.9,
              "y": 31.1
            },
            {
              "x": 24.9,
              "y": 35
            },
            {
              "x": 31,
              "y": 35
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 16.2
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 27.8
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 48,
              "y": 23.9
            },
            {
              "x": 48,
              "y": 30
            },
            {
              "x": 52,
              "y": 30
            },
            {
              "x": 52,
              "y": 23.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 4.9,
              "y": 26.4
            },
            {
              "x": 4.9,
              "y": 38
            },
            {
              "x": 11.9,
              "y": 38
            },
            {
              "x": 11.9,
              "y": 26.4
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 13.9,
              "y": 3.9
            },
            {
              "x": 13.9,
              "y": 15.5
            },
            {
              "x": 20.9,
              "y": 15.5
            },
            {
              "x": 20.9,
              "y": 3.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 21,
              "y": 28.5
            },
            {
              "x": 21.2,
              "y": 28
            },
            {
              "x": 18.9,
              "y": 26.9
            },
            {
              "x": 14.6,
              "y": 36
            },
            {
              "x": 17,
              "y": 37.1
            },
            {
              "x": 20.1,
              "y": 30.3
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 14.5,
              "y": 22.1
            },
            {
              "x": 13.5,
              "y": 23.8
            },
            {
              "x": 18.8,
              "y": 26.8
            },
            {
              "x": 19.8,
              "y": 25.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 38.8,
              "y": 15.5
            },
            {
              "x": 38.6,
              "y": 16
            },
            {
              "x": 41,
              "y": 17.1
            },
            {
              "x": 45.2,
              "y": 8
            },
            {
              "x": 42.9,
              "y": 6.9
            },
            {
              "x": 39.7,
              "y": 13.6
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 45.3,
              "y": 21.9
            },
            {
              "x": 46.3,
              "y": 20.2
            },
            {
              "x": 41,
              "y": 17.1
            },
            {
              "x": 40,
              "y": 18.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 31,
              "y": 39
            },
            {
              "x": 33,
              "y": 39
            },
            {
              "x": 33,
              "y": 33
            },
            {
              "x": 31,
              "y": 33
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 28.9,
              "y": 5
            },
            {
              "x": 26.9,
              "y": 5
            },
            {
              "x": 26.9,
              "y": 11
            },
            {
              "x": 28.9,
              "y": 11
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 28.9,
              "y": 12.8
            },
            {
              "x": 35,
              "y": 12.8
            },
            {
              "x": 35,
              "y": 8.8
            },
            {
              "x": 28.9,
              "y": 8.8
            }
          ]
        }
      }
    },
    {
      "missionKey": "Outmanoeuvre ↔ Outmanoeuvre",
      "missionA": "Outmanoeuvre",
      "missionB": "Outmanoeuvre",
      "layout": "C",
      "page": 38,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.5,
          "y": 36
        },
        "Attacker Home": {
          "x": 51.6,
          "y": 8.5
        },
        "Central 1": {
          "x": 31.9,
          "y": 20.7
        },
        "Expansion 1": {
          "x": 9,
          "y": 16.6
        },
        "Expansion 2": {
          "x": 52,
          "y": 27.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 10.4
            },
            {
              "x": 4.9,
              "y": 10.4
            },
            {
              "x": 4.9,
              "y": 22
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.5,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 5
            },
            {
              "x": 43.5,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 29.6,
              "y": 6.3
            },
            {
              "x": 28.1,
              "y": 5
            },
            {
              "x": 24.3,
              "y": 9.8
            },
            {
              "x": 25.8,
              "y": 11
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 41.9,
              "y": 14.2
            },
            {
              "x": 42.4,
              "y": 14.4
            },
            {
              "x": 43.4,
              "y": 12.1
            },
            {
              "x": 34.2,
              "y": 8
            },
            {
              "x": 33.2,
              "y": 10.4
            },
            {
              "x": 40,
              "y": 13.4
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 7.8,
              "y": 8
            },
            {
              "x": 13.9,
              "y": 8
            },
            {
              "x": 13.9,
              "y": 4
            },
            {
              "x": 7.8,
              "y": 4
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19.1
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 23,
              "y": 11.2
            },
            {
              "x": 24.3,
              "y": 9.7
            },
            {
              "x": 19.5,
              "y": 5.9
            },
            {
              "x": 18.3,
              "y": 7.5
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 45.9,
              "y": 36
            },
            {
              "x": 52,
              "y": 36
            },
            {
              "x": 52,
              "y": 40
            },
            {
              "x": 45.9,
              "y": 40
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 30.4,
              "y": 37.8
            },
            {
              "x": 32,
              "y": 39
            },
            {
              "x": 35.8,
              "y": 34.3
            },
            {
              "x": 34.2,
              "y": 33.1
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 37,
              "y": 32.8
            },
            {
              "x": 35.8,
              "y": 34.4
            },
            {
              "x": 40.5,
              "y": 38.2
            },
            {
              "x": 41.8,
              "y": 36.6
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 48.1,
              "y": 22
            },
            {
              "x": 48.1,
              "y": 33.6
            },
            {
              "x": 55.2,
              "y": 33.6
            },
            {
              "x": 55.2,
              "y": 22
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 16.4,
              "y": 32
            },
            {
              "x": 4.8,
              "y": 32
            },
            {
              "x": 4.8,
              "y": 39
            },
            {
              "x": 16.4,
              "y": 39
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 48.1,
              "y": 18.1
            },
            {
              "x": 42,
              "y": 18.1
            },
            {
              "x": 42,
              "y": 22.1
            },
            {
              "x": 48.1,
              "y": 22.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 35.8,
              "y": 19.1
            },
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 24.2,
              "y": 27.2
            },
            {
              "x": 35.8,
              "y": 27.2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 18,
              "y": 29.7
            },
            {
              "x": 17.5,
              "y": 29.5
            },
            {
              "x": 16.4,
              "y": 31.8
            },
            {
              "x": 25.5,
              "y": 36.2
            },
            {
              "x": 26.6,
              "y": 33.8
            },
            {
              "x": 19.9,
              "y": 30.6
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 11.9,
              "y": 26
            },
            {
              "x": 18,
              "y": 26
            },
            {
              "x": 18,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            }
          ]
        }
      }
    },
    {
      "missionKey": "Smoke and Mirrors ↔ Surveil the Foe",
      "missionA": "Smoke and Mirrors",
      "missionB": "Surveil the Foe",
      "layout": "A",
      "page": 39,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.3,
          "y": 26.3
        },
        "Attacker Home": {
          "x": 49.3,
          "y": 17.3
        },
        "Central 1": {
          "x": 23.2,
          "y": 17.7
        },
        "Central 2": {
          "x": 36.7,
          "y": 26.3
        },
        "Expansion 1": {
          "x": 18.9,
          "y": 7.3
        },
        "Expansion 2": {
          "x": 41.4,
          "y": 36.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 47.1,
              "y": 32.9
            },
            {
              "x": 35.5,
              "y": 32.9
            },
            {
              "x": 35.5,
              "y": 40
            },
            {
              "x": 47.1,
              "y": 40
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 54.2,
              "y": 14.1
            },
            {
              "x": 42.5,
              "y": 14.1
            },
            {
              "x": 42.5,
              "y": 21.1
            },
            {
              "x": 54.2,
              "y": 21.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 49.7,
              "y": 23.4
            },
            {
              "x": 49.7,
              "y": 22.9
            },
            {
              "x": 47.1,
              "y": 22.9
            },
            {
              "x": 47.1,
              "y": 32.9
            },
            {
              "x": 49.7,
              "y": 32.9
            },
            {
              "x": 49.7,
              "y": 25.5
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 41.9,
              "y": 3
            },
            {
              "x": 41.9,
              "y": 9
            },
            {
              "x": 45.9,
              "y": 9
            },
            {
              "x": 45.9,
              "y": 3
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 28,
              "y": 38.8
            },
            {
              "x": 30,
              "y": 39
            },
            {
              "x": 30.8,
              "y": 33.1
            },
            {
              "x": 28.8,
              "y": 32.8
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 29.1,
              "y": 30.8
            },
            {
              "x": 23.1,
              "y": 30
            },
            {
              "x": 22.5,
              "y": 33.9
            },
            {
              "x": 28.5,
              "y": 34.8
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 12.9,
              "y": 11
            },
            {
              "x": 24.6,
              "y": 11
            },
            {
              "x": 24.6,
              "y": 4
            },
            {
              "x": 12.9,
              "y": 4
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 5.9,
              "y": 29.9
            },
            {
              "x": 17.5,
              "y": 29.9
            },
            {
              "x": 17.5,
              "y": 22.9
            },
            {
              "x": 5.9,
              "y": 22.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 10.3,
              "y": 20.5
            },
            {
              "x": 10.3,
              "y": 21
            },
            {
              "x": 12.9,
              "y": 21
            },
            {
              "x": 12.9,
              "y": 11
            },
            {
              "x": 10.3,
              "y": 11
            },
            {
              "x": 10.3,
              "y": 18.4
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 17.8,
              "y": 41
            },
            {
              "x": 17.8,
              "y": 34.9
            },
            {
              "x": 13.8,
              "y": 34.9
            },
            {
              "x": 13.8,
              "y": 41
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 7.8,
              "y": 32.9
            },
            {
              "x": 7.8,
              "y": 34.9
            },
            {
              "x": 13.9,
              "y": 34.9
            },
            {
              "x": 13.9,
              "y": 32.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 34.6,
              "y": 17.4
            },
            {
              "x": 40.6,
              "y": 29
            },
            {
              "x": 39.4,
              "y": 30.7
            },
            {
              "x": 29.9,
              "y": 24
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 25.3,
              "y": 26.5
            },
            {
              "x": 19.3,
              "y": 14.9
            },
            {
              "x": 20.4,
              "y": 13.3
            },
            {
              "x": 30,
              "y": 19.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 31.9,
              "y": 5.2
            },
            {
              "x": 29.9,
              "y": 4.9
            },
            {
              "x": 29.2,
              "y": 10.9
            },
            {
              "x": 31.2,
              "y": 11.2
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 30.9,
              "y": 13.1
            },
            {
              "x": 37,
              "y": 13.9
            },
            {
              "x": 37.4,
              "y": 9.9
            },
            {
              "x": 31.4,
              "y": 9.2
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 52,
              "y": 11
            },
            {
              "x": 52,
              "y": 9
            },
            {
              "x": 45.9,
              "y": 9
            },
            {
              "x": 45.9,
              "y": 11
            }
          ]
        }
      }
    },
    {
      "missionKey": "Smoke and Mirrors ↔ Surveil the Foe",
      "missionA": "Smoke and Mirrors",
      "missionB": "Surveil the Foe",
      "layout": "B",
      "page": 40,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.9,
          "y": 36.5
        },
        "Attacker Home": {
          "x": 50.2,
          "y": 7.6
        },
        "Central 1": {
          "x": 26.5,
          "y": 15.9
        },
        "Central 2": {
          "x": 33.2,
          "y": 27.9
        },
        "Expansion 1": {
          "x": 8.6,
          "y": 20
        },
        "Expansion 2": {
          "x": 51.4,
          "y": 24
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 60,
              "y": 12
            },
            {
              "x": 0,
              "y": 12
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 60,
              "y": 32
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 0,
              "y": 32
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 42.5,
              "y": 4
            },
            {
              "x": 54.1,
              "y": 4
            },
            {
              "x": 54.1,
              "y": 11.1
            },
            {
              "x": 42.5,
              "y": 11.1
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 20.9,
              "y": 21.1
            },
            {
              "x": 32.6,
              "y": 15.1
            },
            {
              "x": 32.6,
              "y": 13
            },
            {
              "x": 20.9,
              "y": 13
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 11.9,
              "y": 12.9
            },
            {
              "x": 2.9,
              "y": 20.3
            },
            {
              "x": 7.4,
              "y": 25.7
            },
            {
              "x": 16.4,
              "y": 18.4
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 5.9,
              "y": 40
            },
            {
              "x": 17.5,
              "y": 40
            },
            {
              "x": 17.5,
              "y": 33
            },
            {
              "x": 5.9,
              "y": 33
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 38.9,
              "y": 22.9
            },
            {
              "x": 27.3,
              "y": 28.9
            },
            {
              "x": 27.3,
              "y": 31
            },
            {
              "x": 38.9,
              "y": 31
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 40.3,
              "y": 37.1
            },
            {
              "x": 41.5,
              "y": 38.6
            },
            {
              "x": 46.4,
              "y": 35
            },
            {
              "x": 45.2,
              "y": 33.4
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 48.1,
              "y": 31.1
            },
            {
              "x": 57.1,
              "y": 23.7
            },
            {
              "x": 52.6,
              "y": 18.3
            },
            {
              "x": 43.6,
              "y": 25.6
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 36.2,
              "y": 36.4
            },
            {
              "x": 31.9,
              "y": 32.1
            },
            {
              "x": 29.1,
              "y": 34.8
            },
            {
              "x": 33.3,
              "y": 39.2
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 42.3,
              "y": 20.8
            },
            {
              "x": 42.8,
              "y": 21
            },
            {
              "x": 44.1,
              "y": 18.8
            },
            {
              "x": 35.4,
              "y": 13.8
            },
            {
              "x": 34.1,
              "y": 16
            },
            {
              "x": 40.5,
              "y": 19.7
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 22.9,
              "y": 36.4
            },
            {
              "x": 24,
              "y": 38.1
            },
            {
              "x": 29.1,
              "y": 34.8
            },
            {
              "x": 28,
              "y": 33.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 53.2,
              "y": 37.7
            },
            {
              "x": 49.6,
              "y": 32.8
            },
            {
              "x": 46.4,
              "y": 35.1
            },
            {
              "x": 49.9,
              "y": 40
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 17.7,
              "y": 23.3
            },
            {
              "x": 17.2,
              "y": 23
            },
            {
              "x": 15.9,
              "y": 25.3
            },
            {
              "x": 24.6,
              "y": 30.3
            },
            {
              "x": 25.9,
              "y": 28
            },
            {
              "x": 19.5,
              "y": 24.3
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 24,
              "y": 7.7
            },
            {
              "x": 28.2,
              "y": 12
            },
            {
              "x": 31,
              "y": 9.3
            },
            {
              "x": 26.8,
              "y": 4.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 37.3,
              "y": 7.7
            },
            {
              "x": 36.2,
              "y": 6
            },
            {
              "x": 31.1,
              "y": 9.3
            },
            {
              "x": 32.2,
              "y": 11
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 19.6,
              "y": 6.9
            },
            {
              "x": 18.4,
              "y": 5.4
            },
            {
              "x": 13.6,
              "y": 9.1
            },
            {
              "x": 14.8,
              "y": 10.6
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 6.8,
              "y": 6.3
            },
            {
              "x": 10.3,
              "y": 11.3
            },
            {
              "x": 13.6,
              "y": 8.9
            },
            {
              "x": 10,
              "y": 4
            }
          ]
        }
      }
    },
    {
      "missionKey": "Smoke and Mirrors ↔ Surveil the Foe",
      "missionA": "Smoke and Mirrors",
      "missionB": "Surveil the Foe",
      "layout": "C",
      "page": 41,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 14.9,
          "y": 37.4
        },
        "Attacker Home": {
          "x": 45.4,
          "y": 6.5
        },
        "Central 1": {
          "x": 34.4,
          "y": 20.2
        },
        "Central 2": {
          "x": 25.5,
          "y": 23.8
        },
        "Expansion 1": {
          "x": 9.1,
          "y": 12
        },
        "Expansion 2": {
          "x": 50.9,
          "y": 31.9
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 38.4,
              "y": 10.1
            },
            {
              "x": 50,
              "y": 10.1
            },
            {
              "x": 50,
              "y": 3
            },
            {
              "x": 38.4,
              "y": 3
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43,
              "y": 20.1
            },
            {
              "x": 45,
              "y": 20.1
            },
            {
              "x": 45,
              "y": 14
            },
            {
              "x": 43,
              "y": 14
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 54.5,
              "y": 22.7
            },
            {
              "x": 55.1,
              "y": 22.6
            },
            {
              "x": 55.1,
              "y": 20
            },
            {
              "x": 45,
              "y": 20
            },
            {
              "x": 45,
              "y": 22.6
            },
            {
              "x": 52.5,
              "y": 22.6
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 19.4,
              "y": 14.7
            },
            {
              "x": 23.1,
              "y": 9.9
            },
            {
              "x": 19.9,
              "y": 7.5
            },
            {
              "x": 16.2,
              "y": 12.3
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 40.1,
              "y": 25.7
            },
            {
              "x": 34,
              "y": 14.1
            },
            {
              "x": 32,
              "y": 14.1
            },
            {
              "x": 32,
              "y": 25.7
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 2.6,
              "y": 11
            },
            {
              "x": 11.9,
              "y": 17.9
            },
            {
              "x": 16.2,
              "y": 12.3
            },
            {
              "x": 6.9,
              "y": 5.3
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 21.6,
              "y": 33.9
            },
            {
              "x": 10,
              "y": 33.9
            },
            {
              "x": 10,
              "y": 40.9
            },
            {
              "x": 21.6,
              "y": 40.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 16.8,
              "y": 23.9
            },
            {
              "x": 14.9,
              "y": 23.9
            },
            {
              "x": 14.9,
              "y": 30
            },
            {
              "x": 16.8,
              "y": 30
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 5.3,
              "y": 21.3
            },
            {
              "x": 4.8,
              "y": 21.3
            },
            {
              "x": 4.8,
              "y": 23.9
            },
            {
              "x": 14.8,
              "y": 23.9
            },
            {
              "x": 14.8,
              "y": 21.3
            },
            {
              "x": 7.4,
              "y": 21.3
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 33,
              "y": 33
            },
            {
              "x": 26.9,
              "y": 33
            },
            {
              "x": 26.9,
              "y": 37
            },
            {
              "x": 33,
              "y": 37
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 19.9,
              "y": 18.3
            },
            {
              "x": 25.9,
              "y": 29.8
            },
            {
              "x": 28,
              "y": 29.8
            },
            {
              "x": 28,
              "y": 18.3
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 35,
              "y": 35
            },
            {
              "x": 33,
              "y": 35
            },
            {
              "x": 33,
              "y": 41
            },
            {
              "x": 35,
              "y": 41
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 27,
              "y": 10.9
            },
            {
              "x": 33,
              "y": 10.9
            },
            {
              "x": 33,
              "y": 6.9
            },
            {
              "x": 27,
              "y": 6.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 25,
              "y": 9.1
            },
            {
              "x": 27,
              "y": 9.1
            },
            {
              "x": 27,
              "y": 3
            },
            {
              "x": 25,
              "y": 3
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 57.3,
              "y": 32.9
            },
            {
              "x": 48,
              "y": 25.9
            },
            {
              "x": 43.8,
              "y": 31.6
            },
            {
              "x": 53.1,
              "y": 38.6
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 40.5,
              "y": 29.1
            },
            {
              "x": 36.9,
              "y": 33.9
            },
            {
              "x": 40,
              "y": 36.3
            },
            {
              "x": 43.7,
              "y": 31.5
            }
          ]
        }
      }
    },
    {
      "missionKey": "Extract Relic ↔ Locate and Deny",
      "missionA": "Extract Relic",
      "missionB": "Locate and Deny",
      "layout": "A",
      "page": 42,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 7.7,
          "y": 36.4
        },
        "Attacker Home": {
          "x": 52.2,
          "y": 7.7
        },
        "Central 1": {
          "x": 30,
          "y": 19
        },
        "Expansion 1": {
          "x": 11.4,
          "y": 13.3
        },
        "Expansion 2": {
          "x": 48.5,
          "y": 30.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 43.5,
              "y": 26.9
            },
            {
              "x": 55.1,
              "y": 26.9
            },
            {
              "x": 55.1,
              "y": 34
            },
            {
              "x": 43.5,
              "y": 34
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 44.5,
              "y": 11
            },
            {
              "x": 56.1,
              "y": 11
            },
            {
              "x": 56.1,
              "y": 4
            },
            {
              "x": 44.5,
              "y": 4
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 19.5,
              "y": 7.5
            },
            {
              "x": 20,
              "y": 7.5
            },
            {
              "x": 20,
              "y": 4.9
            },
            {
              "x": 9.9,
              "y": 4.9
            },
            {
              "x": 9.9,
              "y": 7.5
            },
            {
              "x": 17.4,
              "y": 7.5
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 13.8,
              "y": 21
            },
            {
              "x": 14.9,
              "y": 22.6
            },
            {
              "x": 9.9,
              "y": 26.1
            },
            {
              "x": 8.8,
              "y": 24.4
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 46.2,
              "y": 22.9
            },
            {
              "x": 45,
              "y": 21.3
            },
            {
              "x": 50,
              "y": 17.8
            },
            {
              "x": 51.2,
              "y": 19.5
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 43.6,
              "y": 22
            },
            {
              "x": 40.2,
              "y": 17
            },
            {
              "x": 43.5,
              "y": 14.8
            },
            {
              "x": 46.9,
              "y": 19.8
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 16.4,
              "y": 17
            },
            {
              "x": 4.8,
              "y": 17
            },
            {
              "x": 4.8,
              "y": 10
            },
            {
              "x": 16.4,
              "y": 10
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 15.5,
              "y": 33
            },
            {
              "x": 3.8,
              "y": 33
            },
            {
              "x": 3.8,
              "y": 40
            },
            {
              "x": 15.5,
              "y": 40
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 29,
              "y": 14
            },
            {
              "x": 29,
              "y": 12
            },
            {
              "x": 22.9,
              "y": 12
            },
            {
              "x": 22.9,
              "y": 14
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 16.3,
              "y": 21.9
            },
            {
              "x": 19.7,
              "y": 26.9
            },
            {
              "x": 16.4,
              "y": 29.1
            },
            {
              "x": 13,
              "y": 24.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 26,
              "y": 19
            },
            {
              "x": 26,
              "y": 25.1
            },
            {
              "x": 30,
              "y": 25.1
            },
            {
              "x": 30,
              "y": 19
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 18.9,
              "y": 35.2
            },
            {
              "x": 31.1,
              "y": 40
            },
            {
              "x": 32.7,
              "y": 38.7
            },
            {
              "x": 25.1,
              "y": 29.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 34.1,
              "y": 25.1
            },
            {
              "x": 34.1,
              "y": 19
            },
            {
              "x": 30.1,
              "y": 19
            },
            {
              "x": 30.1,
              "y": 25.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 31,
              "y": 29.9
            },
            {
              "x": 31,
              "y": 31.9
            },
            {
              "x": 37,
              "y": 31.9
            },
            {
              "x": 37,
              "y": 29.9
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 41.2,
              "y": 8.8
            },
            {
              "x": 29,
              "y": 4
            },
            {
              "x": 27.4,
              "y": 5.3
            },
            {
              "x": 35,
              "y": 14.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 40.5,
              "y": 36.5
            },
            {
              "x": 39.9,
              "y": 36.5
            },
            {
              "x": 39.9,
              "y": 39.1
            },
            {
              "x": 50,
              "y": 39.1
            },
            {
              "x": 50,
              "y": 36.5
            },
            {
              "x": 42.5,
              "y": 36.5
            }
          ]
        }
      }
    },
    {
      "missionKey": "Extract Relic ↔ Locate and Deny",
      "missionA": "Extract Relic",
      "missionB": "Locate and Deny",
      "layout": "B",
      "page": 43,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 12.6,
          "y": 26.6
        },
        "Attacker Home": {
          "x": 48.1,
          "y": 17.7
        },
        "Central 1": {
          "x": 32.7,
          "y": 22.1
        },
        "Expansion 1": {
          "x": 19.1,
          "y": 7.6
        },
        "Expansion 2": {
          "x": 40.8,
          "y": 36.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 41.8,
              "y": 21.1
            },
            {
              "x": 53.5,
              "y": 21.1
            },
            {
              "x": 53.5,
              "y": 14.1
            },
            {
              "x": 41.8,
              "y": 14.1
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 20.1,
              "y": 31.1
            },
            {
              "x": 29.2,
              "y": 40.5
            },
            {
              "x": 31.2,
              "y": 40
            },
            {
              "x": 27.9,
              "y": 28.8
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 14,
              "y": 4
            },
            {
              "x": 25.7,
              "y": 4
            },
            {
              "x": 25.7,
              "y": 11.1
            },
            {
              "x": 14,
              "y": 11.1
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 18.5,
              "y": 23
            },
            {
              "x": 6.8,
              "y": 23
            },
            {
              "x": 6.8,
              "y": 30
            },
            {
              "x": 18.5,
              "y": 30
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 14.9,
              "y": 41
            },
            {
              "x": 12.9,
              "y": 41
            },
            {
              "x": 12.9,
              "y": 34.9
            },
            {
              "x": 14.9,
              "y": 34.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 11.4,
              "y": 9.5
            },
            {
              "x": 11.4,
              "y": 8.9
            },
            {
              "x": 8.8,
              "y": 8.9
            },
            {
              "x": 8.8,
              "y": 19
            },
            {
              "x": 11.4,
              "y": 19
            },
            {
              "x": 11.4,
              "y": 11.5
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 33.1,
              "y": 26.1
            },
            {
              "x": 27,
              "y": 26.1
            },
            {
              "x": 27,
              "y": 22.1
            },
            {
              "x": 33.1,
              "y": 22.1
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 27,
              "y": 18
            },
            {
              "x": 33.1,
              "y": 18
            },
            {
              "x": 33.1,
              "y": 22
            },
            {
              "x": 27,
              "y": 22
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 24.7,
              "y": 22.8
            },
            {
              "x": 22.9,
              "y": 17
            },
            {
              "x": 19.1,
              "y": 18.2
            },
            {
              "x": 20.9,
              "y": 24
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 6.9,
              "y": 32.9
            },
            {
              "x": 6.9,
              "y": 34.9
            },
            {
              "x": 12.9,
              "y": 34.9
            },
            {
              "x": 12.9,
              "y": 32.9
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 47,
              "y": 3
            },
            {
              "x": 45.1,
              "y": 3
            },
            {
              "x": 45.1,
              "y": 9.1
            },
            {
              "x": 47,
              "y": 9.1
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 53.1,
              "y": 11.1
            },
            {
              "x": 53.1,
              "y": 9.1
            },
            {
              "x": 47,
              "y": 9.1
            },
            {
              "x": 47,
              "y": 11.1
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 39.8,
              "y": 12.7
            },
            {
              "x": 30.8,
              "y": 3.3
            },
            {
              "x": 28.8,
              "y": 3.8
            },
            {
              "x": 32,
              "y": 15
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 34.4,
              "y": 33
            },
            {
              "x": 46.1,
              "y": 33
            },
            {
              "x": 46.1,
              "y": 40
            },
            {
              "x": 34.4,
              "y": 40
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 48.4,
              "y": 34.3
            },
            {
              "x": 48.4,
              "y": 34.9
            },
            {
              "x": 51,
              "y": 34.9
            },
            {
              "x": 51,
              "y": 24.9
            },
            {
              "x": 48.4,
              "y": 24.9
            },
            {
              "x": 48.4,
              "y": 32.3
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 35.2,
              "y": 21.2
            },
            {
              "x": 37.1,
              "y": 27
            },
            {
              "x": 40.9,
              "y": 25.7
            },
            {
              "x": 39,
              "y": 20
            }
          ]
        }
      }
    },
    {
      "missionKey": "Extract Relic ↔ Locate and Deny",
      "missionA": "Extract Relic",
      "missionB": "Locate and Deny",
      "layout": "C",
      "page": 44,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.3,
          "y": 36.3
        },
        "Attacker Home": {
          "x": 49.9,
          "y": 8.4
        },
        "Central 1": {
          "x": 33.4,
          "y": 21.9
        },
        "Expansion 1": {
          "x": 12.2,
          "y": 11.2
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 39,
              "y": 22
            },
            {
              "x": 60,
              "y": 22
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 30,
              "y": 13
            },
            {
              "x": 31.8,
              "y": 13.2
            },
            {
              "x": 33.5,
              "y": 13.7
            },
            {
              "x": 35,
              "y": 14.5
            },
            {
              "x": 36.4,
              "y": 15.6
            },
            {
              "x": 37.5,
              "y": 17
            },
            {
              "x": 38.3,
              "y": 18.5
            },
            {
              "x": 38.8,
              "y": 20.2
            },
            {
              "x": 39,
              "y": 22
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 30,
              "y": 31
            },
            {
              "x": 28.2,
              "y": 30.8
            },
            {
              "x": 26.5,
              "y": 30.3
            },
            {
              "x": 24.9,
              "y": 29.5
            },
            {
              "x": 23.6,
              "y": 28.4
            },
            {
              "x": 22.5,
              "y": 27
            },
            {
              "x": 21.7,
              "y": 25.5
            },
            {
              "x": 21.1,
              "y": 23.8
            },
            {
              "x": 21,
              "y": 22
            },
            {
              "x": 0,
              "y": 22
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 56,
              "y": 5
            },
            {
              "x": 44.3,
              "y": 5
            },
            {
              "x": 44.3,
              "y": 12.1
            },
            {
              "x": 56,
              "y": 12.1
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 16,
              "y": 27
            },
            {
              "x": 14,
              "y": 27
            },
            {
              "x": 14,
              "y": 21
            },
            {
              "x": 16,
              "y": 21
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 4.4,
              "y": 18.3
            },
            {
              "x": 3.9,
              "y": 18.3
            },
            {
              "x": 3.9,
              "y": 20.9
            },
            {
              "x": 13.9,
              "y": 20.9
            },
            {
              "x": 13.9,
              "y": 18.3
            },
            {
              "x": 6.5,
              "y": 18.3
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 33,
              "y": 18
            },
            {
              "x": 27,
              "y": 18
            },
            {
              "x": 27,
              "y": 22
            },
            {
              "x": 33,
              "y": 22
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 39,
              "y": 33
            },
            {
              "x": 37,
              "y": 33
            },
            {
              "x": 37,
              "y": 39
            },
            {
              "x": 39,
              "y": 39
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 37,
              "y": 31
            },
            {
              "x": 31,
              "y": 31
            },
            {
              "x": 31,
              "y": 35
            },
            {
              "x": 37,
              "y": 35
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 20.9,
              "y": 11.1
            },
            {
              "x": 22.9,
              "y": 11.1
            },
            {
              "x": 22.9,
              "y": 5.1
            },
            {
              "x": 20.9,
              "y": 5.1
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 22.9,
              "y": 13
            },
            {
              "x": 29,
              "y": 13
            },
            {
              "x": 29,
              "y": 9
            },
            {
              "x": 22.9,
              "y": 9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 18.8,
              "y": 9.2
            },
            {
              "x": 7.6,
              "y": 6
            },
            {
              "x": 5.7,
              "y": 12.8
            },
            {
              "x": 16.8,
              "y": 16
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 4,
              "y": 39
            },
            {
              "x": 15.6,
              "y": 39
            },
            {
              "x": 15.6,
              "y": 32
            },
            {
              "x": 4,
              "y": 32
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 24,
              "y": 39.1
            },
            {
              "x": 17.7,
              "y": 27.6
            },
            {
              "x": 18.9,
              "y": 25.9
            },
            {
              "x": 28.5,
              "y": 32.4
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 36,
              "y": 5
            },
            {
              "x": 42.2,
              "y": 16.5
            },
            {
              "x": 41,
              "y": 18.2
            },
            {
              "x": 31.4,
              "y": 11.7
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 44,
              "y": 16.9
            },
            {
              "x": 46,
              "y": 16.9
            },
            {
              "x": 46,
              "y": 22.9
            },
            {
              "x": 44,
              "y": 22.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 55.6,
              "y": 25.6
            },
            {
              "x": 56.1,
              "y": 25.6
            },
            {
              "x": 56.1,
              "y": 23
            },
            {
              "x": 46.1,
              "y": 23
            },
            {
              "x": 46.1,
              "y": 25.6
            },
            {
              "x": 53.5,
              "y": 25.6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 41.1,
              "y": 34.8
            },
            {
              "x": 52.3,
              "y": 38
            },
            {
              "x": 54.2,
              "y": 31.3
            },
            {
              "x": 43.1,
              "y": 28.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 26.9,
              "y": 26
            },
            {
              "x": 33,
              "y": 26
            },
            {
              "x": 33,
              "y": 22.1
            },
            {
              "x": 26.9,
              "y": 22.1
            }
          ]
        }
      }
    },
    {
      "missionKey": "Gather Intel ↔ Gather Intel",
      "missionA": "Gather Intel",
      "missionB": "Gather Intel",
      "layout": "A",
      "page": 45,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.5,
          "y": 36
        },
        "Attacker Home": {
          "x": 51.6,
          "y": 8.5
        },
        "Central 1": {
          "x": 28.9,
          "y": 17.7
        },
        "Central 2": {
          "x": 32.2,
          "y": 26.6
        },
        "Expansion 1": {
          "x": 9,
          "y": 16.6
        },
        "Expansion 2": {
          "x": 52,
          "y": 27.5
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 10.4
            },
            {
              "x": 4.9,
              "y": 10.4
            },
            {
              "x": 4.9,
              "y": 22
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 43.5,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 12
            },
            {
              "x": 55.1,
              "y": 5
            },
            {
              "x": 43.5,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 29.6,
              "y": 6.3
            },
            {
              "x": 28.1,
              "y": 5
            },
            {
              "x": 24.3,
              "y": 9.8
            },
            {
              "x": 25.8,
              "y": 11
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 41.9,
              "y": 14.2
            },
            {
              "x": 42.4,
              "y": 14.4
            },
            {
              "x": 43.4,
              "y": 12.1
            },
            {
              "x": 34.2,
              "y": 8
            },
            {
              "x": 33.2,
              "y": 10.4
            },
            {
              "x": 40,
              "y": 13.4
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 7.8,
              "y": 8
            },
            {
              "x": 13.9,
              "y": 8
            },
            {
              "x": 13.9,
              "y": 4
            },
            {
              "x": 7.8,
              "y": 4
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 23,
              "y": 23.2
            },
            {
              "x": 34.6,
              "y": 17.1
            },
            {
              "x": 34.6,
              "y": 15.1
            },
            {
              "x": 23,
              "y": 15.1
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 23,
              "y": 11.2
            },
            {
              "x": 24.3,
              "y": 9.7
            },
            {
              "x": 19.5,
              "y": 5.9
            },
            {
              "x": 18.3,
              "y": 7.5
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 45.9,
              "y": 36
            },
            {
              "x": 52,
              "y": 36
            },
            {
              "x": 52,
              "y": 40
            },
            {
              "x": 45.9,
              "y": 40
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 30.4,
              "y": 37.8
            },
            {
              "x": 32,
              "y": 39
            },
            {
              "x": 35.8,
              "y": 34.3
            },
            {
              "x": 34.2,
              "y": 33.1
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 37,
              "y": 32.8
            },
            {
              "x": 35.8,
              "y": 34.4
            },
            {
              "x": 40.5,
              "y": 38.2
            },
            {
              "x": 41.8,
              "y": 36.6
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 48.1,
              "y": 22
            },
            {
              "x": 48.1,
              "y": 33.6
            },
            {
              "x": 55.2,
              "y": 33.6
            },
            {
              "x": 55.2,
              "y": 22
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 16.4,
              "y": 32
            },
            {
              "x": 4.8,
              "y": 32
            },
            {
              "x": 4.8,
              "y": 39
            },
            {
              "x": 16.4,
              "y": 39
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 48.1,
              "y": 18.1
            },
            {
              "x": 42,
              "y": 18.1
            },
            {
              "x": 42,
              "y": 22.1
            },
            {
              "x": 48.1,
              "y": 22.1
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 37.6,
              "y": 20.9
            },
            {
              "x": 26,
              "y": 27
            },
            {
              "x": 26,
              "y": 29
            },
            {
              "x": 37.6,
              "y": 29
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 18,
              "y": 29.7
            },
            {
              "x": 17.5,
              "y": 29.5
            },
            {
              "x": 16.4,
              "y": 31.8
            },
            {
              "x": 25.5,
              "y": 36.2
            },
            {
              "x": 26.6,
              "y": 33.8
            },
            {
              "x": 19.9,
              "y": 30.6
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 11.9,
              "y": 26
            },
            {
              "x": 18,
              "y": 26
            },
            {
              "x": 18,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            }
          ]
        }
      }
    },
    {
      "missionKey": "Gather Intel ↔ Gather Intel",
      "missionA": "Gather Intel",
      "missionB": "Gather Intel",
      "layout": "B",
      "page": 46,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.2,
          "y": 32.5
        },
        "Attacker Home": {
          "x": 51.1,
          "y": 12.7
        },
        "Central 1": {
          "x": 26.2,
          "y": 20.5
        },
        "Central 2": {
          "x": 33.9,
          "y": 23.5
        },
        "Expansion 1": {
          "x": 12.1,
          "y": 10.1
        },
        "Expansion 2": {
          "x": 47.6,
          "y": 34
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 44.2,
              "y": 9
            },
            {
              "x": 50.9,
              "y": 18.5
            },
            {
              "x": 56.7,
              "y": 14.4
            },
            {
              "x": 50,
              "y": 4.9
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 53.1,
              "y": 36.1
            },
            {
              "x": 46.5,
              "y": 26.6
            },
            {
              "x": 40.7,
              "y": 30.6
            },
            {
              "x": 47.4,
              "y": 40.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 37,
              "y": 33
            },
            {
              "x": 35,
              "y": 33
            },
            {
              "x": 35,
              "y": 39
            },
            {
              "x": 37,
              "y": 39
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 22.5,
              "y": 30.5
            },
            {
              "x": 22.5,
              "y": 30
            },
            {
              "x": 19.9,
              "y": 30
            },
            {
              "x": 19.9,
              "y": 40
            },
            {
              "x": 22.5,
              "y": 40
            },
            {
              "x": 22.5,
              "y": 32.6
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 35,
              "y": 31
            },
            {
              "x": 28.9,
              "y": 31
            },
            {
              "x": 28.9,
              "y": 35
            },
            {
              "x": 35,
              "y": 35
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 35.9,
              "y": 16
            },
            {
              "x": 29,
              "y": 27.2
            },
            {
              "x": 30.1,
              "y": 28.9
            },
            {
              "x": 40.1,
              "y": 23
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 22.6,
              "y": 27.9
            },
            {
              "x": 22.6,
              "y": 29.9
            },
            {
              "x": 16.5,
              "y": 29.9
            },
            {
              "x": 16.5,
              "y": 27.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 6.8,
              "y": 7.9
            },
            {
              "x": 13.5,
              "y": 17.4
            },
            {
              "x": 19.3,
              "y": 13.4
            },
            {
              "x": 12.6,
              "y": 3.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 23.9,
              "y": 27.9
            },
            {
              "x": 31,
              "y": 16.8
            },
            {
              "x": 29.9,
              "y": 15.1
            },
            {
              "x": 19.9,
              "y": 20.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 15.8,
              "y": 35
            },
            {
              "x": 9.2,
              "y": 25.5
            },
            {
              "x": 3.4,
              "y": 29.5
            },
            {
              "x": 10,
              "y": 39
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 23,
              "y": 11
            },
            {
              "x": 25,
              "y": 11
            },
            {
              "x": 25,
              "y": 4.9
            },
            {
              "x": 23,
              "y": 4.9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 25,
              "y": 12.8
            },
            {
              "x": 31.1,
              "y": 12.8
            },
            {
              "x": 31.1,
              "y": 8.9
            },
            {
              "x": 25,
              "y": 8.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 50.6,
              "y": 26.2
            },
            {
              "x": 49.9,
              "y": 20.2
            },
            {
              "x": 45.9,
              "y": 20.6
            },
            {
              "x": 46.6,
              "y": 26.6
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 37.2,
              "y": 13.4
            },
            {
              "x": 37.3,
              "y": 14
            },
            {
              "x": 39.9,
              "y": 14
            },
            {
              "x": 39.9,
              "y": 4
            },
            {
              "x": 37.3,
              "y": 4
            },
            {
              "x": 37.3,
              "y": 11.4
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 37.2,
              "y": 16
            },
            {
              "x": 37.2,
              "y": 14.1
            },
            {
              "x": 43.3,
              "y": 14.1
            },
            {
              "x": 43.3,
              "y": 16
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 9.4,
              "y": 17.7
            },
            {
              "x": 9.9,
              "y": 23.7
            },
            {
              "x": 13.8,
              "y": 23.5
            },
            {
              "x": 13.4,
              "y": 17.4
            }
          ]
        }
      }
    },
    {
      "missionKey": "Gather Intel ↔ Gather Intel",
      "missionA": "Gather Intel",
      "missionB": "Gather Intel",
      "layout": "C",
      "page": 47,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.7,
          "y": 32.7
        },
        "Attacker Home": {
          "x": 51.5,
          "y": 12.1
        },
        "Central 1": {
          "x": 26,
          "y": 21
        },
        "Central 2": {
          "x": 34.1,
          "y": 23.6
        },
        "Expansion 1": {
          "x": 17.5,
          "y": 9
        },
        "Expansion 2": {
          "x": 42.5,
          "y": 35.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0.1
            },
            {
              "x": 40.1,
              "y": 0.1
            },
            {
              "x": 40.1,
              "y": 22.1
            },
            {
              "x": 48.1,
              "y": 22.1
            },
            {
              "x": 48.1,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22.1
            },
            {
              "x": 11.9,
              "y": 22.1
            },
            {
              "x": 11.9,
              "y": 0.1
            },
            {
              "x": 0,
              "y": 0.1
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 55.1,
              "y": 17.7
            },
            {
              "x": 55.1,
              "y": 6.1
            },
            {
              "x": 48.1,
              "y": 6.1
            },
            {
              "x": 48.1,
              "y": 17.7
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 46.1,
              "y": 40.1
            },
            {
              "x": 46.1,
              "y": 28.5
            },
            {
              "x": 39,
              "y": 28.5
            },
            {
              "x": 39,
              "y": 40.1
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 11.9,
              "y": 20.1
            },
            {
              "x": 11.9,
              "y": 14
            },
            {
              "x": 7.9,
              "y": 14
            },
            {
              "x": 7.9,
              "y": 20.1
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 31,
              "y": 31.2
            },
            {
              "x": 25,
              "y": 31.2
            },
            {
              "x": 25,
              "y": 35.1
            },
            {
              "x": 31,
              "y": 35.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 30.1,
              "y": 16.2
            },
            {
              "x": 33.2,
              "y": 28.9
            },
            {
              "x": 35.2,
              "y": 29.4
            },
            {
              "x": 38,
              "y": 18.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 29.8,
              "y": 28.2
            },
            {
              "x": 26.9,
              "y": 15.4
            },
            {
              "x": 24.9,
              "y": 14.9
            },
            {
              "x": 21.9,
              "y": 26.1
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 48.1,
              "y": 24
            },
            {
              "x": 48.1,
              "y": 30.1
            },
            {
              "x": 52.1,
              "y": 30.1
            },
            {
              "x": 52.1,
              "y": 24
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 29,
              "y": 12.9
            },
            {
              "x": 35,
              "y": 12.9
            },
            {
              "x": 35,
              "y": 9
            },
            {
              "x": 29,
              "y": 9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 28.9,
              "y": 5.1
            },
            {
              "x": 26.9,
              "y": 5.1
            },
            {
              "x": 26.9,
              "y": 11.2
            },
            {
              "x": 28.9,
              "y": 11.2
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 13.9,
              "y": 4.1
            },
            {
              "x": 13.9,
              "y": 15.7
            },
            {
              "x": 21,
              "y": 15.7
            },
            {
              "x": 21,
              "y": 4.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 14.5,
              "y": 22.2
            },
            {
              "x": 13.5,
              "y": 23.9
            },
            {
              "x": 18.8,
              "y": 26.9
            },
            {
              "x": 19.8,
              "y": 25.2
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 4.9,
              "y": 26.5
            },
            {
              "x": 4.9,
              "y": 38.1
            },
            {
              "x": 12,
              "y": 38.1
            },
            {
              "x": 12,
              "y": 26.5
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 21,
              "y": 28.6
            },
            {
              "x": 21.2,
              "y": 28.1
            },
            {
              "x": 18.9,
              "y": 27
            },
            {
              "x": 14.6,
              "y": 36.1
            },
            {
              "x": 17,
              "y": 37.2
            },
            {
              "x": 20.1,
              "y": 30.4
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 38.9,
              "y": 15.6
            },
            {
              "x": 38.7,
              "y": 16.1
            },
            {
              "x": 41,
              "y": 17.2
            },
            {
              "x": 45.3,
              "y": 8.1
            },
            {
              "x": 42.9,
              "y": 7
            },
            {
              "x": 39.8,
              "y": 13.7
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 45.4,
              "y": 22
            },
            {
              "x": 46.4,
              "y": 20.3
            },
            {
              "x": 41.1,
              "y": 17.3
            },
            {
              "x": 40.1,
              "y": 19
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 31.1,
              "y": 39.1
            },
            {
              "x": 33.1,
              "y": 39.1
            },
            {
              "x": 33.1,
              "y": 33
            },
            {
              "x": 31.1,
              "y": 33
            }
          ]
        }
      }
    },
    {
      "missionKey": "Vanguard Operation ↔ Search and Scour",
      "missionA": "Vanguard Operation",
      "missionB": "Search and Scour",
      "layout": "A",
      "page": 48,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.5,
          "y": 34.2
        },
        "Attacker Home": {
          "x": 50.3,
          "y": 10.4
        },
        "Central 1": {
          "x": 31,
          "y": 21
        },
        "Expansion 1": {
          "x": 12,
          "y": 10.4
        },
        "Expansion 2": {
          "x": 47.9,
          "y": 33.7
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 41.5,
              "y": 30.5
            },
            {
              "x": 48,
              "y": 40.1
            },
            {
              "x": 53.9,
              "y": 36.1
            },
            {
              "x": 47.4,
              "y": 26.5
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 44.5,
              "y": 14
            },
            {
              "x": 56.1,
              "y": 14
            },
            {
              "x": 56.1,
              "y": 7
            },
            {
              "x": 44.5,
              "y": 7
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 36.1,
              "y": 11.6
            },
            {
              "x": 36.1,
              "y": 12.1
            },
            {
              "x": 38.7,
              "y": 12.1
            },
            {
              "x": 38.7,
              "y": 2.1
            },
            {
              "x": 36.1,
              "y": 2.1
            },
            {
              "x": 36.1,
              "y": 9.5
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 36.1,
              "y": 14.1
            },
            {
              "x": 36.1,
              "y": 12.2
            },
            {
              "x": 42.2,
              "y": 12.2
            },
            {
              "x": 42.2,
              "y": 14.1
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 18.5,
              "y": 13.6
            },
            {
              "x": 12,
              "y": 4
            },
            {
              "x": 6.1,
              "y": 7.9
            },
            {
              "x": 12.6,
              "y": 17.6
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 15.6,
              "y": 30
            },
            {
              "x": 4,
              "y": 30
            },
            {
              "x": 4,
              "y": 37
            },
            {
              "x": 15.6,
              "y": 37
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 23,
              "y": 12
            },
            {
              "x": 25,
              "y": 12
            },
            {
              "x": 25,
              "y": 6
            },
            {
              "x": 23,
              "y": 6
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 34.8,
              "y": 29.9
            },
            {
              "x": 28.8,
              "y": 29.9
            },
            {
              "x": 28.8,
              "y": 33.9
            },
            {
              "x": 34.8,
              "y": 33.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 24.2,
              "y": 25
            },
            {
              "x": 24.2,
              "y": 27.1
            },
            {
              "x": 35.8,
              "y": 27.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 23.9,
              "y": 32.6
            },
            {
              "x": 23.9,
              "y": 32
            },
            {
              "x": 21.3,
              "y": 32
            },
            {
              "x": 21.3,
              "y": 42.1
            },
            {
              "x": 23.9,
              "y": 42.1
            },
            {
              "x": 23.9,
              "y": 34.6
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 23.9,
              "y": 29.9
            },
            {
              "x": 23.9,
              "y": 31.9
            },
            {
              "x": 17.9,
              "y": 31.9
            },
            {
              "x": 17.9,
              "y": 29.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 25,
              "y": 13.9
            },
            {
              "x": 31.1,
              "y": 13.9
            },
            {
              "x": 31.1,
              "y": 9.9
            },
            {
              "x": 25,
              "y": 9.9
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 36.9,
              "y": 31.9
            },
            {
              "x": 34.9,
              "y": 31.9
            },
            {
              "x": 34.9,
              "y": 38
            },
            {
              "x": 36.9,
              "y": 38
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 16.1,
              "y": 22.5
            },
            {
              "x": 12.6,
              "y": 17.6
            },
            {
              "x": 9.4,
              "y": 19.9
            },
            {
              "x": 12.9,
              "y": 24.8
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 43.8,
              "y": 21.6
            },
            {
              "x": 47.4,
              "y": 26.5
            },
            {
              "x": 50.6,
              "y": 24.1
            },
            {
              "x": 47.1,
              "y": 19.2
            }
          ]
        }
      }
    },
    {
      "missionKey": "Vanguard Operation ↔ Search and Scour",
      "missionA": "Vanguard Operation",
      "missionB": "Search and Scour",
      "layout": "B",
      "page": 49,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.4,
          "y": 32.8
        },
        "Attacker Home": {
          "x": 50,
          "y": 11.4
        },
        "Central 1": {
          "x": 32.1,
          "y": 22
        },
        "Expansion 1": {
          "x": 16.4,
          "y": 10.7
        },
        "Expansion 2": {
          "x": 44.6,
          "y": 31.6
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 39.9,
              "y": 27.4
            },
            {
              "x": 39.9,
              "y": 39
            },
            {
              "x": 46.9,
              "y": 39
            },
            {
              "x": 46.9,
              "y": 27.4
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 53.1,
              "y": 17.6
            },
            {
              "x": 53.1,
              "y": 6
            },
            {
              "x": 46,
              "y": 6
            },
            {
              "x": 46,
              "y": 17.6
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 10.9,
              "y": 18.9
            },
            {
              "x": 10.9,
              "y": 12.9
            },
            {
              "x": 6.9,
              "y": 12.9
            },
            {
              "x": 6.9,
              "y": 18.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 26.9,
              "y": 16.2
            },
            {
              "x": 33,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 27.8
            },
            {
              "x": 35,
              "y": 16.2
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 49.1,
              "y": 24.9
            },
            {
              "x": 49.1,
              "y": 31
            },
            {
              "x": 53.1,
              "y": 31
            },
            {
              "x": 53.1,
              "y": 24.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 32.9,
              "y": 33
            },
            {
              "x": 30.9,
              "y": 33
            },
            {
              "x": 30.9,
              "y": 39.1
            },
            {
              "x": 32.9,
              "y": 39.1
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 33.1,
              "y": 27.8
            },
            {
              "x": 27,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 16.2
            },
            {
              "x": 24.9,
              "y": 27.8
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 30.9,
              "y": 31
            },
            {
              "x": 24.9,
              "y": 31
            },
            {
              "x": 24.9,
              "y": 35
            },
            {
              "x": 30.9,
              "y": 35
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 26.8,
              "y": 11
            },
            {
              "x": 28.8,
              "y": 11
            },
            {
              "x": 28.8,
              "y": 5
            },
            {
              "x": 26.8,
              "y": 5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 28.8,
              "y": 12.9
            },
            {
              "x": 34.9,
              "y": 12.9
            },
            {
              "x": 34.9,
              "y": 9
            },
            {
              "x": 28.8,
              "y": 9
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 42.4,
              "y": 13.2
            },
            {
              "x": 42.5,
              "y": 13.7
            },
            {
              "x": 40,
              "y": 14.4
            },
            {
              "x": 37.5,
              "y": 4.6
            },
            {
              "x": 40,
              "y": 4
            },
            {
              "x": 41.8,
              "y": 11.2
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 20,
              "y": 16.6
            },
            {
              "x": 20,
              "y": 5
            },
            {
              "x": 12.9,
              "y": 5
            },
            {
              "x": 12.9,
              "y": 16.6
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 6.9,
              "y": 26.5
            },
            {
              "x": 6.9,
              "y": 38.1
            },
            {
              "x": 13.9,
              "y": 38.1
            },
            {
              "x": 13.9,
              "y": 26.5
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 17.5,
              "y": 30.9
            },
            {
              "x": 17.4,
              "y": 30.4
            },
            {
              "x": 19.9,
              "y": 29.7
            },
            {
              "x": 22.4,
              "y": 39.4
            },
            {
              "x": 19.9,
              "y": 40.1
            },
            {
              "x": 18,
              "y": 32.9
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 15.9,
              "y": 26.4
            },
            {
              "x": 13.9,
              "y": 26.4
            },
            {
              "x": 13.9,
              "y": 20.4
            },
            {
              "x": 15.9,
              "y": 20.4
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 44,
              "y": 17.6
            },
            {
              "x": 46,
              "y": 17.6
            },
            {
              "x": 46,
              "y": 23.6
            },
            {
              "x": 44,
              "y": 23.6
            }
          ]
        }
      }
    },
    {
      "missionKey": "Vanguard Operation ↔ Search and Scour",
      "missionA": "Vanguard Operation",
      "missionB": "Search and Scour",
      "layout": "C",
      "page": 50,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10,
          "y": 35.5
        },
        "Attacker Home": {
          "x": 49.1,
          "y": 8.1
        },
        "Central 1": {
          "x": 31.8,
          "y": 21.4
        },
        "Expansion 1": {
          "x": 10,
          "y": 12.6
        },
        "Expansion 2": {
          "x": 50,
          "y": 31.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 3.9,
              "y": 16
            },
            {
              "x": 15.5,
              "y": 16
            },
            {
              "x": 15.5,
              "y": 9
            },
            {
              "x": 3.9,
              "y": 9
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 42.5,
              "y": 12
            },
            {
              "x": 54.1,
              "y": 12
            },
            {
              "x": 54.1,
              "y": 5
            },
            {
              "x": 42.5,
              "y": 5
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 35,
              "y": 11.1
            },
            {
              "x": 33.5,
              "y": 9.7
            },
            {
              "x": 37.8,
              "y": 5.4
            },
            {
              "x": 39.2,
              "y": 6.8
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 32.7,
              "y": 12.6
            },
            {
              "x": 33.1,
              "y": 12.9
            },
            {
              "x": 34.9,
              "y": 11.1
            },
            {
              "x": 27.8,
              "y": 4
            },
            {
              "x": 25.9,
              "y": 5.8
            },
            {
              "x": 31.2,
              "y": 11.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 14.9,
              "y": 20.2
            },
            {
              "x": 18.8,
              "y": 24.8
            },
            {
              "x": 15.8,
              "y": 27.4
            },
            {
              "x": 11.9,
              "y": 22.8
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 35.8,
              "y": 17
            },
            {
              "x": 24.2,
              "y": 17
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 12.1,
              "y": 19.9
            },
            {
              "x": 13.4,
              "y": 21.4
            },
            {
              "x": 8.8,
              "y": 25.4
            },
            {
              "x": 7.5,
              "y": 23.9
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 44.5,
              "y": 35
            },
            {
              "x": 38.5,
              "y": 35
            },
            {
              "x": 38.5,
              "y": 39
            },
            {
              "x": 44.5,
              "y": 39
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 15.5,
              "y": 9
            },
            {
              "x": 21.6,
              "y": 9
            },
            {
              "x": 21.6,
              "y": 5
            },
            {
              "x": 15.5,
              "y": 5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 25,
              "y": 32.8
            },
            {
              "x": 26.4,
              "y": 34.2
            },
            {
              "x": 22.1,
              "y": 38.5
            },
            {
              "x": 20.7,
              "y": 37.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 27.3,
              "y": 31.4
            },
            {
              "x": 26.9,
              "y": 31
            },
            {
              "x": 25,
              "y": 32.8
            },
            {
              "x": 32.2,
              "y": 39.9
            },
            {
              "x": 34,
              "y": 38.1
            },
            {
              "x": 28.7,
              "y": 32.8
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 44.9,
              "y": 23.6
            },
            {
              "x": 41,
              "y": 19
            },
            {
              "x": 44,
              "y": 16.4
            },
            {
              "x": 48,
              "y": 21
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 47.8,
              "y": 24
            },
            {
              "x": 46.5,
              "y": 22.5
            },
            {
              "x": 51.1,
              "y": 18.5
            },
            {
              "x": 52.4,
              "y": 20
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 17.4,
              "y": 32
            },
            {
              "x": 5.8,
              "y": 32
            },
            {
              "x": 5.8,
              "y": 39
            },
            {
              "x": 17.4,
              "y": 39
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 35.8,
              "y": 19
            },
            {
              "x": 24.2,
              "y": 25.1
            },
            {
              "x": 24.2,
              "y": 27.1
            },
            {
              "x": 35.8,
              "y": 27.1
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 56.1,
              "y": 27.9
            },
            {
              "x": 44.5,
              "y": 27.9
            },
            {
              "x": 44.5,
              "y": 34.9
            },
            {
              "x": 56.1,
              "y": 34.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Sabotage ↔ Sabotage",
      "missionA": "Sabotage",
      "missionB": "Sabotage",
      "layout": "A",
      "page": 51,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 8.8,
          "y": 36.8
        },
        "Attacker Home": {
          "x": 51.2,
          "y": 7.3
        },
        "Central 1": {
          "x": 30.2,
          "y": 25.4
        },
        "Expansion 1": {
          "x": 10.3,
          "y": 14.1
        },
        "Expansion 2": {
          "x": 49.7,
          "y": 29.8
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 14
            },
            {
              "x": 60,
              "y": 14
            },
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 8
            },
            {
              "x": 30,
              "y": 8
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 36
            },
            {
              "x": 30,
              "y": 36
            },
            {
              "x": 30,
              "y": 30
            },
            {
              "x": 0,
              "y": 30
            }
          ]
        },
        "attackerTerritory": {
          "x": 0,
          "y": 0,
          "width": 60,
          "height": 22
        },
        "defenderTerritory": {
          "x": 0,
          "y": 22,
          "width": 60,
          "height": 22
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 15.6,
              "y": 33
            },
            {
              "x": 3.9,
              "y": 33
            },
            {
              "x": 3.9,
              "y": 40
            },
            {
              "x": 15.6,
              "y": 40
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 26.1,
              "y": 18.9
            },
            {
              "x": 26.1,
              "y": 25
            },
            {
              "x": 30.1,
              "y": 25
            },
            {
              "x": 30.1,
              "y": 18.9
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 18.9,
              "y": 36.4
            },
            {
              "x": 31.9,
              "y": 38.1
            },
            {
              "x": 33.1,
              "y": 36.4
            },
            {
              "x": 23.5,
              "y": 29.8
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 40.8,
              "y": 8
            },
            {
              "x": 27.8,
              "y": 5.8
            },
            {
              "x": 26.6,
              "y": 7.5
            },
            {
              "x": 35.9,
              "y": 14.4
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 44.5,
              "y": 11
            },
            {
              "x": 56.2,
              "y": 11
            },
            {
              "x": 56.2,
              "y": 3.9
            },
            {
              "x": 44.5,
              "y": 3.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 15.5,
              "y": 10.8
            },
            {
              "x": 3.9,
              "y": 10.9
            },
            {
              "x": 3.9,
              "y": 17.9
            },
            {
              "x": 15.6,
              "y": 17.8
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 34.1,
              "y": 25
            },
            {
              "x": 34.1,
              "y": 19
            },
            {
              "x": 30.1,
              "y": 19
            },
            {
              "x": 30.1,
              "y": 25
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 52.5,
              "y": 36.4
            },
            {
              "x": 53.1,
              "y": 36.4
            },
            {
              "x": 53.1,
              "y": 39
            },
            {
              "x": 43,
              "y": 38.9
            },
            {
              "x": 43,
              "y": 36.3
            },
            {
              "x": 50.5,
              "y": 36.4
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 7.4,
              "y": 7.5
            },
            {
              "x": 6.8,
              "y": 7.5
            },
            {
              "x": 6.8,
              "y": 4.9
            },
            {
              "x": 16.9,
              "y": 5
            },
            {
              "x": 16.9,
              "y": 7.6
            },
            {
              "x": 9.4,
              "y": 7.5
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 44.5,
              "y": 33.1
            },
            {
              "x": 56.1,
              "y": 33
            },
            {
              "x": 56,
              "y": 25.9
            },
            {
              "x": 44.4,
              "y": 26
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 19,
              "y": 27.9
            },
            {
              "x": 20.6,
              "y": 26.7
            },
            {
              "x": 16.7,
              "y": 22
            },
            {
              "x": 15.1,
              "y": 23.3
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 10.6,
              "y": 27.4
            },
            {
              "x": 9.3,
              "y": 26
            },
            {
              "x": 13.8,
              "y": 21.9
            },
            {
              "x": 15.2,
              "y": 23.4
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 41,
              "y": 16
            },
            {
              "x": 39.5,
              "y": 17.3
            },
            {
              "x": 43.4,
              "y": 21.9
            },
            {
              "x": 44.9,
              "y": 20.7
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 49.4,
              "y": 16.5
            },
            {
              "x": 50.8,
              "y": 18
            },
            {
              "x": 46.3,
              "y": 22.1
            },
            {
              "x": 44.9,
              "y": 20.6
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 18.9,
              "y": 14
            },
            {
              "x": 25,
              "y": 13.9
            },
            {
              "x": 24.9,
              "y": 10
            },
            {
              "x": 18.9,
              "y": 10
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 41,
              "y": 29.9
            },
            {
              "x": 35,
              "y": 30
            },
            {
              "x": 35,
              "y": 33.9
            },
            {
              "x": 41.1,
              "y": 33.9
            }
          ]
        }
      }
    },
    {
      "missionKey": "Sabotage ↔ Sabotage",
      "missionA": "Sabotage",
      "missionB": "Sabotage",
      "layout": "B",
      "page": 52,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 9.6,
          "y": 33.8
        },
        "Attacker Home": {
          "x": 50.4,
          "y": 10.5
        },
        "Central 1": {
          "x": 27.8,
          "y": 22
        },
        "Expansion 1": {
          "x": 14.4,
          "y": 10.5
        },
        "Expansion 2": {
          "x": 45.6,
          "y": 33.3
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 30,
              "y": 0
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            },
            {
              "x": 60,
              "y": 0
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 0
            },
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 30,
              "y": 44
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 27,
              "y": 26
            },
            {
              "x": 33.1,
              "y": 26
            },
            {
              "x": 33.1,
              "y": 22
            },
            {
              "x": 27,
              "y": 22
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 18.9,
              "y": 35
            },
            {
              "x": 15.8,
              "y": 22.2
            },
            {
              "x": 17.4,
              "y": 20.9
            },
            {
              "x": 25,
              "y": 29.6
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 33.1,
              "y": 39
            },
            {
              "x": 35.1,
              "y": 39
            },
            {
              "x": 35.1,
              "y": 32.9
            },
            {
              "x": 33.1,
              "y": 32.9
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 47,
              "y": 5.1
            },
            {
              "x": 47,
              "y": 16.7
            },
            {
              "x": 54,
              "y": 16.7
            },
            {
              "x": 54,
              "y": 5.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 20.5,
              "y": 13.5
            },
            {
              "x": 14,
              "y": 3.9
            },
            {
              "x": 8.1,
              "y": 7.9
            },
            {
              "x": 14.6,
              "y": 17.5
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 12.9,
              "y": 39
            },
            {
              "x": 12.9,
              "y": 27.3
            },
            {
              "x": 5.8,
              "y": 27.3
            },
            {
              "x": 5.8,
              "y": 39
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 21.8,
              "y": 35.9
            },
            {
              "x": 20.2,
              "y": 37.2
            },
            {
              "x": 24,
              "y": 41.9
            },
            {
              "x": 25.6,
              "y": 40.7
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 12.7,
              "y": 20.8
            },
            {
              "x": 13,
              "y": 21.3
            },
            {
              "x": 11,
              "y": 22.9
            },
            {
              "x": 4.8,
              "y": 15
            },
            {
              "x": 6.9,
              "y": 13.4
            },
            {
              "x": 11.4,
              "y": 19.2
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 33.1,
              "y": 18
            },
            {
              "x": 27.1,
              "y": 18
            },
            {
              "x": 27.1,
              "y": 22
            },
            {
              "x": 33.1,
              "y": 22
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 27,
              "y": 5
            },
            {
              "x": 25,
              "y": 5
            },
            {
              "x": 25,
              "y": 11.1
            },
            {
              "x": 27,
              "y": 11.1
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 27.1,
              "y": 12.8
            },
            {
              "x": 33.2,
              "y": 12.8
            },
            {
              "x": 33.2,
              "y": 8.8
            },
            {
              "x": 27.1,
              "y": 8.8
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 38.2,
              "y": 8.1
            },
            {
              "x": 39.8,
              "y": 6.9
            },
            {
              "x": 36.1,
              "y": 2.1
            },
            {
              "x": 34.5,
              "y": 3.3
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 33,
              "y": 31
            },
            {
              "x": 27,
              "y": 31
            },
            {
              "x": 27,
              "y": 35
            },
            {
              "x": 33,
              "y": 35
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 47.3,
              "y": 23.1
            },
            {
              "x": 46.9,
              "y": 22.6
            },
            {
              "x": 49,
              "y": 21
            },
            {
              "x": 55.2,
              "y": 29
            },
            {
              "x": 53.1,
              "y": 30.6
            },
            {
              "x": 48.5,
              "y": 24.7
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 39.5,
              "y": 30.3
            },
            {
              "x": 46,
              "y": 40
            },
            {
              "x": 51.9,
              "y": 36
            },
            {
              "x": 45.3,
              "y": 26.4
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 41.1,
              "y": 9
            },
            {
              "x": 44.1,
              "y": 21.7
            },
            {
              "x": 42.6,
              "y": 23
            },
            {
              "x": 34.9,
              "y": 14.3
            }
          ]
        }
      }
    },
    {
      "missionKey": "Sabotage ↔ Sabotage",
      "missionA": "Sabotage",
      "missionB": "Sabotage",
      "layout": "C",
      "page": 53,
      "verified": true,
      "objectivePositions": {
        "Defender Home": {
          "x": 10.5,
          "y": 34.4
        },
        "Attacker Home": {
          "x": 48.8,
          "y": 8.9
        },
        "Central 1": {
          "x": 33.5,
          "y": 21.9
        },
        "Expansion 1": {
          "x": 19.2,
          "y": 7.5
        },
        "Expansion 2": {
          "x": 39.7,
          "y": 36.4
        }
      },
      "deploymentZones": {
        "attackerDeployment": {
          "points": [
            {
              "x": 60,
              "y": 0
            },
            {
              "x": 40,
              "y": 0
            },
            {
              "x": 40,
              "y": 22
            },
            {
              "x": 48,
              "y": 22
            },
            {
              "x": 48,
              "y": 44
            },
            {
              "x": 60,
              "y": 44
            }
          ]
        },
        "defenderDeployment": {
          "points": [
            {
              "x": 0,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 44
            },
            {
              "x": 19.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 22
            },
            {
              "x": 11.9,
              "y": 0
            },
            {
              "x": 0,
              "y": 0
            }
          ]
        },
        "attackerTerritory": {
          "x": 30,
          "y": 0,
          "width": 30,
          "height": 44
        },
        "defenderTerritory": {
          "x": 0,
          "y": 0,
          "width": 30,
          "height": 44
        }
      },
      "terrainGeometry": {
        "T1": {
          "points": [
            {
              "x": 45.1,
              "y": 32.9
            },
            {
              "x": 33.4,
              "y": 32.9
            },
            {
              "x": 33.4,
              "y": 40
            },
            {
              "x": 45.1,
              "y": 40
            }
          ]
        },
        "T2": {
          "points": [
            {
              "x": 53.1,
              "y": 4
            },
            {
              "x": 53.1,
              "y": 15.6
            },
            {
              "x": 46,
              "y": 15.6
            },
            {
              "x": 46,
              "y": 4
            }
          ]
        },
        "T3": {
          "points": [
            {
              "x": 21.1,
              "y": 24.8
            },
            {
              "x": 20,
              "y": 23.1
            },
            {
              "x": 14.9,
              "y": 26.5
            },
            {
              "x": 16,
              "y": 28.2
            }
          ]
        },
        "T4": {
          "points": [
            {
              "x": 18.2,
              "y": 15.4
            },
            {
              "x": 17.9,
              "y": 15
            },
            {
              "x": 15.7,
              "y": 16.4
            },
            {
              "x": 21.2,
              "y": 24.8
            },
            {
              "x": 23.4,
              "y": 23.4
            },
            {
              "x": 19.3,
              "y": 17.1
            }
          ]
        },
        "T5": {
          "points": [
            {
              "x": 3.8,
              "y": 10
            },
            {
              "x": 10,
              "y": 21.5
            },
            {
              "x": 12,
              "y": 21.5
            },
            {
              "x": 11.9,
              "y": 9.9
            }
          ]
        },
        "T6": {
          "points": [
            {
              "x": 33,
              "y": 18
            },
            {
              "x": 26.9,
              "y": 18
            },
            {
              "x": 26.9,
              "y": 21.9
            },
            {
              "x": 33,
              "y": 21.9
            }
          ]
        },
        "T7": {
          "points": [
            {
              "x": 56.1,
              "y": 34
            },
            {
              "x": 50,
              "y": 22.4
            },
            {
              "x": 48,
              "y": 22.4
            },
            {
              "x": 48,
              "y": 34
            }
          ]
        },
        "T8": {
          "points": [
            {
              "x": 26.9,
              "y": 30.9
            },
            {
              "x": 20.8,
              "y": 30.9
            },
            {
              "x": 20.8,
              "y": 34.9
            },
            {
              "x": 26.9,
              "y": 34.9
            }
          ]
        },
        "T9": {
          "points": [
            {
              "x": 26.9,
              "y": 39
            },
            {
              "x": 28.9,
              "y": 39
            },
            {
              "x": 28.9,
              "y": 32.9
            },
            {
              "x": 26.9,
              "y": 32.9
            }
          ]
        },
        "T10": {
          "points": [
            {
              "x": 26.9,
              "y": 26
            },
            {
              "x": 32.9,
              "y": 26
            },
            {
              "x": 32.9,
              "y": 22
            },
            {
              "x": 26.9,
              "y": 22
            }
          ]
        },
        "T11": {
          "points": [
            {
              "x": 33,
              "y": 13
            },
            {
              "x": 39,
              "y": 13
            },
            {
              "x": 39,
              "y": 9
            },
            {
              "x": 33,
              "y": 9
            }
          ]
        },
        "T12": {
          "points": [
            {
              "x": 32.9,
              "y": 4.9
            },
            {
              "x": 30.9,
              "y": 4.9
            },
            {
              "x": 30.9,
              "y": 10.9
            },
            {
              "x": 32.9,
              "y": 10.9
            }
          ]
        },
        "T13": {
          "points": [
            {
              "x": 6.8,
              "y": 40
            },
            {
              "x": 6.8,
              "y": 28.4
            },
            {
              "x": 13.9,
              "y": 28.4
            },
            {
              "x": 13.9,
              "y": 40
            }
          ]
        },
        "T14": {
          "points": [
            {
              "x": 13.9,
              "y": 10.9
            },
            {
              "x": 25.5,
              "y": 10.9
            },
            {
              "x": 25.5,
              "y": 3.9
            },
            {
              "x": 13.9,
              "y": 3.9
            }
          ]
        },
        "T15": {
          "points": [
            {
              "x": 39,
              "y": 19.2
            },
            {
              "x": 40,
              "y": 20.9
            },
            {
              "x": 45.3,
              "y": 17.7
            },
            {
              "x": 44.2,
              "y": 16
            }
          ]
        },
        "T16": {
          "points": [
            {
              "x": 41.7,
              "y": 28.7
            },
            {
              "x": 42,
              "y": 29.1
            },
            {
              "x": 44.2,
              "y": 27.7
            },
            {
              "x": 38.9,
              "y": 19.2
            },
            {
              "x": 36.7,
              "y": 20.6
            },
            {
              "x": 40.6,
              "y": 26.9
            }
          ]
        }
      }
    }
  ]
});
