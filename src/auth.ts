import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";

// Credentials provider for email/password authentication
const credentials = Credentials({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(creds) {
    try {
      console.log('\n========== [AUTH.AUTHORIZE] START ==========');
      console.log('[AUTH.AUTHORIZE] Credentials received:', { 
        email: creds?.email, 
        hasPassword: !!creds?.password,
        passwordLength: creds?.password ? String(creds.password).length : 0
      });
      
      if (!creds?.email || !creds?.password) {
        console.error('[AUTH.AUTHORIZE] ❌ Missing email or password');
        console.log('========== [AUTH.AUTHORIZE] END ==========\n');
        return null;
      }
      
      const email = typeof creds.email === 'string' ? creds.email : String(creds.email);
      const password = typeof creds.password === 'string' ? creds.password : String(creds.password);
      
      console.log('[AUTH.AUTHORIZE] After type conversion:', { 
        email, 
        passwordLength: password.length,
        passwordSample: password.substring(0, 3) + '***'
      });
      
      if (!email || !password) {
        console.error('[AUTH.AUTHORIZE] ❌ Empty credentials after conversion');
        console.log('========== [AUTH.AUTHORIZE] END ==========\n');
        return null;
      }
      
      console.log('[AUTH.AUTHORIZE] Loading prisma and bcrypt...');
      const [{ prisma }, bcrypt] = await Promise.all([
        import("@/lib/db"),
        import("bcryptjs"),
      ]);
      console.log('[AUTH.AUTHORIZE] ✓ Modules loaded');
      
      console.log('[AUTH.AUTHORIZE] Looking up user:', email);
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        console.error('[AUTH.AUTHORIZE] ❌ User not found in database for email:', email);
        console.log('========== [AUTH.AUTHORIZE] END ==========\n');
        return null;
      }
      
      console.log('[AUTH.AUTHORIZE] ✓ User found:', { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        hasPassword: !!user.password,
        passwordHashLength: user.password.length
      });
      
      console.log('[AUTH.AUTHORIZE] Comparing passwords...');
      console.log('[AUTH.AUTHORIZE] Input password:', password);
      console.log('[AUTH.AUTHORIZE] Stored hash:', user.password);
      
      const valid = await bcrypt.compare(password, user.password);
      
      console.log('[AUTH.AUTHORIZE] Password comparison result:', valid);
      
      if (!valid) {
        console.error('[AUTH.AUTHORIZE] ❌ Password mismatch');
        console.log('========== [AUTH.AUTHORIZE] END ==========\n');
        return null;
      }
      
      console.log('[AUTH.AUTHORIZE] ✓ Authentication successful');
      console.log('========== [AUTH.AUTHORIZE] END ==========\n');
      
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
    } catch (err) {
      console.error('[AUTH.AUTHORIZE] ❌ Exception caught:', err);
      console.error('[AUTH.AUTHORIZE] Error stack:', (err as Error)?.stack);
      console.log('========== [AUTH.AUTHORIZE] END ==========\n');
      return null;
    }
  },
});

const nextAuth = NextAuth({
  ...authConfig,
  providers: [credentials],
  session: { strategy: "jwt" },
  // Re-define callbacks to merge base config and ensure role persistence
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const isRole = (r: unknown): r is 'ADMIN' | 'ASSOCIATE' | 'VIEWER' =>
        r === 'ADMIN' || r === 'ASSOCIATE' || r === 'VIEWER';
      if (user && 'role' in user && isRole((user as { role?: 'ADMIN'|'ASSOCIATE'|'VIEWER' }).role)) {
        token.role = (user as { role?: 'ADMIN'|'ASSOCIATE'|'VIEWER' }).role;
      }
      return token;
    },
    async session({ session, token }) {
      const isRole = (r: unknown): r is 'ADMIN' | 'ASSOCIATE' | 'VIEWER' =>
        r === 'ADMIN' || r === 'ASSOCIATE' || r === 'VIEWER';
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (isRole(token.role)) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export const { handlers: { GET, POST }, auth, signIn, signOut } = nextAuth;
