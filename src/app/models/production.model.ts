// src/app/models/production.model.ts
export interface Production {
    _id?: string; // Optionnel car généré par MongoDB
    chickenCount: number;
    mortality: number;
    feedConsumption: number;
    costs: {
      feed: number;
      vaccines: number;
      utilities: number;
      other: number;
    };
    revenue: number;
    createdAt?: Date; // Optionnel car généré par MongoDB
    updatedAt?: Date; // Optionnel car généré par MongoDB
  }