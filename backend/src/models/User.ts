import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'recruiter';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'recruiter'], default: 'recruiter' },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
