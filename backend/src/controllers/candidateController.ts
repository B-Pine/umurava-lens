import { Request, Response } from 'express';
import { Readable } from 'stream';
import csv from 'csv-parser';
import Candidate from '../models/Candidate';
import Job from '../models/Job';
import { extractCandidateFromCV, normalizeCandidate } from '../services/geminiService';

// pdf-parse is loaded via require so it works with both old and new versions
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse;
const pdfParseFn = typeof pdfParseModule === 'function' ? pdfParseModule : null;

async function extractPdfText(buffer: Buffer): Promise<string> {
  if (PDFParse) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const data = await parser.getText();
    return data.text || '';
  }
  if (pdfParseFn) {
    const data = await pdfParseFn(buffer);
    return data.text || '';
  }
  throw new Error('No PDF parser available');
}

export const uploadCandidates = async (req: Request, res: Response) => {
  try {
    const { candidates, jobId } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: 'candidates array is required' });
    }

    const normalized = candidates.map((c: any) => ({
      ...normalizeCandidate(c),
      source: c.source || 'Umurava Platform',
      jobId: jobId || null,
    }));

    const created = await Candidate.insertMany(normalized, { ordered: false });

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantCount: created.length },
      });
    }

    res.status(201).json({
      message: `${created.length} candidates uploaded successfully`,
      candidates: created,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadCandidateFiles = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const parsedCandidates: any[] = [];
    const failed: { file: string; reason: string }[] = [];

    for (const file of files) {
      if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
        failed.push({ file: file.originalname, reason: 'Not a PDF file' });
        continue;
      }
      try {
        const text = await extractPdfText(file.buffer);
        if (!text.trim()) {
          failed.push({ file: file.originalname, reason: 'PDF contains no extractable text' });
          continue;
        }
        const extracted = await extractCandidateFromCV(text);
        parsedCandidates.push({
          ...extracted,
          source: 'PDF',
          jobId: jobId || null,
        });
      } catch (err: any) {
        console.error(`Failed to parse ${file.originalname}:`, err?.message || err);
        failed.push({ file: file.originalname, reason: err?.message || 'Parse error' });
      }
    }

    if (parsedCandidates.length === 0) {
      return res.status(400).json({
        error: 'No valid PDFs were processed',
        failed,
      });
    }

    const created = await Candidate.insertMany(parsedCandidates, { ordered: false });

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicantCount: created.length },
      });
    }

    res.status(201).json({
      message: `${created.length} of ${files.length} candidates parsed and uploaded successfully`,
      candidates: created,
      failed,
    });
  } catch (error: any) {
    console.error('File Upload Error:', error);
    res.status(500).json({ error: error.message || 'File parsing failed' });
  }
};

export const uploadCandidatesCsv = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No CSV files uploaded' });
    }

    const allRows: any[] = [];
    const failed: { file: string; reason: string }[] = [];

    for (const file of files) {
      const isCsv =
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.toLowerCase().endsWith('.csv');
      if (!isCsv) {
        failed.push({ file: file.originalname, reason: 'Not a CSV file' });
        continue;
      }

      try {
        const rows = await parseCsvBuffer(file.buffer);
        for (const row of rows) {
          const candidate = rowToCandidate(row);
          if (candidate) allRows.push(candidate);
        }
      } catch (err: any) {
        failed.push({ file: file.originalname, reason: err?.message || 'CSV parse error' });
      }
    }

    if (allRows.length === 0) {
      return res.status(400).json({ error: 'No valid rows found in CSV', failed });
    }

    const docs = allRows.map((c) => ({
      ...c,
      source: 'CSV',
      jobId: jobId || null,
    }));

    const created = await Candidate.insertMany(docs, { ordered: false });

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: created.length } });
    }

    res.status(201).json({
      message: `${created.length} candidates imported from CSV`,
      candidates: created,
      failed,
    });
  } catch (error: any) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: error.message || 'CSV upload failed' });
  }
};

