// src/app/models/cost.model.ts
export interface Cost {
    _id?: string; // Optionnel car généré par MongoDB
    type: string;
    description: string;
    amount: number;
    date: Date;
    dynamicData?: Map<string, string>; // Optionnel
    createdAt?: Date; // Optionnel car généré par MongoDB
    updatedAt?: Date; // Optionnel car généré par MongoDB
  }