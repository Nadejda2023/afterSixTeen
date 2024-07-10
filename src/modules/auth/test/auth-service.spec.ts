import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { appSettings } from '../../../setting';
import { UserService } from '../users.service';

describe('integration tests for UserService', () => {
  let app: INestApplication;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let httpServer: any;
  let moduleFixture: TestingModule;

  beforeEach(async (): Promise<void> => {
    try {
      moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      appSettings(app);
      await app.init();
      httpServer = app.getHttpServer();
    } catch (error) {
      console.error('Error during module initialization:', error);
    }
  });

  afterEach(async (): Promise<void> => {
    await app.close();
  });

  it('should return', async () => {
    const email = 'nadya@klever.com';
    const login = 'nadya';
    const password = '12345';
    const inputModel = { login, email, password };
    const userService = moduleFixture.get<UserService>(UserService);
    const result = await userService.createUser(inputModel);

    expect(result.email).toBe(email);
    expect(result.login).toBe(login);
  });
});
