import { getGeminiClient } from '../config/gemini';
import { IJob } from '../models/Job';
import { ICandidate } from '../models/Candidate';

function extractJson(raw: string): any {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) text = fence[1].trim();
  const start = text.search(/[{[]/);
  if (start === -1) throw new Error('No JSON object found in Gemini response');
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error('Unbalanced JSON in Gemini response');
  return JSON.parse(text.slice(start, end + 1));
}

export interface CandidateScreeningOutput {
  candidateId: string;
  score: number;
  rank: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  recommendation: 'hire' | 'consider' | 'risky';
  confidence: number;
  technicalSkillsScore: number;
  experienceScore: number;
  educationScore: number;
  projectImpactScore: number;
  emailSubject: string;
  emailDraft: string;
}

export interface ScreeningResponse {
  candidates: CandidateScreeningOutput[];
}

function computeYears(experience: ICandidate['experience']): number {
  if (!experience || experience.length === 0) return 0;
  let total = 0;
  for (const exp of experience) {
    const start = parseInt((exp.startDate || '').slice(0, 4), 10);
    const endStr = exp.isCurrent ? String(new Date().getFullYear()) : (exp.endDate || '').slice(0, 4);
    const end = parseInt(endStr, 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      total += end - start;
    }
  }
  return total;
}

function buildCandidateProfile(candidate: ICandidate): string {
  const parts: string[] = [
    `Name: ${candidate.firstName} ${candidate.lastName}`,
    `Email: ${candidate.email}`,
    `Headline: ${candidate.headline || '(not provided)'}`,
    `Location: ${candidate.location || '(not provided)'}`,
    `Total Years of Experience: ${computeYears(candidate.experience)}`,
  ];

  if (candidate.bio) {
    parts.push(`Bio: ${candidate.bio}`);
  }

  if (candidate.availability) {
    parts.push(
      `Availability: ${candidate.availability.status} - ${candidate.availability.type}${candidate.availability.startDate ? ` (from ${candidate.availability.startDate})` : ''}`
    );
  }

  if (candidate.skills && candidate.skills.length > 0) {
    parts.push(
      `Skills: ${candidate.skills
        .map((s) => `${s.name} (${s.level}, ${s.yearsOfExperience}y)`)
        .join(', ')}`
    );
  }

  if (candidate.languages && candidate.languages.length > 0) {
    parts.push(
      `Languages: ${candidate.languages
        .map((l) => `${l.name} (${l.proficiency})`)
        .join(', ')}`
    );
  }

  if (candidate.education && candidate.education.length > 0) {
    parts.push(
      `Education: ${candidate.education
        .map(
          (e) =>
            `${e.degree}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''} from ${e.institution} (${e.startYear || '?'}-${e.endYear || '?'})`
        )
        .join('; ')}`
    );
  }

  if (candidate.experience && candidate.experience.length > 0) {
    parts.push(
      `Work History: ${candidate.experience
        .map(
          (e) =>
            `${e.role} at ${e.company} (${e.startDate}-${e.isCurrent ? 'Present' : e.endDate}): ${e.description}${e.technologies?.length ? ` [Tech: ${e.technologies.join(', ')}]` : ''}`
        )
        .join(' | ')}`
    );
  }

  if (candidate.projects && candidate.projects.length > 0) {
    parts.push(
      `Projects: ${candidate.projects
        .map(
          (p) =>
            `${p.name}${p.role ? ` (${p.role})` : ''}: ${p.description}${p.technologies?.length ? ` [${p.technologies.join(', ')}]` : ''}`
        )
        .join(' | ')}`
    );
  }

  if (candidate.certifications && candidate.certifications.length > 0) {
    parts.push(
      `Certifications: ${candidate.certifications
        .map((c) => `${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.issueDate ? ` (${c.issueDate})` : ''}`)
        .join(', ')}`
    );
  }

  return parts.join('\n');
}

