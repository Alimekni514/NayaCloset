export interface Governorate {
  code: string;
  name: string;
  cities: { name: string; localities: string[]; postalCode: string }[];
}

export const GOVERNORATES: Governorate[] = [
  {
    code: "TUN",
    name: "Tunis",
    cities: [
      { name: "Tunis Centre", localities: ["Lafayette", "Bab Bhar", "Montplaisir"], postalCode: "1000" },
      { name: "El Menzah", localities: ["El Menzah 1", "El Menzah 5", "El Menzah 9"], postalCode: "1004" },
      { name: "Le Bardo", localities: ["Bardo Centre", "Khaznadar"], postalCode: "2000" },
    ],
  },
  {
    code: "ARI",
    name: "Ariana",
    cities: [
      { name: "Ariana Ville", localities: ["Borj Louzir", "Riadh El Andalous"], postalCode: "2080" },
      { name: "Raoued", localities: ["Jardins de Carthage", "Chotrana"], postalCode: "2056" },
    ],
  },
  {
    code: "BEN",
    name: "Ben Arous",
    cities: [
      { name: "Ben Arous", localities: ["Cité El Yasmine", "Medina Jedida"], postalCode: "2013" },
      { name: "Ezzahra", localities: ["Ezzahra Centre", "Rades Meliane"], postalCode: "2034" },
    ],
  },
  {
    code: "SFA",
    name: "Sfax",
    cities: [
      { name: "Sfax Ville", localities: ["Bab Bhar", "Route Tunis"], postalCode: "3000" },
      { name: "Sakiet Ezzit", localities: ["Chihia", "El Ain"], postalCode: "3021" },
    ],
  },
  {
    code: "SOU",
    name: "Sousse",
    cities: [
      { name: "Sousse Médina", localities: ["Bouhsina", "Khezama"], postalCode: "4000" },
      { name: "Hammam Sousse", localities: ["Kantaoui", "Chott Meriem"], postalCode: "4011" },
    ],
  },
  {
    code: "NAB",
    name: "Nabeul",
    cities: [
      { name: "Nabeul", localities: ["Dar Chaabane", "Beni Khiar"], postalCode: "8000" },
      { name: "Hammamet", localities: ["Yasmine Hammamet", "Hammamet Sud"], postalCode: "8050" },
    ],
  },
  {
    code: "MON",
    name: "Monastir",
    cities: [
      { name: "Monastir", localities: ["Skanes", "Monastir Centre"], postalCode: "5000" },
      { name: "Ksar Hellal", localities: ["Ksar Hellal Centre"], postalCode: "5070" },
    ],
  },
  {
    code: "BIZ",
    name: "Bizerte",
    cities: [
      { name: "Bizerte", localities: ["Corniche", "Zarzouna"], postalCode: "7000" },
      { name: "Menzel Bourguiba", localities: ["Menzel Bourguiba Centre"], postalCode: "7050" },
    ],
  },
];

export const governorateNames = GOVERNORATES.map((g) => g.name);

export function citiesOf(governorate: string) {
  return GOVERNORATES.find((g) => g.name === governorate)?.cities ?? [];
}

export function localitiesOf(governorate: string, city: string) {
  return citiesOf(governorate).find((c) => c.name === city)?.localities ?? [];
}

export function postalCodeOf(governorate: string, city: string) {
  return citiesOf(governorate).find((c) => c.name === city)?.postalCode ?? "";
}