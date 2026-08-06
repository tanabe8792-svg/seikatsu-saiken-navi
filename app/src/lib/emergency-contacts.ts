export interface EmergencyContact {
  id: string;
  label: string;
  number: string;
  description: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "fire",
    label: "火事・救急",
    number: "119",
    description: "火事、けが、急病のとき",
  },
  {
    id: "police",
    label: "警察",
    number: "110",
    description: "犯罪、交通事故のとき",
  },
  {
    id: "disaster-message",
    label: "災害伝言",
    number: "171",
    description: "被災地の安否確認（発災時のみ）",
  },
];