export async function screenCandidates(
  job: IJob,
  candidates: ICandidate[]
): Promise<ScreeningResponse> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      topK: 40,
      responseMimeType: 'application/json',
    },
  });

  const candidateProfiles = candidates.map(
    (c, i) => `--- CANDIDATE ${i + 1} (ID: ${c._id}) ---\n${buildCandidateProfile(c)}`
  );

  const passingScore = job.passingScore ?? 70;
  const shortlistCap = job.shortlistCap ?? 20;

  const prompt = `You are an expert AI recruitment screener for Umurava Lens.
Your task is to evaluate candidates against a specific job opening and produce a structured, explainable ranking that a human recruiter will use to make the final hiring decision. The recruiter — not you — makes the final call. Your job is to inform it.

## JOB DETAILS
Title: ${job.title}
Department: ${job.department}
Employment Type: ${job.employmentType}
Location: ${job.location}
Salary Range: ${job.salaryRange}
Experience Level: ${job.experienceLevel}
Required Skills: ${job.requiredSkills.join(', ')}
Description: ${job.description}
Passing Score: ${passingScore} / 100

## AI SCORING WEIGHTS (configured by the recruiter)
- Technical Skills Weight: ${job.aiWeights.technicalSkills}%
- Years of Experience Weight: ${job.aiWeights.yearsOfExperience}%
- Education Credentials Weight: ${job.aiWeights.educationCredentials}%
- Past Project Impact Weight: ${job.aiWeights.pastProjectImpact}%

## CANDIDATES TO EVALUATE
${candidateProfiles.join('\n\n')}

## INSTRUCTIONS
1. Evaluate each candidate against the job requirements using the provided weights.
2. Score each candidate 0-100 based on overall fit (apply the weights).
3. Sub-score each dimension (technicalSkillsScore, experienceScore, educationScore, projectImpactScore) 0-100.
4. Rank candidates from best (1) to worst.
5. Provide 2-4 specific strengths per candidate — reference concrete skills, companies, tech stacks, or projects from their profile. No vague platitudes.
6. Provide 1-3 specific gaps or risks per candidate — actionable and evidence-based.
7. Write a concise professional summary (2-3 sentences) per candidate.
8. Assign recommendation: "hire" (score >= 85), "consider" (score 70-84), "risky" (score < 70).
9. Assign confidence (0-100) indicating how certain you are of the assessment given the data available.
10. Draft a professional, warm outreach email that the recruiter can review, edit, and send:
    - If score >= ${passingScore}: interview invitation. Reference 1-2 concrete strengths. 4-8 sentences. Address the candidate by first name. Sign off as "The Umurava Talent Team".
    - If score < ${passingScore}: a respectful, humane decline that thanks them and encourages them to apply to future roles. 3-5 sentences. Do NOT list gaps or reasons — keep it graceful.
    - emailSubject should be short and clear.

Be evidence-based everywhere. Every strength, gap, and email reference must tie to data in the candidate's profile.

## REQUIRED JSON OUTPUT FORMAT
{
  "candidates": [
    {
      "candidateId": "<MongoDB ObjectId string>",
      "score": <0-100>,
      "rank": <1-N>,
      "strengths": ["specific strength 1", "specific strength 2"],
      "gaps": ["specific gap 1"],
      "summary": "Professional fit assessment",
      "recommendation": "hire|consider|risky",
      "confidence": <0-100>,
      "technicalSkillsScore": <0-100>,
      "experienceScore": <0-100>,
      "educationScore": <0-100>,
      "projectImpactScore": <0-100>,
      "emailSubject": "Subject line",
      "emailDraft": "Full email body with line breaks as \\n"
    }
  ]
}

Return ONLY valid JSON. Sort the candidates array by rank ascending (best first). You MUST return exactly ${candidates.length} candidate entries — one per input.

NOTE: The top ${shortlistCap} candidates by rank will be flagged as "shortlisted" downstream, but you MUST still return every candidate so the recruiter has full context.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let parsed: ScreeningResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = extractJson(text);
  }

  if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
    throw new Error('Gemini response missing candidates array');
  }

  return parsed;
}

export async function extractCandidateFromCV(text: string): Promise<any> {
  const model = getGeminiClient().getGenerativeModel({
    model: 'gemini-3.1-flash-lite-preview',
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `You are an expert Talent Acquisition AI extracting structured data from a CV.
Return ONLY a valid JSON object matching the Umurava Talent Profile Schema below. Do not invent data. If a field is missing, use the defaults indicated.

{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required, lowercase)",
  "phone": "string (default: '')",
  "headline": "string — short professional summary, e.g. 'Backend Engineer – Node.js & AI Systems' (required)",
  "bio": "string — longer professional biography (default: '')",
  "location": "string — City, Country (required)",
  "skills": [
    { "name": "string", "level": "Beginner|Intermediate|Advanced|Expert", "yearsOfExperience": <number> }
  ],
  "languages": [
    { "name": "string", "proficiency": "Basic|Conversational|Fluent|Native" }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or 'Present'",
      "description": "string",
      "technologies": ["string"],
      "isCurrent": <boolean>
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startYear": <number>,
      "endYear": <number>
    }
  ],
  "certifications": [
    { "name": "string", "issuer": "string", "issueDate": "YYYY-MM" }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "role": "string",
      "link": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM"
    }
  ],
  "availability": {
    "status": "Available|Open to Opportunities|Not Available",
    "type": "Full-time|Part-time|Contract",
    "startDate": "YYYY-MM-DD (optional)"
  },
  "socialLinks": {
    "linkedin": "string URL",
    "github": "string URL",
    "portfolio": "string URL"
  }
}

