import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { MongoClient } from "mongodb"

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      // Define the authentication logic
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Connect to MongoDB
        const client = new MongoClient(MONGODB_URI!)
        await client.connect()

        const db = client.db()
        const usersCollection = db.collection("users")

        // Find user by username
        const user = await usersCollection.findOne({ username: credentials.username })

        // Close MongoDB connection
        await client.close()

        if (!user) {
          return null
        }

        // Compare password with hashed password in database
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Omit the password from the user object
        const { password, ...userWithoutPassword } = user

        return userWithoutPassword
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id
        token.username = user.username
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
}
