import { Controller, Get, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.getProfileById(req.user.sub);
  }

  @Get(':username')
  getProfile(@Param('username') username: string) {
    return this.usersService.getProfileByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    // req.user contains the decoded JWT token, where sub is the userId
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }
}
