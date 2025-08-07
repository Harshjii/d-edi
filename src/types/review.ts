export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  media: {
    type: 'image' | 'video';
    url: string;
  }[];
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  productName?: string;
  productImage?: string;
}