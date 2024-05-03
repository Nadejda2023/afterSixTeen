import { Injectable } from '@nestjs/common';
import { TestingRepository } from './test-all-data.repository';

@Injectable()
export class TestingService {
  constructor(private readonly testingRepository: TestingRepository) {}
  wipeAllData() {
    return this.testingRepository.wipeAllData();
  }
}
