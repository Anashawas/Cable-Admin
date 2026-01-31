interface GovernorateConstant {
  id: number;
  governorateNumber: number;
  arabicName: string;
  englishName: string;
  subType: number;
  boundaryNumber: number;
}

const GOVERNORATES: Readonly<GovernorateConstant[]> = Object.freeze([
  {
    id: 12,
    governorateNumber: 12,
    arabicName: "الفروانية",
    englishName: "Farwaniya",
    subType: 2,
    boundaryNumber: 5
  },
  {
    id: 14,
    governorateNumber: 14,
    arabicName: "العاصمة",
    englishName: "Capital",
    subType: 2,
    boundaryNumber: 6
  },
  {
    id: 16,
    governorateNumber: 16,
    arabicName: "الجهراء",
    englishName: "Jahra",
    subType: 2,
    boundaryNumber: 7
  },
  {
    id: 17,
    governorateNumber: 17,
    arabicName: "الأحمدي",
    englishName: "Ahmadi",
    subType: 2,
    boundaryNumber: 8
  },
  {
    id: 18,
    governorateNumber: 18,
    arabicName: "حولي",
    englishName: "Hawalli",
    subType: 2,
    boundaryNumber: 9
  },
  {
    id: 19,
    governorateNumber: 19,
    arabicName: "مبارك الكبير",
    englishName: "Mubarak Al Kabeer",
    subType: 2,
    boundaryNumber: 10
  }
]);

export { GOVERNORATES };
export type { GovernorateConstant };
