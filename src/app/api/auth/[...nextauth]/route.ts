import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Đảm bảo đường dẫn này trỏ đúng tới file cấu hình authOptions của bạn

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
