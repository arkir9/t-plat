import { api } from './api';

export interface Review {
  id: string;
  userId: string;
  eventId: string;
  ticketId?: string;
  rating: number;
  reviewText?: string;
  venueRating?: number;
  organizerRating?: number;
  organizerResponse?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: any;
  event?: any;
}

export interface CreateReviewDto {
  eventId: string;
  rating: number;
  reviewText?: string;
  venueRating?: number;
  organizerRating?: number;
}

export interface EventRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const reviewsService = {
  /**
   * Create a review for an event
   */
  async createReview(review: CreateReviewDto): Promise<Review> {
    const response = await api.post('/reviews', review);
    return response.data;
  },

  /**
   * Get reviews for an event
   */
  async getEventReviews(eventId: string): Promise<Review[]> {
    const response = await api.get(`/reviews/events/${eventId}`);
    return response.data;
  },

  /**
   * Get average rating for an event
   */
  async getEventAverageRating(eventId: string): Promise<EventRatingStats> {
    const response = await api.get(`/reviews/events/${eventId}/rating`);
    return response.data;
  },

  /**
   * Get user's reviews
   */
  async getMyReviews(): Promise<Review[]> {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },

  /**
   * Update review
   */
  async updateReview(reviewId: string, review: Partial<CreateReviewDto>): Promise<Review> {
    const response = await api.put(`/reviews/${reviewId}`, review);
    return response.data;
  },

  /**
   * Delete review
   */
  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },
};
