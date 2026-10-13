import mongoose, { Schema, Document } from 'mongoose';
import type { Attempt, Submission } from '../domain';
import type { IAttemptRepository } from './types';

interface AttemptDoc extends Document {
  attemptId: string;
  problemSlug: string;
  anonymousUserId: string;
  status: string;
  currentRevisionNumber: number;
  createdAtStr: string;
  updatedAtStr: string;
}

const AttemptSchema = new Schema<AttemptDoc>({
  attemptId: { type: String, required: true, unique: true, index: true },
  problemSlug: { type: String, required: true, index: true },
  anonymousUserId: { type: String, required: true, index: true },
  status: { type: String, required: true, default: 'in_progress' },
  currentRevisionNumber: { type: Number, required: true, default: 0 },
  createdAtStr: { type: String, required: true },
  updatedAtStr: { type: String, required: true },
});

interface SubmissionDoc extends Document {
  submissionId: string;
  attemptId: string;
  revisionNumber: number;
  design: unknown;
  evaluation?: unknown;
  parentSubmissionId?: string;
  submittedAtStr: string;
}

const SubmissionSchema = new Schema<SubmissionDoc>({
  submissionId: { type: String, required: true, unique: true, index: true },
  attemptId: { type: String, required: true, index: true },
  revisionNumber: { type: Number, required: true },
  design: { type: Schema.Types.Mixed, required: true },
  evaluation: { type: Schema.Types.Mixed },
  parentSubmissionId: { type: String },
  submittedAtStr: { type: String, required: true },
});

// Guard against duplicate model compilation in test reloads
const AttemptModel =
  mongoose.models.Attempt || mongoose.model<AttemptDoc>('Attempt', AttemptSchema);
const SubmissionModel =
  mongoose.models.Submission || mongoose.model<SubmissionDoc>('Submission', SubmissionSchema);

function toAttempt(doc: AttemptDoc): Attempt {
  return {
    id: doc.attemptId,
    problemSlug: doc.problemSlug,
    anonymousUserId: doc.anonymousUserId,
    status: doc.status as 'in_progress' | 'completed',
    currentRevisionNumber: doc.currentRevisionNumber,
    createdAt: doc.createdAtStr,
    updatedAt: doc.updatedAtStr,
  };
}

function toSubmission(doc: SubmissionDoc): Submission {
  return {
    id: doc.submissionId,
    attemptId: doc.attemptId,
    revisionNumber: doc.revisionNumber,
    design: doc.design as Submission['design'],
    evaluation: doc.evaluation as Submission['evaluation'],
    parentSubmissionId: doc.parentSubmissionId,
    submittedAt: doc.submittedAtStr,
  };
}

export class MongoAttemptRepository implements IAttemptRepository {
  public getPersistenceMode(): 'in-memory' | 'mongodb' {
    return 'mongodb';
  }

  public async createAttempt(data: {
    problemSlug: string;
    anonymousUserId: string;
  }): Promise<Attempt> {
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const doc = await AttemptModel.create({
      attemptId: id,
      problemSlug: data.problemSlug,
      anonymousUserId: data.anonymousUserId,
      status: 'in_progress',
      currentRevisionNumber: 0,
      createdAtStr: now,
      updatedAtStr: now,
    });

    return toAttempt(doc);
  }

  public async getAttemptById(id: string): Promise<Attempt | null> {
    const doc = await AttemptModel.findOne({ attemptId: id }).exec();
    return doc ? toAttempt(doc) : null;
  }

  public async getAttemptsByUserId(userId: string): Promise<Attempt[]> {
    const docs = await AttemptModel.find({ anonymousUserId: userId })
      .sort({ createdAtStr: -1 })
      .exec();
    return docs.map(toAttempt);
  }

  public async updateAttempt(
    id: string,
    data: Partial<Pick<Attempt, 'status' | 'currentRevisionNumber'>>
  ): Promise<Attempt | null> {
    const updatePayload: Record<string, unknown> = {
      updatedAtStr: new Date().toISOString(),
    };
    if (data.status) updatePayload.status = data.status;
    if (data.currentRevisionNumber !== undefined) {
      updatePayload.currentRevisionNumber = data.currentRevisionNumber;
    }

    const doc = await AttemptModel.findOneAndUpdate(
      { attemptId: id },
      { $set: updatePayload },
      { new: true }
    ).exec();

    return doc ? toAttempt(doc) : null;
  }

  public async createSubmission(
    data: Omit<Submission, 'id' | 'submittedAt'>
  ): Promise<Submission> {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const doc = await SubmissionModel.create({
      submissionId: id,
      attemptId: data.attemptId,
      revisionNumber: data.revisionNumber,
      design: data.design,
      evaluation: data.evaluation,
      parentSubmissionId: data.parentSubmissionId,
      submittedAtStr: now,
    });

    return toSubmission(doc);
  }

  public async getSubmissionsByAttemptId(attemptId: string): Promise<Submission[]> {
    const docs = await SubmissionModel.find({ attemptId })
      .sort({ revisionNumber: 1 })
      .exec();
    return docs.map(toSubmission);
  }

  public async getSubmissionById(id: string): Promise<Submission | null> {
    const doc = await SubmissionModel.findOne({ submissionId: id }).exec();
    return doc ? toSubmission(doc) : null;
  }

  public async getLatestSubmission(attemptId: string): Promise<Submission | null> {
    const doc = await SubmissionModel.findOne({ attemptId })
      .sort({ revisionNumber: -1 })
      .exec();
    return doc ? toSubmission(doc) : null;
  }
}

export const mongoAttemptRepository = new MongoAttemptRepository();