Rules:
- Split full name into firstName/lastName. If only one token, put it in firstName and set lastName to ''.
- Infer skill level from phrasing ("expert in", "familiar with", years of use). When unclear, default to "Intermediate".
- Set isCurrent:true if role's endDate is missing, 'Present', 'Current', or 'Now'.
- If availability cannot be inferred, use { "status": "Open to Opportunities", "type": "Full-time" }.
- Return empty arrays for missing list fields, never null.

CV TEXT:
${text.substring(0, 30000)}
`;

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const data = extractJson(responseText);
      return normalizeCandidate(data);
    } catch (error: any) {
      const isRetryable = error?.status === 503 || error?.status === 429;
      console.error(`Gemini Parse CV Error (attempt ${attempt}/${MAX_RETRIES}):`, error?.message || error);
      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error(`Failed to parse CV: ${error?.message || 'Unknown Gemini error'}`);
    }
  }
  throw new Error('Failed to parse CV after maximum retries.');
}

/**
 * Normalize AI extraction output to match the Candidate schema strictly,
 * so Mongoose inserts never fail on enum/required mismatches.
 */
export function normalizeCandidate(raw: any): any {
  const safe = raw || {};

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const langProfs = ['Basic', 'Conversational', 'Fluent', 'Native'];
  const availStatus = ['Available', 'Open to Opportunities', 'Not Available'];
  const availType = ['Full-time', 'Part-time', 'Contract'];

  return {
    firstName: (safe.firstName || '').toString().trim() || 'Unknown',
    lastName: (safe.lastName || '').toString().trim() || '',
    email: (safe.email || '').toString().toLowerCase().trim(),
    phone: (safe.phone || '').toString(),
    headline: (safe.headline || '').toString(),
    bio: (safe.bio || '').toString(),
    location: (safe.location || '').toString(),
    skills: Array.isArray(safe.skills)
      ? safe.skills
          .filter((s: any) => s && s.name)
          .map((s: any) => ({
            name: String(s.name),
            level: skillLevels.includes(s.level) ? s.level : 'Intermediate',
            yearsOfExperience: Number(s.yearsOfExperience) || 0,
          }))
      : [],
    languages: Array.isArray(safe.languages)
      ? safe.languages
          .filter((l: any) => l && l.name)
          .map((l: any) => ({
            name: String(l.name),
            proficiency: langProfs.includes(l.proficiency) ? l.proficiency : 'Conversational',
          }))
      : [],
    experience: Array.isArray(safe.experience)
      ? safe.experience
          .filter((e: any) => e && (e.company || e.role))
          .map((e: any) => ({
            company: String(e.company || ''),
            role: String(e.role || e.title || ''),
            startDate: String(e.startDate || ''),
            endDate: String(e.endDate || ''),
            description: String(e.description || ''),
            technologies: Array.isArray(e.technologies) ? e.technologies.map(String) : [],
            isCurrent: Boolean(e.isCurrent) || /present|current|now/i.test(String(e.endDate || '')),
          }))
      : [],
    education: Array.isArray(safe.education)
      ? safe.education
          .filter((e: any) => e && e.institution)
          .map((e: any) => ({
            institution: String(e.institution),
            degree: String(e.degree || ''),
            fieldOfStudy: String(e.fieldOfStudy || ''),
            startYear: Number(e.startYear) || 0,
            endYear: Number(e.endYear) || Number(e.year) || 0,
          }))
      : [],
    certifications: Array.isArray(safe.certifications)
      ? safe.certifications
          .filter((c: any) => c && c.name)
          .map((c: any) => ({
            name: String(c.name),
            issuer: String(c.issuer || ''),
            issueDate: String(c.issueDate || ''),
          }))
      : [],
    projects: Array.isArray(safe.projects)
      ? safe.projects
          .filter((p: any) => p && p.name)
          .map((p: any) => ({
            name: String(p.name),
            description: String(p.description || ''),
            technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
            role: String(p.role || ''),
            link: String(p.link || ''),
            startDate: String(p.startDate || ''),
            endDate: String(p.endDate || ''),
          }))
      : [],
    availability: {
      status: availStatus.includes(safe.availability?.status)
        ? safe.availability.status
        : 'Open to Opportunities',
      type: availType.includes(safe.availability?.type) ? safe.availability.type : 'Full-time',
      startDate: safe.availability?.startDate || undefined,
    },
    socialLinks: {
      linkedin: String(safe.socialLinks?.linkedin || ''),
      github: String(safe.socialLinks?.github || ''),
      portfolio: String(safe.socialLinks?.portfolio || ''),
    },
  };
}
