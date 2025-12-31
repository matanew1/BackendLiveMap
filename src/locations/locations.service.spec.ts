import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersLocation } from './locations.entity';
import { User } from '../auth/user.entity';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('LocationsService', () => {
  let service: LocationsService;
  let repo: Repository<UsersLocation>;
  let userRepo: Repository<User>;
  let cacheManager: Cache;

  const mockRepository = {
    query: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    })),
  };

  const mockUserRepository = {
    update: jest.fn(),
    query: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(UsersLocation),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    repo = module.get<Repository<UsersLocation>>(
      getRepositoryToken(UsersLocation),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveLocation', () => {
    it('should save user location', async () => {
      const mockResult = [{ id: 1, user_id: 'user123' }];
      mockRepository.query.mockResolvedValue(mockResult);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.saveLocation(
        'user123',
        32.081194,
        34.890737,
      );

      expect(result).toEqual(mockResult);
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users_locations'),
        ['user123', 34.890737, 32.081194],
      );
    });
  });

  describe('getUsersNearby', () => {
    it('should return cached result if available', async () => {
      const cachedData = [{ user_id: 'user1', lat: 32.08, lng: 34.89 }];
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getUsersNearby(32.081194, 34.890737, 500);

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'nearby:32.081194:34.890737:500:{}',
      );
    });

    it('should query database and cache result when not cached', async () => {
      const dbResult = [
        { user_id: 'user1', lat: '32.081194', lng: '34.890737' },
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.query.mockResolvedValue(dbResult);

      const result = await service.getUsersNearby(32.081194, 34.890737, 500);

      expect(result).toEqual(dbResult);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'nearby:32.081194:34.890737:500:{}',
        dbResult,
        300000,
      );
    });

    it('should apply breed filter', async () => {
      const filters = { breed: 'Golden Retriever' };
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.query.mockResolvedValue([]);

      await service.getUsersNearby(32.081194, 34.890737, 500, filters);

      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('u."dogBreed" = $4'),
        [32.081194, 34.890737, 500, 'Golden Retriever'],
      );
    });

    it('should apply limit and offset', async () => {
      const filters = { limit: 10, offset: 5 };
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.query.mockResolvedValue([]);

      await service.getUsersNearby(32.081194, 34.890737, 500, filters);

      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $4'),
        [32.081194, 34.890737, 500, 10, 5],
      );
    });
  });

  describe('getUserLocation', () => {
    it('should return user location', async () => {
      const mockResult = [{ lat: '32.081194', lng: '34.890737' }];
      mockRepository.query.mockResolvedValue(mockResult);

      const result = await service.getUserLocation('user123');

      expect(result).toEqual({ lat: '32.081194', lng: '34.890737' });
      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT ST_Y'),
        ['user123'],
      );
    });

    it('should return null if no location found', async () => {
      mockRepository.query.mockResolvedValue([]);

      const result = await service.getUserLocation('user123');

      expect(result).toBeNull();
    });
  });
});
