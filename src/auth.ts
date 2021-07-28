import { sign } from "jsonwebtoken";
import { User } from "./entities/User";

export const createAccessToken = (user: User) =>
  sign(
    { userId: user?.id, refreshCount: user?.refreshCount },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15min",
    }
  );

export const createRefreshToken = (user: User) =>
  sign(
    { userId: user?.id, count: user?.refreshCount },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: "15d" }
  );
