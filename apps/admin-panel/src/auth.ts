import NextAuth, { DefaultSession, type NextAuthConfig, type NextAuthResult } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { getPrisma } from '@rad/shared';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
    } & DefaultSession['user'];
  }
}

const config = {
  trustHost: true,
  basePath: '/api/auth',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log('[auth] Missing credentials');
          return null;
        }

        console.log('[auth] Looking for admin:', credentials.username);
        const prisma = getPrisma();
        
        // Debug: Check all admins
        const allAdmins = await prisma.admin.findMany();
        console.log('[auth] Total admins in database:', allAdmins.length);
        console.log('[auth] Admin usernames:', allAdmins.map(a => a.username));
        
        const admin = await prisma.admin.findUnique({
          where: { username: credentials.username as string },
        });

        if (!admin) {
          console.log('[auth] Admin not found');
          return null;
        }

        console.log('[auth] Admin found, checking password');
        const isPasswordValid = await compare(
          credentials.password as string,
          admin.passwordHash
        );

        if (!isPasswordValid) {
          console.log('[auth] Invalid password');
          return null;
        }

        console.log('[auth] Login successful');
        return {
          id: admin.id,
          name: admin.username,
          email: `${admin.username}@admin`,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.username = token.name as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

const nextAuth: NextAuthResult = NextAuth(config);

export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const signOut: NextAuthResult['signOut'] = nextAuth.signOut;
