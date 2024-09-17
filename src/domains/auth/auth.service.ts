import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordService } from 'src/common/services/password.service';
import { UsersService } from '../users/users.service';
import { JwtService } from 'src/common/services/jwt.service';
import { SensitiveUserService } from 'src/common/services/sensitiveUser.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly sensitiveUserService: SensitiveUserService,
  ) {}

  async login(email: string, password: string) {
    //* Find user
    const foundUser = await this.userService.getUserByEmail(email);
    if (!foundUser) {
      throw new BadRequestException('User not found');
    }
    //* Compare password
    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      foundUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    //* Generate token
    const accessToken = this.jwtService.generateToken({
      email: foundUser.email,
    });
    return {
      accessToken,
      user: this.sensitiveUserService.getUserWithoutSensitiveData(foundUser),
    };
  }

  async register(email: string, password: string) {
    const foundUser = await this.userService.getUserByEmail(email);
    if (foundUser) {
      throw new BadRequestException('This email already exists');
    }
    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = await this.userService.createUser(email, hashedPassword);
    return this.sensitiveUserService.getUserWithoutSensitiveData(user);
  }
  async logout() {
    return 'NOT_IMPLEMENTED';
  }
  async refresh() {
    return 'NOT_IMPLEMENTED';
  }
  async me(user: { email: string }) {
    const foundUser = await this.userService.getUserByEmail(user.email);
    return this.sensitiveUserService.getUserWithoutSensitiveData(foundUser);
  }
}
