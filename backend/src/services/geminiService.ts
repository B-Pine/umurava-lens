import { getGeminiClient } from '../config/gemini';
import { IJob } from '../models/Job';
import { ICandidate } from '../models/Candidate';

interface CandidateScreeningOutput {
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
}

interface ScreeningResponse {
  candidates: CandidateScreeningOutput[];
}

function buildCandidateProfile(candidate: ICandidate): string {
  const parts: string[] = [
    `Name: ${candidate.fullName}`,
    `Current Role: ${candidate.currentTitle} at ${candidate.currentCompany}`,
    `Location: ${candidate.location}`,
    `Years of Experience: ${candidate.yearsOfExperience}`,
    `Skills: ${candidate.skills.join(', ')}`,
    `Summary: ${candidate.summary}`,
  ];

  if (candidate.education.length > 0) {
    parts.push(
      `Education: ${candidate.education.map((e) => `${e.degree} from ${e.institution} (${e.year})`).join('; ')}`
    );
  }

  if (candidate.experience.length > 0) {
    parts.push(
      `Work History: ${candidate.experience.map((e) => `${e.title} at ${e.company} (${e.startDate} - ${e.endDate}): ${e.description}`).join(' | ')}`
    );
  }

  if (candidate.projects.length > 0) {
    parts.push(
      `Projects: ${candidate.projects.map((p) => `${p.name}: ${p.description} [${p.technologies.join(', ')}]`).join(' | ')}`
    );
  }

  if (candidate.certifications.length > 0) {
    parts.push(`Certifications: ${candidate.certifications.join(', ')}`);
  }

  return parts.join('\n');
}

export async function screenCandidates(
  job: IJob,
  candidates: ICandidate[]
): Promise<ScreeningResponse> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
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

  const prompt = `You are an expert AI recruitment screener for Umurava Lens, an AI talent intelligence platform.
Your task is to evaluate candidates against a specific job opening and produce a structured ranking.

## JOB DETAILS
Title: ${job.title}
Department: ${job.department}
Employment Type: ${job.employmentType}
Location: ${job.location}
Salary Range: ${job.salaryRange}
Experience Level: ${job.experienceLevel}
Required Skills: ${job.requiredSkills.join(', ')}
Description: ${job.description}

## AI SCORING WEIGHTS (configured by the recruiter)
- Technical Skills Weight: ${job.aiWeights.technicalSkills}%
- Years of Experience Weight: ${job.aiWeights.yearsOfExperience}%
- Education Credentials Weight: ${job.aiWeights.educationCredentials}%
- Past Project Impact Weight: ${job.aiWeights.pastProjectImpact}%

## CANDIDATES TO EVALUATE
${candidateProfiles.join('\n\n')}

## INSTRUCTIONS
1. Evaluate each candidate against the job requirements using the provided weights.
2. Score each candidate 0-100 based on overall fit.
3. Sub-score each dimension (technicalSkillsScore, experienceScore, educationScore, projectImpactScore) 0-100.
4. Rank candidates from best (1) to worst.
5. Provide 2-4 specific strengths per candidate.
6. Provide 1-3 specific gaps or risks per candidate.
7. Write a concise professional summary (2-3 sentences) for each.
8. Assign recommendation: "hire" (score >= 85), "consider" (score 70-84), "risky" (score < 70).
9. Assign confidence (0-100) indicating how certain you are of the assessment.

Be specific in strengths and gaps - reference actual skills, companies, and experience.
Do NOT give vague feedback. Every point must be actionable and evidence-based.

## REQUIRED JSON OUTPUT FORMAT
{
  "candidates": [
    {
      "candidateId": "<the MongoDB ObjectId string>",
      "score": <0-100>,
      "rank": <1-N>,
      "strengths": ["specific strength 1", "specific strength 2"],
      "gaps": ["specific gap 1"],
      "summary": "Professional summary of fit",
      "recommendation": "hire|consider|risky",
      "confidence": <0-100>,
      "technicalSkillsScore": <0-100>,
      "experienceScore": <0-100>,
      "educationScore": <0-100>,
      "projectImpactScore": <0-100>
    }
  ]
}

Return ONLY valid JSON. Sort candidates array by rank ascending (best first).`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  let parsed: ScreeningResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini returned invalid JSON response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
    throw new Error('Gemini response missing candidates array');
  }

  return parsed;
}
