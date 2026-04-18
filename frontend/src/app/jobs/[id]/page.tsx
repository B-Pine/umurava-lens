'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-surface-container-high rounded w-1/3"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/4"></div>
          <div className="h-32 bg-surface-container-high rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="px-4 text-center py-20">
        <h2 className="text-2xl font-bold text-error mb-2">Error</h2>
        <p className="text-on-surface-variant">{error || 'Job not found'}</p>
        <button onClick={() => router.push('/jobs')} className="mt-4 text-secondary hover:underline">
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6 uppercase tracking-widest">
        <Link href="/jobs" className="hover:text-secondary">Jobs</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-secondary">{job.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-2">{job.title}</h2>
          <p className="text-on-surface-variant text-sm">
            {job.department} &bull; {job.location} &bull; {job.employmentType} &bull; {job.salaryRange}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {job.status === 'draft' ? (
            <Link href={`/jobs/${job._id}/edit?publish=1`} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all">
              Complete &amp; Publish
            </Link>
          ) : (
            <>
              <Link href={`/jobs/${job._id}/edit`} className="px-6 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-highest transition-colors">
                Edit Job
              </Link>
              <Link href={`/jobs/${job._id}/shortlist`} className="px-6 py-2.5 bg-secondary text-white rounded-xl font-bold hover:bg-secondary-container hover:shadow-lg transition-all">
                View Shortlist
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Job Description</h3>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(job.requiredSkills || []).map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-lg text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
            <h3 className="text-lg font-bold mb-4">AI Weights Core</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Technical Match</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: `${job.aiWeights?.technicalSkills || 85}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Experience Level</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: `${job.aiWeights?.yearsOfExperience || 40}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Education Fit</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: `${job.aiWeights?.educationCredentials || 25}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-container text-white p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-2">Metrics</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-primary-container text-sm">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${job.status === 'active' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface'}`}>{job.status?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-primary-container text-sm">Applicants</span>
              <span className="font-bold">{job.applicantCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-primary-container text-sm">Screened</span>
              <span className="font-bold">{job.screenedCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
