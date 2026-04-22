import { inventory } from './platos';

const rawHistory = [
  [
    {
      "day": "Lunes",
      "sopas": [
        "s1",
        "ns11"
      ],
      "segundos": [
        "nr5",
        "nr10",
        "p10"
      ]
    },
    {
      "day": "Martes",
      "sopas": [
        "s5",
        "ns8"
      ],
      "segundos": [
        "nc1",
        "nc3",
        "r3"
      ]
    },
    {
      "day": "Miércoles",
      "sopas": [
        "s12",
        "ns15"
      ],
      "segundos": [
        "p2",
        "nm11",
        "nr6"
      ]
    },
    {
      "day": "Jueves",
      "sopas": [
        "s4",
        "ns7"
      ],
      "segundos": [
        "c6",
        "ns16",
        "nm4"
      ]
    },
    {
      "day": "Viernes",
      "sopas": [
        "s3",
        "ns5"
      ],
      "segundos": [
        "r2",
        "nm7",
        "p1"
      ]
    },
    {
      "day": "Sábado",
      "sopas": [
        "s2",
        "ns16"
      ],
      "segundos": [
        "c9",
        "np4"
      ]
    }
  ],
  [
    {
      "day": "Lunes",
      "sopas": [
        "s7",
        "ns12"
      ],
      "segundos": [
        "nr2",
        "nm12",
        "p3"
      ]
    },
    {
      "day": "Martes",
      "sopas": [
        "s6",
        "ns4"
      ],
      "segundos": [
        "c8",
        "np6",
        "nm6"
      ]
    },
    {
      "day": "Miércoles",
      "sopas": [
        "s1",
        "ns15"
      ],
      "segundos": [
        "p6",
        "nr5",
        "nm13"
      ]
    },
    {
      "day": "Jueves",
      "sopas": [
        "s15",
        "ns16"
      ],
      "segundos": [
        "c4",
        "ns16"
      ]
    },
    {
      "day": "Viernes",
      "sopas": [
        "s1",
        "ns8"
      ],
      "segundos": [
        "p1",
        "nc2",
        "c3"
      ]
    },
    {
      "day": "Sábado",
      "sopas": [
        "s11",
        "ns6"
      ],
      "segundos": [
        "ns16",
        "r1"
      ]
    }
  ]
];

export const initialHistory = rawHistory.map(week => 
  week.map(day => ({
    day: day.day,
    sopas: day.sopas.map(id => inventory.find(d => d.id === id)).filter(Boolean),
    segundos: day.segundos.map(id => inventory.find(d => d.id === id)).filter(Boolean),
  }))
);
