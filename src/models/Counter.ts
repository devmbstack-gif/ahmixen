import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const CounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    collection: 'counters',
  }
);

export type CounterDocument = InferSchemaType<typeof CounterSchema> & {
  _id: string;
};

export const Counter: Model<CounterDocument> =
  (mongoose.models.Counter as Model<CounterDocument>) ||
  mongoose.model<CounterDocument>('Counter', CounterSchema);
