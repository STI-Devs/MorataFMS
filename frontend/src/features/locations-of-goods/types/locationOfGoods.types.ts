export interface LocationOfGoods {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateLocationOfGoodsData {
    name: string;
}

export interface UpdateLocationOfGoodsData {
    name: string;
}
