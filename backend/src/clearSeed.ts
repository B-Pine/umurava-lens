import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from './models/Job';
import Candidate from './models/Candidate';
import ScreeningResult from './models/ScreeningResult';
import { connectDatabase } from './config/database';

dotenv.config();

const seedTitles = [
  'Senior AI Research Engineer',
  'Backend Lead',
  'Product Design Director'
];

async function clearSeedData() {
  try {
    await connectDatabase();
    console.log('Connected to DB. Finding seed jobs...');

    const jobsToDelete = await Job.find({ title: { $in: seedTitles } });
    if (jobsToDelete.length === 0) {
      console.log('No seed jobs found.');
    } else {
      for (const job of jobsToDelete) {
        console.log(`Deleting ${job.title} and its candidates...`);
        await Candidate.deleteMany({ jobId: job._id });
        await ScreeningResult.deleteMany({ jobId: job._id });
        await Job.findByIdAndDelete(job._id);
      }
      console.log('Seed jobs, candidates, and screening results cleared successfully.');
    }

    // Attempt to also wipe all candidates if they have no jobId or attached to a deleted job
    const candidatesDeleted = await Candidate.deleteMany({ email: { $regex: /@email.com$/ }});
    console.log(`Cleaned up ${candidatesDeleted.deletedCount} remaining seed candidates.`);

    process.exit(0);
  } catch (err: any) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clearSeedData();
