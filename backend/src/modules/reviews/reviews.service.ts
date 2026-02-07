import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  /**
   * Create a review for an event
   */
  async createReview(userId: string, createDto: CreateReviewDto): Promise<Review> {
    const event = await this.eventRepository.findOne({
      where: { id: createDto.eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user already reviewed this event
    const existingReview = await this.reviewRepository.findOne({
      where: { userId, eventId: createDto.eventId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this event');
    }

    // Verify user attended (has a ticket) - optional verification
    const ticket = await this.ticketRepository.findOne({
      where: {
        userId,
        eventId: createDto.eventId,
        status: 'used' as any, // Ticket was used (checked in)
      },
    });

    const review = this.reviewRepository.create({
      userId,
      eventId: createDto.eventId,
      ticketId: ticket?.id,
      rating: createDto.rating,
      reviewText: createDto.reviewText,
      venueRating: createDto.venueRating,
      organizerRating: createDto.organizerRating,
      isVerified: !!ticket, // Verified if user has a used ticket
    });

    return this.reviewRepository.save(review);
  }

  /**
   * Get reviews for an event
   */
  async getEventReviews(eventId: string): Promise<Review[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.reviewRepository.find({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get average rating for an event
   */
  async getEventAverageRating(eventId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.reviewRepository.find({
      where: { eventId },
      select: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const ratingDistribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      },
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    );

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }

  /**
   * Get user's reviews
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      relations: ['event'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updateDto: Partial<CreateReviewDto>,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    Object.assign(review, updateDto);
    return this.reviewRepository.save(review);
  }

  /**
   * Delete review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const result = await this.reviewRepository.delete({
      id: reviewId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Review not found');
    }
  }
}
