import * as bcrypt from 'bcrypt';
import { User } from '../modules/users/entities/user.entity';
import { Event, EventStatus, LocationType } from '../modules/events/entities/event.entity';
import { OrganizerProfile } from '../modules/organizers/entities/organizer-profile.entity';
import { getDatabaseConfig } from '../config/database.config';

describe('Simple Functional Tests', () => {
  describe('Password Hashing', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[ab]\$10\$/);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Entity Creation', () => {
    it('should create a User entity with correct properties', () => {
      const user = new User();
      user.email = 'test@example.com';
      user.firstName = 'John';
      user.lastName = 'Doe';
      user.phone = '+254712345678';
      user.emailVerified = false;
      user.phoneVerified = false;
      user.isActive = true;
      
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.phone).toBe('+254712345678');
      expect(user.emailVerified).toBe(false);
      expect(user.phoneVerified).toBe(false);
      expect(user.isActive).toBe(true);
    });

    it('should create an Event entity with correct properties', () => {
      const event = new Event();
      event.title = 'Test Event';
      event.description = 'A test event description';
      event.organizerId = '123';
      event.eventType = 'party';
      event.category = 'nightlife';
      event.startDate = new Date('2024-02-01T20:00:00Z');
      event.endDate = new Date('2024-02-02T02:00:00Z');
      event.timezone = 'Africa/Nairobi';
      event.locationType = LocationType.CUSTOM;
      event.customLocation = {
        address: '123 Test St, Nairobi',
        latitude: -1.286389,
        longitude: 36.817223,
        city: 'Nairobi',
        country: 'Kenya',
      };
      event.status = EventStatus.DRAFT;
      event.maxTicketsPerUser = 5;
      event.isFeatured = false;
      
      expect(event.title).toBe('Test Event');
      expect(event.description).toBe('A test event description');
      expect(event.organizerId).toBe('123');
      expect(event.eventType).toBe('party');
      expect(event.category).toBe('nightlife');
      expect(event.startDate).toEqual(new Date('2024-02-01T20:00:00Z'));
      expect(event.endDate).toEqual(new Date('2024-02-02T02:00:00Z'));
      expect(event.timezone).toBe('Africa/Nairobi');
      expect(event.locationType).toBe(LocationType.CUSTOM);
      expect(event.customLocation.address).toBe('123 Test St, Nairobi');
      expect(event.customLocation.latitude).toBe(-1.286389);
      expect(event.status).toBe(EventStatus.DRAFT);
      expect(event.maxTicketsPerUser).toBe(5);
      expect(event.isFeatured).toBe(false);
    });

    it('should create an OrganizerProfile entity with correct properties', () => {
      const organizer = new OrganizerProfile();
      organizer.userId = '123';
      organizer.profileType = 'event_organizer';
      organizer.name = 'Test Events Ltd';
      organizer.bio = 'Professional event organization';
      organizer.logoUrl = 'https://example.com/logo.jpg';
      organizer.website = 'https://testevents.com';
      organizer.socialLinks = {
        instagram: '@testevents',
        twitter: '@testevents',
        facebook: 'testevents',
      };
      organizer.verificationStatus = 'pending';
      
      expect(organizer.userId).toBe('123');
      expect(organizer.profileType).toBe('event_organizer');
      expect(organizer.name).toBe('Test Events Ltd');
      expect(organizer.bio).toBe('Professional event organization');
      expect(organizer.logoUrl).toBe('https://example.com/logo.jpg');
      expect(organizer.website).toBe('https://testevents.com');
      expect(organizer.socialLinks.instagram).toBe('@testevents');
      expect(organizer.verificationStatus).toBe('pending');
    });
  });

  describe('Enums and Constants', () => {
    it('should have correct EventStatus enum values', () => {
      expect(EventStatus.DRAFT).toBe('draft');
      expect(EventStatus.PUBLISHED).toBe('published');
      expect(EventStatus.CANCELLED).toBe('cancelled');
      expect(EventStatus.COMPLETED).toBe('completed');
    });

    it('should have correct LocationType enum values', () => {
      expect(LocationType.VENUE).toBe('venue');
      expect(LocationType.CUSTOM).toBe('custom');
    });
  });

  describe('Database Configuration', () => {
    it('should load database configuration without errors', () => {
      // Set test environment variables
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USERNAME = 'test';
      process.env.DB_PASSWORD = 'test';
      process.env.DB_DATABASE = 'test_db';
      
      const config = getDatabaseConfig() as any;
      
      expect(config.type).toBe('postgres');
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.username).toBe('test');
      expect(config.password).toBe('test');
      expect(config.database).toBe('test_db');
      expect(config.entities).toBeDefined();
      expect(Array.isArray(config.entities)).toBe(true);
      expect(config.entities.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate email formats', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name+tag@domain.co.uk')).toBe(true);
      expect(emailRegex.test('invalid.email')).toBe(false);
      expect(emailRegex.test('@domain.com')).toBe(false);
      expect(emailRegex.test('user@')).toBe(false);
    });

    it('should validate Kenyan phone numbers', () => {
      const phoneRegex = /^\+254[17]\d{8}$/;
      
      expect(phoneRegex.test('+254712345678')).toBe(true); // Safaricom
      expect(phoneRegex.test('+254722345678')).toBe(true); // Safaricom
      expect(phoneRegex.test('+254733345678')).toBe(true); // Airtel
      expect(phoneRegex.test('+254700345678')).toBe(true); // Safaricom
      expect(phoneRegex.test('0712345678')).toBe(false); // No country code
      expect(phoneRegex.test('+254812345678')).toBe(false); // Invalid operator
    });

    it('should validate coordinates for Nairobi area', () => {
      const isValidNairobiCoordinate = (lat: number, lng: number): boolean => {
        // Rough bounds for Nairobi area
        return lat >= -1.5 && lat <= -1.0 && lng >= 36.5 && lng <= 37.2;
      };
      
      expect(isValidNairobiCoordinate(-1.286389, 36.817223)).toBe(true); // Nairobi CBD
      expect(isValidNairobiCoordinate(-1.319167, 36.928)).toBe(true); // Westlands
      expect(isValidNairobiCoordinate(0, 0)).toBe(false); // Not in Nairobi
      expect(isValidNairobiCoordinate(-1.286389, 40)).toBe(false); // Wrong longitude
    });
  });
});