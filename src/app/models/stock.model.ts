// src/app/models/stock.interface.ts
  export interface Stock {
    _id?: string;
    type: string;
    quantity: number;
    unit: string;
    category: string;
    minQuantity: number;
    userId?: string;
    lastUpdated?: Date;
  }
  
  export interface StockStats {
    type: string;
    totalQuantity: number;
    unit: string;
  }
  
  export interface History {
    type: string;
    data: any;
    userId: string;
    action: 'create' | 'update' | 'delete';
    description: string;
    createdAt?: Date;
  }
  

  export interface LowStockAlert {
    type: string;
    currentStock: number;
    unit: string;
    minQuantity: number;
  }
  

  