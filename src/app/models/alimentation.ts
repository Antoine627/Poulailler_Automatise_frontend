// feeding.model.ts

export interface BaseModel {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface WaterSupply {
    startTime: string;
    endTime: string;
    enabled: boolean;
  }
  
  export interface Feeding extends BaseModel {
    quantity: number;
    feedType: string;
    stockQuantity: number;
    waterSupply?: WaterSupply;
    notes?: string;
  }
  
  export interface FeedingHistory extends BaseModel {
    type: 'feeding';
    data: Feeding;
    userId: string;
    action: 'create' | 'update' | 'delete' | 'bulk_create';
    description: string;
  }
  
  export interface FeedingStats {
    _id: string; // feedType
    totalQuantity: number;
    averageQuantity: number;
    count: number;
  }
  
  export interface StockAlert {
    _id: string; // feedType
    currentStock: number;
  }
  
  export type FeedingType = 'grain' | 'hay' | 'supplement' | 'Aliments démarrage' | 'Aliments croissance' | 'Aliments finition' | 'supplement' | 'other';
  
  export interface FeedingFilters {
    startDate?: Date;
    endDate?: Date;
    feedType?: FeedingType;
    limit?: number;
  }
  
  export interface WaterSupplyUpdate {
    startTime: string;
    endTime: string;
    enabled: boolean;
  }
  
  export class FeedingCreate implements Pick<Feeding, 'quantity' | 'feedType' | 'stockQuantity'> {
    constructor(
      public quantity: number,
      public feedType: string,
      public stockQuantity: number
    ) {}
  }
  
  export class FeedingUpdate implements Partial<Feeding> {
    constructor(
      public quantity?: number,
      public feedType?: string,
      public stockQuantity?: number,
      public waterSupply?: WaterSupply,
      public notes?: string
    ) {}
  }