function parseCsvBuffer(buffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    Readable.from(buffer)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Flexible CSV column mapping — accepts a variety of common column names and
 * maps them onto the Talent Profile Schema.
 *
 * Simple list columns (Skills, Languages) are split on commas or semicolons.
 *
 * Rich record columns (Experience, Projects, Education) use:
 *   - `||` between records
 *   - `|` between fields within a record
 *   - `;` between tags inside the "technologies" sub-field
 *
 * Experience fields:   Company|Role|Start|End|Description|Tech1;Tech2
 * Projects fields:     Name|Description|Tech1;Tech2|Role|Link
 * Education fields:    Institution|Degree|FieldOfStudy|StartYear|EndYear
 */
function rowToCandidate(row: Record<string, string>): any | null {
  const get = (...keys: string[]): string => {
    for (const k of keys) {
      for (const actual of Object.keys(row)) {
        if (actual.toLowerCase().trim() === k.toLowerCase()) {
          return (row[actual] || '').toString().trim();
        }
      }
    }
    return '';
  };

  const fullName = get('full name', 'name', 'fullname');
  let firstName = get('first name', 'firstname', 'given name');
  let lastName = get('last name', 'lastname', 'surname', 'family name');
  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ');
  }

  const email = get('email', 'e-mail', 'mail');
  if (!email && !firstName) return null;

  const splitList = (v: string) =>
    v
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const skillsRaw = splitList(get('skills', 'skill'));
  const languagesRaw = splitList(get('languages', 'language'));

  const experience = parseMultiRecord(
    get('experience', 'work experience', 'work history'),
    ['company', 'role', 'startDate', 'endDate', 'description', 'technologies']
  );
  const projects = parseMultiRecord(
    get('projects', 'project', 'portfolio'),
    ['name', 'description', 'technologies', 'role', 'link']
  );
  const education = parseMultiRecord(get('education', 'school'), [
    'institution',
    'degree',
    'fieldOfStudy',
    'startYear',
    'endYear',
  ]);
  const certifications = parseMultiRecord(get('certifications', 'certification'), [
    'name',
    'issuer',
    'issueDate',
  ]);

  const availabilityStatus = get('availability status', 'availability') || 'Open to Opportunities';
  const availabilityType = get('availability type', 'employment type', 'work type') || 'Full-time';

  // If a Years Experience hint is provided but experience[] is empty, stamp it
  // onto the skills so the AI still has the number visible.
  const yearsHint = parseInt(get('years experience', 'years of experience', 'years'), 10);
  const enrichedSkills = skillsRaw.map((name, idx) => ({
    name,
    level: 'Intermediate' as const,
    yearsOfExperience: idx === 0 && !isNaN(yearsHint) ? yearsHint : 0,
  }));

  return normalizeCandidate({
    firstName,
    lastName,
    email,
    phone: get('phone', 'tel', 'mobile'),
    headline: get('headline', 'title', 'current title', 'role'),
    bio: get('bio', 'summary', 'about'),
    location: get('location', 'city', 'country'),
    skills: enrichedSkills,
    languages: languagesRaw.map((name) => ({ name, proficiency: 'Conversational' as const })),
    education,
    experience,
    projects,
    certifications,
    availability: {
      status: availabilityStatus,
      type: availabilityType,
    },
    socialLinks: {
      linkedin: get('linkedin', 'linkedin url'),
      github: get('github', 'github url'),
      portfolio: get('portfolio', 'website'),
    },
  });
}

function parseMultiRecord(raw: string, fields: string[]): any[] {
  if (!raw) return [];
  return raw
    .split('||')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split('|').map((s) => s.trim());
      const obj: any = {};
      fields.forEach((f, i) => {
        const v = parts[i] || '';
        if (f === 'technologies') {
          obj[f] = v
            .split(/[;,]/)
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (f === 'startYear' || f === 'endYear') {
          const n = parseInt(v, 10);
          obj[f] = isNaN(n) ? 0 : n;
        } else {
          obj[f] = v;
        }
      });
      if (fields.includes('endDate')) {
        obj.isCurrent = !obj.endDate || /present|current|now|ongoing/i.test(obj.endDate);
      }
      // Drop entries where every populated field is empty/array-empty.
      const hasContent = Object.values(obj).some((v) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'number') return v > 0;
        return Boolean(v);
      });
      return hasContent ? obj : null;
    })
    .filter((x): x is any => x !== null);
}

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const { jobId, page = '1', limit = '50', dateFrom, dateTo, search } = req.query;
    const filter: any = {};
    if (jobId) {
      filter.jobId = jobId === 'unassigned' ? null : jobId;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (search) {
      const re = new RegExp((search as string).trim(), 'i');
      filter.$or = [
        { firstName: re },
        { lastName: re },
        { email: re },
        { headline: re },
        { 'skills.name': re },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [candidates, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Candidate.countDocuments(filter),
    ]);

    res.json({
      candidates,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    if (candidate.jobId) {
      await Job.findByIdAndUpdate(candidate.jobId, { $inc: { applicantCount: -1 } });
    }
    res.json({ message: 'Candidate deleted', id: candidate._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCandidates = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const targets = await Candidate.find({ _id: { $in: ids } }, { jobId: 1 });
    const counts: Record<string, number> = {};
    for (const t of targets) {
      if (t.jobId) {
        const k = String(t.jobId);
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    await Candidate.deleteMany({ _id: { $in: ids } });
    await Promise.all(
      Object.entries(counts).map(([jobId, n]) =>
        Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: -n } })
      )
    );
    res.json({ message: 'Candidates deleted', deleted: targets.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

