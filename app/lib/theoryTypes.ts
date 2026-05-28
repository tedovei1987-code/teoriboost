export const THEORY_TYPES = [
  {
    group: "Bil",
    items: [
      {
        value: "B",
        label: "Klasse B",
        description: "Personbil",
      },
      {
        value: "BE",
        label: "Klasse BE",
        description: "Personbil med tilhenger",
      },
    ],
  },

  {
    group: "Moped & Motorsykkel",
    items: [
      {
        value: "AM",
        label: "AM",
        description: "Moped",
      },
      {
        value: "AM147",
        label: "AM147",
        description: "Mopedbil",
      },
      {
        value: "A1",
        label: "A1",
        description: "Lett motorsykkel",
      },
      {
        value: "A2",
        label: "A2",
        description: "Mellomtung motorsykkel",
      },
      {
        value: "A",
        label: "A",
        description: "Tung motorsykkel",
      },
    ],
  },

  {
    group: "Traktor & Snøscooter",
    items: [
      {
        value: "T",
        label: "T",
        description: "Traktor",
      },
      {
        value: "S",
        label: "S",
        description: "Snøscooter",
      },
    ],
  },

  {
    group: "Lastebil",
    items: [
      {
        value: "C",
        label: "C",
        description: "Lastebil",
      },
      {
        value: "C1",
        label: "C1",
        description: "Lett lastebil",
      },
      {
        value: "C1E",
        label: "C1E",
        description: "Lett lastebil med tilhenger",
      },
      {
        value: "CE",
        label: "CE",
        description: "Lastebil med tilhenger",
      },
    ],
  },

  {
    group: "Buss",
    items: [
      {
        value: "D",
        label: "D",
        description: "Buss",
      },
      {
        value: "D1",
        label: "D1",
        description: "Minibuss",
      },
      {
        value: "D1E",
        label: "D1E",
        description: "Minibuss med tilhenger",
      },
    ],
  },

  {
    group: "YSK",
    items: [
      {
        value: "YSK_GOODS",
        label: "YSK Gods",
        description: "Yrkessjåfør gods",
      },
      {
        value: "YSK_PASSENGER",
        label: "YSK Persontransport",
        description: "Yrkessjåfør persontransport",
      },
    ],
  },

  {
    group: "ADR",
    items: [
      {
        value: "ADR_BASIC",
        label: "ADR Basic",
        description: "ADR grunnkurs",
      },
      {
        value: "ADR_TANK",
        label: "ADR Tank",
        description: "Tanktransport",
      },
      {
        value: "ADR_EXPLOSIVE",
        label: "ADR Explosive",
        description: "Eksplosiver",
      },
      {
        value: "ADR_RADIOACTIVE",
        label: "ADR Radioactive",
        description: "Radioaktivt materiale",
      },
    ],
  },
];

export const THEORY_LABELS: Record<string, string> = {
  B: "Klasse B",
  BE: "Klasse BE",

  AM: "AM",
  AM147: "AM147",

  A1: "A1",
  A2: "A2",
  A: "A",

  T: "T",
  S: "S",

  C: "C",
  C1: "C1",
  C1E: "C1E",
  CE: "CE",

  D: "D",
  D1: "D1",
  D1E: "D1E",

  YSK_GOODS: "YSK Gods",
  YSK_PASSENGER: "YSK Persontransport",

  ADR_BASIC: "ADR Basic",
  ADR_TANK: "ADR Tank",
  ADR_EXPLOSIVE: "ADR Explosive",
  ADR_RADIOACTIVE: "ADR Radioactive",
};

export const THEORY_DESCRIPTIONS: Record<string, string> = {
  B: "Personbil",
  BE: "Personbil med tilhenger",

  AM: "Moped",
  AM147: "Mopedbil",

  A1: "Lett motorsykkel",
  A2: "Mellomtung motorsykkel",
  A: "Tung motorsykkel",

  T: "Traktor",
  S: "Snøscooter",

  C: "Lastebil",
  C1: "Lett lastebil",
  C1E: "Lett lastebil med tilhenger",
  CE: "Lastebil med tilhenger",

  D: "Buss",
  D1: "Minibuss",
  D1E: "Minibuss med tilhenger",

  YSK_GOODS: "Yrkessjåfør gods",
  YSK_PASSENGER: "Yrkessjåfør persontransport",

  ADR_BASIC: "ADR grunnkurs",
  ADR_TANK: "Tanktransport",
  ADR_EXPLOSIVE: "Eksplosiver",
  ADR_RADIOACTIVE: "Radioaktivt materiale",
};